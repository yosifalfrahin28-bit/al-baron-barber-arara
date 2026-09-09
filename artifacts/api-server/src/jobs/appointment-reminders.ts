import cron from "node-cron";
import { and, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { salonAppointments, salonServices, salonUsers } from "@workspace/db/schema";
import { logger } from "../lib/logger";
import { sendWhatsAppMessage } from "../integrations/whatsapp";
import { getMessageTemplate, renderMessage } from "../lib/message-templates";

const TIME_ZONE = process.env.SALON_TIME_ZONE ?? "Asia/Jerusalem";
const HOUR_WINDOW_MINUTES = 10;
const TWENTY_MINUTE_WINDOW_MINUTES = 10;
const REVIEW_WINDOW_MINUTES = 24 * 60;
let running = false;

function appointmentDateInSalonTime(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  if (![year, month, day, hour, minute].every(Number.isFinite)) return Number.NaN;
  const desiredUtc = Date.UTC(year, month - 1, day, hour, minute);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(desiredUtc));
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]));
  const offset = Date.UTC(values.year, values.month - 1, values.day, values.hour, values.minute, values.second) - desiredUtc;
  return desiredUtc - offset - Date.now();
}

async function processAppointmentReminders() {
  if (running) return;
  running = true;
  try {
    const appointments = await db.select().from(salonAppointments)
      .where(eq(salonAppointments.status, "confirmed"));
    const services = await db.select({
      name: salonServices.name,
      duration: salonServices.duration,
    }).from(salonServices);
    const durationByService = new Map(services.map((service) => [service.name, service.duration]));
    const oneHourTemplate = await getMessageTemplate("one_hour_reminder");
    const reviewTemplate = await getMessageTemplate("review_request");
    const rebookingTemplate = await getMessageTemplate("rebooking_reminder");
    for (const appointment of appointments) {
      if (!appointment.phone) continue;
      const minutesUntil = appointmentDateInSalonTime(appointment.date, appointment.time) / 60000;
      if (!Number.isFinite(minutesUntil)) continue;
      const serviceDuration = durationByService.get(appointment.service) ?? 30;
      const isOneHourWindow = minutesUntil >= 60 - HOUR_WINDOW_MINUTES / 2
        && minutesUntil <= 60 + HOUR_WINDOW_MINUTES / 2;
      const isTwentyMinuteWindow = minutesUntil >= 20 - TWENTY_MINUTE_WINDOW_MINUTES / 2
        && minutesUntil <= 20 + TWENTY_MINUTE_WINDOW_MINUTES / 2;
      const minutesSinceServiceEnd = -minutesUntil - serviceDuration;
      const isReviewWindow = minutesSinceServiceEnd >= 0 && minutesSinceServiceEnd <= REVIEW_WINDOW_MINUTES;

      if (!appointment.confirmationSent && minutesUntil > 0) {
        const confirmationTemplate = await getMessageTemplate("booking_confirmation");
        const message = renderMessage(confirmationTemplate, {
          name: appointment.name,
          date: appointment.date,
          time: appointment.time,
          service: appointment.service,
          barber: appointment.barber,
        });
        try {
          await sendWhatsAppMessage(appointment.phone, message);
          await db.update(salonAppointments).set({
            confirmationSent: true,
            updatedAt: new Date(),
          }).where(and(eq(salonAppointments.id, appointment.id), eq(salonAppointments.confirmationSent, false)));
          logger.info({ appointmentId: appointment.id }, "Sent appointment confirmation WhatsApp message");
        } catch (error) {
          logger.warn({ err: error, appointmentId: appointment.id }, "Appointment confirmation WhatsApp retry deferred");
        }
      }

      if (isOneHourWindow && !appointment.reminderOneHourSent) {
        const message = renderMessage(oneHourTemplate, {
          name: appointment.name,
          date: appointment.date,
          time: appointment.time,
          service: appointment.service,
          barber: appointment.barber,
        });
        try {
          await sendWhatsAppMessage(appointment.phone, message);
          await db.update(salonAppointments).set({
            reminderOneHourSent: true,
            reminderSent: true,
            updatedAt: new Date(),
          }).where(and(eq(salonAppointments.id, appointment.id), eq(salonAppointments.reminderOneHourSent, false)));
          logger.info({ appointmentId: appointment.id }, "Sent one-hour WhatsApp appointment reminder");
        } catch (error) {
          logger.warn({ err: error, appointmentId: appointment.id }, "One-hour WhatsApp reminder deferred");
        }
      }

      if (isTwentyMinuteWindow && !appointment.reminderTwentyMinuteSent) {
        const message = `أهلاً ${appointment.name}، موعدك في صالون البارون بعد 20 دقيقة.\nالوقت: ${appointment.time}\nالخدمة: ${appointment.service}\nيرجى التوجه للصالون.`;
        try {
          await sendWhatsAppMessage(appointment.phone, message);
          await db.update(salonAppointments).set({
            reminderTwentyMinuteSent: true,
            reminderSent: true,
            updatedAt: new Date(),
          }).where(and(eq(salonAppointments.id, appointment.id), eq(salonAppointments.reminderTwentyMinuteSent, false)));
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
          await sendWhatsAppMessage(appointment.phone, message);
          await db.update(salonAppointments).set({
            reviewRequestSent: true,
            updatedAt: new Date(),
          }).where(and(eq(salonAppointments.id, appointment.id), eq(salonAppointments.reviewRequestSent, false)));
          logger.info({ appointmentId: appointment.id }, "Sent post-service WhatsApp review request");
        } catch (error) {
          logger.warn({ err: error, appointmentId: appointment.id }, "Post-service review WhatsApp request deferred");
        }
      }
    }

    await processRebookingReminders(appointments, rebookingTemplate);
  } catch (error) {
    logger.error({ err: error }, "Appointment reminder sweep failed");
  } finally {
    running = false;
  }
}

async function processRebookingReminders(
  appointments: typeof salonAppointments.$inferSelect[],
  rebookingTemplate: string,
) {
  const now = Date.now();
  const users = await db.select().from(salonUsers).where(eq(salonUsers.role, "client"));
  const appointmentsByPhone = new Map<string, typeof appointments>();
  for (const appointment of appointments) {
    const timestamp = now + appointmentDateInSalonTime(appointment.date, appointment.time);
    if (!Number.isFinite(timestamp) || timestamp >= now) continue;
    const rows = appointmentsByPhone.get(appointment.phone) ?? [];
    rows.push(appointment);
    appointmentsByPhone.set(appointment.phone, rows);
  }

  for (const user of users) {
    const history = (appointmentsByPhone.get(user.phone) ?? [])
      .sort((a, b) => appointmentDateInSalonTime(a.date, a.time) - appointmentDateInSalonTime(b.date, b.time));
    if (history.length < 2) continue;
    const starts = history.map((appointment) => now + appointmentDateInSalonTime(appointment.date, appointment.time));
    const intervals = starts.slice(1).map((start, index) => start - starts[index]).filter((interval) => interval > 0);
    if (intervals.length === 0) continue;
    const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const lastStart = starts[starts.length - 1];
    const expectedNext = lastStart + averageInterval;
    const hasUpcomingAppointment = appointments.some((appointment) => appointment.phone === user.phone && appointmentDateInSalonTime(appointment.date, appointment.time) > 0);
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
      await sendWhatsAppMessage(user.phone, message);
      await db.update(salonUsers).set({
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
  cron.schedule("* * * * *", () => {
    void processAppointmentReminders();
  }, { timezone: TIME_ZONE });
  logger.info({ timezone: TIME_ZONE }, "Appointment WhatsApp reminder scheduler started");
}