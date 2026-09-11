const MINUTE_MS = 60_000;
const ONE_HOUR_CATCH_UP_LATEST_MINUTES = 65;
const ONE_HOUR_CATCH_UP_EARLIEST_MINUTES = 30;
const TWENTY_MINUTE_CATCH_UP_LATEST_MINUTES = 25;
const REVIEW_WINDOW_MINUTES = 24 * 60;

export const DEFAULT_APPOINTMENT_TIME_ZONE =
  process.env.SALON_TIME_ZONE ?? "Asia/Jerusalem";

export type AppointmentReminderKind = "oneHour" | "twentyMinute";

export interface ReminderAppointment {
  status?: string | null;
  phone?: string | null;
  date: string;
  time: string;
  reminderOneHourSent?: boolean | null;
  reminderTwentyMinuteSent?: boolean | null;
}

type LocalDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function parseLocalDateTime(date: string, time: string) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!dateMatch || !timeMatch) return null;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const wallClock = new Date(0);
  wallClock.setUTCFullYear(year, month - 1, day);
  wallClock.setUTCHours(hour, minute, 0, 0);

  if (
    wallClock.getUTCFullYear() !== year ||
    wallClock.getUTCMonth() !== month - 1 ||
    wallClock.getUTCDate() !== day
  ) {
    return null;
  }

  return {
    wallClock: wallClock.getTime(),
    requested: { year, month, day, hour, minute, second: 0 },
  };
}

function formatLocalDateTime(
  timestamp: number,
  formatter: Intl.DateTimeFormat,
): LocalDateTimeParts {
  const values = Object.fromEntries(
    formatter
      .formatToParts(new Date(timestamp))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  ) as Partial<LocalDateTimeParts>;

  return {
    year: values.year ?? Number.NaN,
    month: values.month ?? Number.NaN,
    day: values.day ?? Number.NaN,
    hour: values.hour ?? Number.NaN,
    minute: values.minute ?? Number.NaN,
    second: values.second ?? Number.NaN,
  };
}

function sameMinute(
  left: LocalDateTimeParts,
  right: LocalDateTimeParts,
) {
  return (
    left.year === right.year &&
    left.month === right.month &&
    left.day === right.day &&
    left.hour === right.hour &&
    left.minute === right.minute
  );
}

/**
 * Convert a salon wall-clock date/time to an instant without relying on the
 * host machine's timezone. The round-trip check rejects nonexistent local
 * times during a DST spring-forward transition. If a local time is
 * ambiguous during a fall-back transition, the earlier instant is selected
 * consistently.
 */
export function getAppointmentTimestamp(
  date: string,
  time: string,
  timeZone = DEFAULT_APPOINTMENT_TIME_ZONE,
) {
  const parsed = parseLocalDateTime(date, time);
  if (!parsed) return Number.NaN;

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    const offsets = new Set<number>();

    // The probes cover both sides of the DST boundary while remaining
    // independent of the host timezone and the current date.
    for (const hours of [-36, -24, -12, 0, 12, 24, 36]) {
      const probe = parsed.wallClock + hours * 60 * MINUTE_MS;
      const local = formatLocalDateTime(probe, formatter);
      const localAsUtc = Date.UTC(
        local.year,
        local.month - 1,
        local.day,
        local.hour,
        local.minute,
        local.second,
      );
      offsets.add(localAsUtc - probe);
    }

    const matchingInstants: number[] = [];
    for (const offset of offsets) {
      const candidate = parsed.wallClock - offset;
      if (
        sameMinute(formatLocalDateTime(candidate, formatter), parsed.requested)
      ) {
        matchingInstants.push(candidate);
      }
    }

    return matchingInstants.length > 0
      ? Math.min(...matchingInstants)
      : Number.NaN;
  } catch {
    // An invalid SALON_TIME_ZONE must not cause a scheduler tick to crash or
    // send a reminder at an unintended time.
    return Number.NaN;
  }
}

export function getMinutesUntilAppointment(
  date: string,
  time: string,
  now = Date.now(),
  timeZone = DEFAULT_APPOINTMENT_TIME_ZONE,
) {
  const timestamp = getAppointmentTimestamp(date, time, timeZone);
  return Number.isFinite(timestamp) ? (timestamp - now) / MINUTE_MS : Number.NaN;
}

/**
 * Return the unsent reminder kind due for one appointment at a fixed instant.
 *
 * The upper bounds make a sweep that was delayed by host sleep catch up while
 * the appointment is still in the future. When both reminders are overdue,
 * the nearer (20-minute) reminder wins; the five-minute gap before that
 * range also prevents adjacent polling ticks from sending both messages
 * back-to-back. Once the appointment has started, both are skipped.
 */
export function getDueAppointmentReminders(
  appointment: ReminderAppointment,
  now = Date.now(),
  timeZone = DEFAULT_APPOINTMENT_TIME_ZONE,
) {
  if (appointment.status !== "confirmed" || !appointment.phone) return [];

  const minutesUntil = getMinutesUntilAppointment(
    appointment.date,
    appointment.time,
    now,
    timeZone,
  );
  if (!Number.isFinite(minutesUntil) || minutesUntil <= 0) return [];

  const twentyMinuteDue =
    !appointment.reminderTwentyMinuteSent &&
    minutesUntil <= TWENTY_MINUTE_CATCH_UP_LATEST_MINUTES;
  if (twentyMinuteDue) return ["twentyMinute"];

  const oneHourDue =
    !appointment.reminderOneHourSent &&
    !appointment.reminderTwentyMinuteSent &&
    minutesUntil > ONE_HOUR_CATCH_UP_EARLIEST_MINUTES &&
    minutesUntil <= ONE_HOUR_CATCH_UP_LATEST_MINUTES;
  return oneHourDue ? ["oneHour"] : [];
}

export function isCompletedReviewDue(
  status: string | null | undefined,
  minutesUntil: number,
  durationMinutes: number,
  alreadySent = false,
) {
  if (status !== "completed" || alreadySent || !Number.isFinite(minutesUntil)) {
    return false;
  }
  const minutesSinceServiceEnd = -minutesUntil - durationMinutes;
  return (
    minutesSinceServiceEnd >= 0 &&
    minutesSinceServiceEnd <= REVIEW_WINDOW_MINUTES
  );
}