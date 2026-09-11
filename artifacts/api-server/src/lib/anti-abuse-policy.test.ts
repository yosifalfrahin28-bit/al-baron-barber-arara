import assert from "node:assert/strict";
import test from "node:test";
// Node's type-stripping test runner resolves the explicit .ts extension.
// @ts-expect-error allowImportingTsExtensions is intentionally not enabled for the app build
import { ANTI_ABUSE_POLICY, activeQueueTicketBlocksNewTicket, appointmentRequestDisposition, appointmentStatusBlocksTime, cancellationDecision, repeatedIncidentRequiresReview, userBookingLockKey } from "./anti-abuse-policy.ts";

test("third future appointment becomes pending without reserving a slot", () => {
  assert.equal(
    appointmentRequestDisposition({ futureConfirmedCount: 2, sameDayDuplicate: false }),
    "pending_approval",
  );
  assert.equal(appointmentStatusBlocksTime("pending_approval"), false);
  assert.equal(appointmentStatusBlocksTime("confirmed"), true);
});

test("same-day duplicates require review while an admin exception remains possible", () => {
  assert.equal(
    appointmentRequestDisposition({ futureConfirmedCount: 0, sameDayDuplicate: true }),
    "pending_approval",
  );
  assert.equal(
    appointmentRequestDisposition({ futureConfirmedCount: 0, sameDayDuplicate: false }),
    "confirmed",
  );
});

test("cancellation remains available at and beyond the daily threshold", () => {
  assert.deepEqual(cancellationDecision(ANTI_ABUSE_POLICY.dailyCancellationLimit - 1), {
    allowed: true,
    alert: true,
  });
  assert.deepEqual(cancellationDecision(ANTI_ABUSE_POLICY.dailyCancellationLimit), {
    allowed: true,
    alert: true,
  });
});

test("queue and repeated-incident policy decisions are explicit", () => {
  assert.equal(activeQueueTicketBlocksNewTicket(0), false);
  assert.equal(activeQueueTicketBlocksNewTicket(1), true);
  assert.equal(repeatedIncidentRequiresReview(2), false);
  assert.equal(repeatedIncidentRequiresReview(3), true);
});

test("serialized booking decisions keep concurrent requests within the max", async () => {
  let futureConfirmedCount = 1;
  let lock: Promise<void> = Promise.resolve();
  const book = async () => {
    const previous = lock;
    let release!: () => void;
    lock = new Promise<void>((resolve) => { release = resolve; });
    await previous;
    try {
      const status = appointmentRequestDisposition({
        futureConfirmedCount,
        sameDayDuplicate: false,
      });
      if (status === "confirmed") futureConfirmedCount += 1;
      // A PostgreSQL advisory transaction lock in the route provides this
      // same serialization around the read, decision, and insert.
      return status;
    } finally {
      release();
    }
  };

  assert.deepEqual(await Promise.all([book(), book()]), ["confirmed", "pending_approval"]);
  assert.equal(futureConfirmedCount, 2);
});

test("all counter-sharing operations use one per-user advisory lock key", () => {
  const userId = "user-123";
  assert.equal(userBookingLockKey(userId), "booking-user:user-123");
  assert.equal(userBookingLockKey(userId), userBookingLockKey(userId));
});