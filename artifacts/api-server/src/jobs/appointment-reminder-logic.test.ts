import assert from "node:assert/strict";
import test from "node:test";
// Node's type-stripping test runner resolves the explicit .ts extension.
// @ts-expect-error allowImportingTsExtensions is intentionally not enabled for the app build
import { getAppointmentTimestamp, getDueAppointmentReminders, getMinutesUntilAppointment, isCompletedReviewDue } from "./appointment-reminder-logic.ts";

const TIME_ZONE = "Asia/Jerusalem";

test("converts Jerusalem winter and summer wall-clock times with DST", () => {
  assert.equal(
    new Date(getAppointmentTimestamp("2025-01-15", "12:00", TIME_ZONE)).toISOString(),
    "2025-01-15T10:00:00.000Z",
  );
  assert.equal(
    new Date(getAppointmentTimestamp("2025-07-15", "12:00", TIME_ZONE)).toISOString(),
    "2025-07-15T09:00:00.000Z",
  );
});

test("rejects malformed dates and nonexistent DST wall-clock times", () => {
  assert.equal(
    Number.isNaN(getAppointmentTimestamp("2025-02-30", "12:00", TIME_ZONE)),
    true,
  );
  assert.equal(
    Number.isNaN(getAppointmentTimestamp("2025-03-28", "02:30", TIME_ZONE)),
    true,
  );
});

test("catches up delayed polls without sending both reminders together", () => {
  const now = Date.parse("2025-07-15T08:00:00.000Z");
  const appointment = {
    status: "confirmed",
    phone: "+972501234567",
    date: "2025-07-15",
    time: "12:00",
    reminderOneHourSent: false,
    reminderTwentyMinuteSent: false,
  };

  assert.deepEqual(
    getDueAppointmentReminders(appointment, now, TIME_ZONE),
    ["oneHour"],
  );
  assert.equal(
    getMinutesUntilAppointment("2025-07-15", "11:00", now, TIME_ZONE),
    0,
  );
  assert.deepEqual(
    getDueAppointmentReminders(
      { ...appointment, time: "11:40" },
      Date.parse("2025-07-15T08:20:00.000Z"),
      TIME_ZONE,
    ),
    ["twentyMinute"],
  );
  assert.deepEqual(
    getDueAppointmentReminders(
      { ...appointment, time: "11:40", reminderTwentyMinuteSent: true },
      now,
      TIME_ZONE,
    ),
    [],
  );
  assert.deepEqual(
    getDueAppointmentReminders(
      appointment,
      Date.parse("2025-07-15T07:55:00.000Z"),
      TIME_ZONE,
    ),
    ["oneHour"],
  );
  assert.deepEqual(
    getDueAppointmentReminders(
      appointment,
      Date.parse("2025-07-15T07:54:00.000Z"),
      TIME_ZONE,
    ),
    [],
  );
  assert.deepEqual(
    getDueAppointmentReminders(
      appointment,
      Date.parse("2025-07-15T08:06:00.000Z"),
      TIME_ZONE,
    ),
    ["oneHour"],
  );
  assert.deepEqual(
    getDueAppointmentReminders(
      appointment,
      Date.parse("2025-07-15T08:35:00.000Z"),
      TIME_ZONE,
    ),
    ["twentyMinute"],
  );
  assert.deepEqual(
    getDueAppointmentReminders(
      appointment,
      Date.parse("2025-07-15T08:30:00.000Z"),
      TIME_ZONE,
    ),
    [],
  );
  assert.deepEqual(
    getDueAppointmentReminders(
      appointment,
      Date.parse("2025-07-15T09:00:00.000Z"),
      TIME_ZONE,
    ),
    [],
  );
});

test("does not produce reminders for pending, past, or phone-less bookings", () => {
  const now = Date.parse("2025-07-15T08:00:00.000Z");
  const appointment = {
    status: "confirmed",
    phone: "+972501234567",
    date: "2025-07-15",
    time: "12:00",
    reminderOneHourSent: false,
    reminderTwentyMinuteSent: false,
  };

  assert.deepEqual(
    getDueAppointmentReminders({ ...appointment, status: "pending_approval" }, now, TIME_ZONE),
    [],
  );
  assert.deepEqual(
    getDueAppointmentReminders({ ...appointment, time: "07:00" }, now, TIME_ZONE),
    [],
  );
  assert.deepEqual(
    getDueAppointmentReminders({ ...appointment, phone: "" }, now, TIME_ZONE),
    [],
  );
});

test("reviews require completed status and the full group duration", () => {
  assert.equal(isCompletedReviewDue("confirmed", -40, 40), false);
  assert.equal(isCompletedReviewDue("completed", -20, 40), false);
  assert.equal(isCompletedReviewDue("completed", -61, 60), true);
  assert.equal(isCompletedReviewDue("completed", -61, 60, true), false);
});