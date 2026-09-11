/**
 * Customer-facing anti-abuse policy. Keep these decisions pure so the
 * transactional route can be tested without connecting to production data.
 */
export const ANTI_ABUSE_POLICY = {
  maxFutureConfirmedAppointments: 2,
  dailyBookingLimit: 5,
  dailyCancellationLimit: 3,
  repeatedIncidentThreshold: 3,
  incidentWindowDays: 90,
  lateCancellationWindowHours: 24,
} as const;

export function appointmentStatusBlocksTime(status: string) {
  return status === "confirmed";
}

export function appointmentRequestDisposition(input: {
  futureConfirmedCount: number;
  sameDayDuplicate: boolean;
}) {
  return input.futureConfirmedCount >= ANTI_ABUSE_POLICY.maxFutureConfirmedAppointments
    || input.sameDayDuplicate
    ? "pending_approval"
    : "confirmed";
}

/**
 * Cancellation is intentionally always allowed. Once the daily threshold is
 * reached, the caller records an alert and restricts *new* bookings for
 * review, rather than forcing the customer to no-show.
 */
export function cancellationDecision(cancellationsAlreadyRecordedToday: number) {
  return {
    allowed: true as const,
    alert: cancellationsAlreadyRecordedToday + 1 >= ANTI_ABUSE_POLICY.dailyCancellationLimit,
  };
}

export function activeQueueTicketBlocksNewTicket(activeTicketCount: number) {
  return activeTicketCount > 0;
}

/**
 * Every operation that reads or increments a customer's shared booking and
 * cancellation counters must use this exact key. Queue, appointments, and
 * cancellation endpoints intentionally share one lock namespace.
 */
export function userBookingLockKey(userId: string) {
  return `booking-user:${userId}`;
}

export function repeatedIncidentRequiresReview(incidentCount: number) {
  return incidentCount >= ANTI_ABUSE_POLICY.repeatedIncidentThreshold;
}