import cron from "node-cron";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  salonAgeCategories,
  salonAppointments,
  salonServices,
  salonUsers,
} from "@workspace/db/schema";
import { logger } from "../lib/logger";
import { sendWhatsAppMessage } from "../integrations/whatsapp";
import { getMessageTemplate, renderMessage } from "../lib/message-templates";
import {
  getAppointmentTimestamp,
  getDueAppointmentReminders,
  getMinutesUntilAppointment,
  isCompletedReviewDue,
} from "./appointment-reminder-logic";

const TIME_ZONE = process.env.SALON_TIME_ZONE ?? "Asia/Jerusalem";
const REMINDER_SWEEP_LOCK_KEY = "al-baron:appointment-reminder-sweep";
type ReminderTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type ReminderTemplates = {
  oneHour: string;
  review: string;
  rebooking: string;
};
let running = false;
let schedulerStarted = false;

async function sendMessageOrThrow(phone: string, message: string, label: string) {
  const sent = await sendWhatsAppMessage(phone, message);
  if (!sent) {
    throw new Error(`WhatsApp ${label} did not return a message id`);
  }
}

function defaultAdditionalMinutesForCategory(category: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes("طف") || normalized.includes("child")) return 10;
  if (normalized.includes("شب") || normalized.includes("teen")) return 20;
  return 25;
}

function participantCategoriesForAppointment(
  appointment: typeof salonAppointments.$inferSelect,
) {
  const fallback = Array.from(
    { length: Math.max(1, appointment.guestCount) },
    (_, index) => index === 0 ? appointment.ageCategory : "بالغون",
  );
  try {
    const parsed = JSON.parse(appointment.participantCategories);
    if (
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      parsed.every((item) => typeof item === "string") &&
      (parsed.length === appointment.guestCount || appointment.guestCount === 1)
    ) {
      return parsed as string[];
    }
  } catch {
    // Keep the legacy age-category fallback.
  }
  return fallback;
}

function appointmentDurationMinutes(
  appointment: typeof salonAppointments.$inferSelect,
  durationByService: Map<string, number>,
  additionalDurationByCategory: Map<string, number | null>,
) {
  const baseDuration = Math.max(1, durationByService.get(appointment.service) ?? 30);
  const extraDuration = participantCategoriesForAppointment(appointment)
    .slice(1)
    .reduce(
      (total, category) =>
        total +
        (additionalDurationByCategory.get(category) ??
          defaultAdditionalMinutesForCategory(category)),
      0,
    );
  return Math.ceil((baseDuration + extraDuration) / 20) * 20;
}

async function processAppointmentReminders() {
  if (running) return;
  running = true;
  const now = Date.now();
  try {
    const [oneHour, review, rebooking] = await Promise.all([
      getMessageTemplate("one_hour_reminder"),
      getMessageTemplate("review_request"),
      getMessageTemplate("rebooking_reminder"),
    ]);
    await db.transaction(async (tx) => {
      const lockResult = await tx.execute<{ locked: boolean }>(
        sql`select pg_try_advisory_xact_lock(hashtext(${REMINDER_SWEEP_LOCK_KEY})) as locked`,
      );
      if (!lockResult.rows[0]?.locked) {
        logger.debug("Appointment reminder sweep skipped because another process holds the lock");
        return;
      }
      // The lock and this transaction live on the same dedicated connection.
      // A crash after WhatsApp accepts a message but before this transaction
      // commits can still cause a retry; an external provider cannot offer
      // exactly-once delivery to this database flag.
      await processAppointmentRemindersInTransaction(tx, now, {
        oneHour,
        review,
        rebooking,
      });
    });
  } catch (error) {
    logger.error({ err: error }, "Appointment reminder sweep failed");
  } finally {
    running = false;
  }
}

async function processAppointmentRemindersInTransaction(
  tx: ReminderTransaction,
  now: number,
  templates: ReminderTemplates,
) {
    const appointments = await tx.select().from(salonAppointments)
      .where(inArray(salonAppointments.status, ["confirmed", "completed"]));
    const services = await tx.select({
      name: salonServices.name,
      duration: salonServices.duration,
    }).from(salonServices);
    const ageCategories = await tx.select({
      name: salonAgeCategories.name,
      additionalMinutes: salonAgeCategories.additionalMinutes,
    }).from(salonAgeCategories);
    const durationByService = new Map(services.map((service) => [service.name, service.duration]));
    const additionalDurationByCategory = new Map(
      ageCategories.map((category) => [category.name, category.additionalMinutes]),
    );
    const oneHourTemplate = templates.oneHour;
    const reviewTemplate = templates.review;
    const rebookingTemplate = templates.rebooking;
    for (const appointment of appointments) {
      if (!appointment.phone) continue;
      const minutesUntil = getMinutesUntilAppointment(
        appointment.date,
        appointment.time,
        now,
        TIME_ZONE,
      );
      if (!Number.isFinite(minutesUntil)) continue;
      const serviceDuration = appointmentDurationMinutes(
        appointment,
        durationByService,
        additionalDurationByCategory,
      );
      const dueReminders = getDueAppointmentReminders(
        appointment,
        now,
        TIME_ZONE,
      );
    const isReviewWindow = isCompletedReviewDue(
      appointment.status,
      minutesUntil,
      serviceDuration,
      appointment.reviewRequestSent,
    );

      if (dueReminders.includes("oneHour")) {
        const message = renderMessage(oneHourTemplate, {
          name: appointment.name,
          date: appointment.date,
          time: appointment.time,
          service: appointment.service,
          barber: appointment.barber,
        });
        try {
          await sendMessageOrThrow(appointment.phone, message, "one-hour reminder");
          await tx.update(salonAppointments).set({
            reminderOneHourSent: true,
            reminderSent: true,
            updatedAt: new Date(),
          }).where(and(
            eq(salonAppointments.id, appointment.id),
            eq(salonAppointments.status, "confirmed"),
            eq(salonAppointments.reminderOneHourSent, false),
          ));
          logger.info({ appointmentId: appointment.id }, "Sent one-hour WhatsApp appointment reminder");
        } catch (error) {
          logger.warn({ err: error, appointmentId: appointment.id }, "One-hour WhatsApp reminder deferred");
        }
      }

      if (dueReminders.includes("twentyMinute")) {
        const message = `أهلاً ${appointment.name}، موعدك في صالون البارون بعد 20 دقيقة.\nالوقت: ${appointment.time}\nالخدمة: ${appointment.service}\nيرجى التوجه للصالون.`;
        try {
          await sendMessageOrThrow(appointment.phone, message, "twenty-minute reminder");
          await tx.update(salonAppointments).set({
            reminderTwentyMinuteSent: true,
            reminderSent: true,
            updatedAt: new Date(),
          }).where(and(
            eq(salonAppointments.id, appointment.id),
            eq(salonAppointments.status, "confirmed"),
            eq(salonAppointments.reminderTwentyMinuteSent, false),
          ));
          logger.info({ appointmentId: appointment.id }, "Sent twenty-minute WhatsApp appointment reminder");
        } catch (error) {
          logger.warn({ err: error, appointmentId: appointment.id }, "Twenty-minute WhatsApp reminder deferred");
        }
      }

      if (isReviewWindow && !appointment.reviewRequestSent) {
        const message = renderMessage(reviewTemplate, {
          name: appointment.name,
          date: appointment.date,
          time: appointment.time,
          service: appointment.service,
          barber: appointment.barber,
        });
        try {
          await sendMessageOrThrow(appointment.phone, message, "review request");
          await tx.update(salonAppointments).set({
            reviewRequestSent: true,
            updatedAt: new Date(),
          }).where(and(
            eq(salonAppointments.id, appointment.id),
            eq(salonAppointments.status, "completed"),
            eq(salonAppointments.reviewRequestSent, false),
          ));
          logger.info({ appointmentId: appointment.id }, "Sent post-service WhatsApp review request");
        } catch (error) {
          logger.warn({ err: error, appointmentId: appointment.id }, "Post-service review WhatsApp request deferred");
        }
      }
    }

  await processRebookingReminders(tx, appointments, rebookingTemplate, now);
}

async function processRebookingReminders(
  tx: ReminderTransaction,
  appointments: typeof salonAppointments.$inferSelect[],
  rebookingTemplate: string,
  now: number,
) {
  const users = await tx.select().from(salonUsers).where(eq(salonUsers.role, "client"));
  const appointmentsByPhone = new Map<string, typeof appointments>();
  for (const appointment of appointments) {
    if (appointment.status !== "completed" || !appointment.phone) continue;
    const timestamp = getAppointmentTimestamp(
      appointment.date,
      appointment.time,
      TIME_ZONE,
    );
    if (!Number.isFinite(timestamp) || timestamp >= now) continue;
    const rows = appointmentsByPhone.get(appointment.phone) ?? [];
    rows.push(appointment);
    appointmentsByPhone.set(appointment.phone, rows);
  }

  for (const user of users) {
    const history = (appointmentsByPhone.get(user.phone) ?? [])
      .sort((a, b) => getAppointmentTimestamp(a.date, a.time, TIME_ZONE) - getAppointmentTimestamp(b.date, b.time, TIME_ZONE));
    if (history.length < 2) continue;
    const starts = history.map((appointment) => getAppointmentTimestamp(
      appointment.date,
      appointment.time,
      TIME_ZONE,
    ));
    const intervals = starts.slice(1).map((start, index) => start - starts[index]).filter((interval) => interval > 0);
    if (intervals.length === 0) continue;
    const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const lastStart = starts[starts.length - 1];
    const expectedNext = lastStart + averageInterval;
    const hasUpcomingAppointment = appointments.some((appointment) => {
      const start = getAppointmentTimestamp(appointment.date, appointment.time, TIME_ZONE);
      return appointment.status === "confirmed"
        && appointment.phone === user.phone
        && Number.isFinite(start)
        && start > now;
    });
    const reminderAlreadySent = user.lastRebookingReminderAt && user.lastRebookingReminderAt.getTime() >= expectedNext - averageInterval / 2;
    const isDue = now >= expectedNext - 2 * 24 * 60 * 60 * 1000 && now <= expectedNext + 7 * 24 * 60 * 60 * 1000;
    if (hasUpcomingAppointment || reminderAlreadySent || !isDue) continue;

    const lastAppointment = history[history.length - 1];
    const message = renderMessage(rebookingTemplate, {
      name: user.name || lastAppointment.name,
      intervalWeeks: (averageInterval / (7 * 24 * 60 * 60 * 1000)).toFixed(1),
      service: lastAppointment.service,
    });
    try {
      await sendMessageOrThrow(user.phone, message, "smart rebooking reminder");
      await tx.update(salonUsers).set({
        lastRebookingReminderAt: new Date(),
        updatedAt: new Date(),
      }).where(and(eq(salonUsers.id, user.id), eq(salonUsers.role, "client")));
      logger.info({ phone: user.phone }, "Sent smart rebooking WhatsApp reminder");
    } catch (error) {
      logger.warn({ err: error, phone: user.phone }, "Smart rebooking WhatsApp reminder deferred");
    }
  }
}

export function startAppointmentReminderScheduler() {
  if (schedulerStarted) {
    logger.debug("Appointment WhatsApp reminder scheduler already started");
    return;
  }
  cron.schedule("* * * * *", () => {
    void processAppointmentReminders();
  }, { timezone: TIME_ZONE });
  schedulerStarted = true;
  logger.info({ timezone: TIME_ZONE }, "Appointment WhatsApp reminder scheduler started");
}
