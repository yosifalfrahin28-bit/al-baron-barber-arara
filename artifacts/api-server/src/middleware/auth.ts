import type { NextFunction, Request, Response } from "express";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import bcrypt from "bcrypt";
import { and, asc, eq, gt, isNull } from "drizzle-orm";
import { db } from "@workspace/db";
import { salonAuthChallenges, salonAuthSessions, salonSettings, salonUsers } from "@workspace/db/schema";
import { logger } from "../lib/logger";
import { sendWhatsAppMessage } from "../integrations/whatsapp";
import { getMessageTemplate, renderMessage } from "../lib/message-templates";

export type SalonRole = "admin" | "client";

export type SalonPrincipal = typeof salonUsers.$inferSelect;

declare global {
  namespace Express {
    interface Request {
      salonUser?: SalonPrincipal;
    }
  }
}

const id = (prefix: string) => `${prefix}_${Date.now()}_${randomBytes(5).toString("hex")}`;
const SESSION_COOKIE = "al_baron_session";
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const CODE_TTL_MS = 5 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;
const DESIGNATED_ADMIN_PHONE = "0538555706";
export const BANNED_BOOKING_MESSAGE = "عذراً، تم حظر حسابك من حجز المواعيد";
export const BOOKING_RESTRICTED_MESSAGE = "تم تقييد الحجز على حسابك. يرجى التواصل مع الصالون.";

export function normalizePhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("972")) digits = digits.slice(3);
  digits = digits.replace(/^0+/, "");
  return /^5\d{8}$/.test(digits) ? `0${digits}` : "";
}

export function isValidIsraeliPhone(phone: string) {
  return /^05\d{8}$/.test(normalizePhone(phone));
}

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function safeCodeMatch(code: string, expectedHash: string | null) {
  if (!expectedHash) return false;
  const actual = Buffer.from(hash(code));
  const expected = Buffer.from(expectedHash);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function sendPhoneCode(phone: string, challengeId: string, provider = "whatsapp") {
  const code = randomInt(100000, 1000000).toString();
  await db.update(salonAuthChallenges).set({
    provider,
    devCodeHash: hash(code),
  }).where(eq(salonAuthChallenges.id, challengeId));
  try {
    const template = await getMessageTemplate("otp");
    await sendWhatsAppMessage(phone, renderMessage(template, { code }));
    return { delivered: true, devOtp: null };
  } catch (error) {
    if (process.env.NODE_ENV === "production") throw error;
    logger.warn({ err: error }, "WhatsApp unavailable; using development OTP fallback");
    return { delivered: false, devOtp: code };
  }
}

export async function sendWelcomeMessage(phone: string, name: string) {
  const template = await getMessageTemplate("welcome");
  await sendWhatsAppMessage(phone, renderMessage(template, { name }));
}

export async function createPhoneChallenge(phone: string, name: string, passwordHash?: string) {
  await db.delete(salonAuthChallenges).where(and(eq(salonAuthChallenges.phone, phone), isNull(salonAuthChallenges.consumedAt)));
  const [challenge] = await db.insert(salonAuthChallenges).values({
    id: id("challenge"),
    phone,
    name,
    passwordHash,
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
  }).returning();
  return challenge;
}

export async function verifyPhoneChallenge(phone: string, code: string) {
  const [challenge] = await db.select().from(salonAuthChallenges)
    .where(and(eq(salonAuthChallenges.phone, phone), isNull(salonAuthChallenges.consumedAt), gt(salonAuthChallenges.expiresAt, new Date())))
    .orderBy(asc(salonAuthChallenges.createdAt))
    .limit(1);
  if (!challenge || challenge.attempts >= MAX_CODE_ATTEMPTS) {
    return null;
  }
  let valid = false;
  if (challenge.provider === "dev") {
    valid = safeCodeMatch(code, challenge.devCodeHash);
  } else {
    valid = safeCodeMatch(code, challenge.devCodeHash);
  }
  if (!valid) {
    await db.update(salonAuthChallenges).set({ attempts: challenge.attempts + 1 }).where(eq(salonAuthChallenges.id, challenge.id));
    return null;
  }
  await db.update(salonAuthChallenges).set({ consumedAt: new Date() }).where(eq(salonAuthChallenges.id, challenge.id));
  return challenge;
}

export async function upsertPhoneUser(phone: string, name: string, passwordHash?: string) {
  return db.transaction(async (tx) => {
    const [existing] = await tx.select().from(salonUsers).where(eq(salonUsers.phone, phone)).limit(1);
    if (existing) {
      if (existing.isBanned) return existing;
      const [updated] = await tx.update(salonUsers).set({
        name,
        ...(passwordHash ? { passwordHash } : {}),
        ...(phone === DESIGNATED_ADMIN_PHONE ? { role: "admin" } : {}),
        updatedAt: new Date(),
      }).where(eq(salonUsers.phone, phone)).returning();
      return updated;
    }

    let [settings] = await tx.select().from(salonSettings).where(eq(salonSettings.id, 1)).for("update");
    if (!settings) {
      [settings] = await tx.insert(salonSettings).values({ id: 1, shopOpen: true, firstAdminClaimed: false }).returning();
    }
    const role: SalonRole = phone === DESIGNATED_ADMIN_PHONE || !settings.firstAdminClaimed ? "admin" : "client";
    const [created] = await tx.insert(salonUsers).values({ id: id("user"), phone, name, passwordHash, role }).returning();
    if (!settings.firstAdminClaimed) {
      await tx.update(salonSettings).set({ firstAdminClaimed: true, updatedAt: new Date() }).where(eq(salonSettings.id, 1));
    }
    return created;
  });
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function createSession(phone: string) {
  const token = randomBytes(32).toString("base64url");
  await db.insert(salonAuthSessions).values({
    id: id("session"),
    phone,
    tokenHash: hash(token),
    expiresAt: new Date(Date.now() + SESSION_MAX_AGE_MS),
  });
  return token;
}

export async function getSessionUser(token: string | undefined) {
  if (!token) return null;
  const [row] = await db.select({ user: salonUsers, session: salonAuthSessions })
    .from(salonAuthSessions)
    .innerJoin(salonUsers, eq(salonUsers.phone, salonAuthSessions.phone))
    .where(and(eq(salonAuthSessions.tokenHash, hash(token)), gt(salonAuthSessions.expiresAt, new Date())))
    .limit(1);
  return row?.user ?? null;
}

function cookieOptions(req: Request) {
  const forwardedProto = req.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const isHttps = req.secure || forwardedProto === "https";
  return {
    httpOnly: true,
    sameSite: isHttps ? "none" as const : "lax" as const,
    secure: isHttps,
    maxAge: SESSION_MAX_AGE_MS,
    path: "/",
  };
}

export function setSessionCookie(req: Request, res: Response, token: string) {
  res.cookie(SESSION_COOKIE, token, {
    ...cookieOptions(req),
  });
}

export function getSessionToken(req: Request) {
  const authorization = req.get("authorization");
  if (authorization?.startsWith("Bearer ")) return authorization.slice("Bearer ".length).trim();
  return req.cookies?.[SESSION_COOKIE];
}

export function clearSessionCookie(req: Request, res: Response) {
  const { httpOnly, sameSite, secure, path } = cookieOptions(req);
  res.clearCookie(SESSION_COOKIE, { httpOnly, sameSite, secure, path });
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await getSessionUser(getSessionToken(req));
    if (!user) return res.status(401).json({ message: "authentication required" });
    if (user.isBanned) return res.status(403).json({ code: "ACCOUNT_BANNED", message: BANNED_BOOKING_MESSAGE });
    req.salonUser = user;
    return next();
  } catch (error) {
    logger.error({ err: error }, "Phone authentication lookup failed");
    return next(error);
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.salonUser) return res.status(401).json({ message: "authentication required" });
  if (req.salonUser.role !== "admin") return res.status(403).json({ message: "admin role required" });
  return next();
}

export function requireBookingAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.salonUser) return res.status(401).json({ message: "authentication required" });
  if (req.salonUser.bookingRestricted) {
    return res.status(403).json({ code: "BOOKING_RESTRICTED", message: BOOKING_RESTRICTED_MESSAGE });
  }
  return next();
}