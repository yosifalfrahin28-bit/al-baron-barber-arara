import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  type WASocket,
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@workspace/db";
import { salonWhatsappAuthFiles } from "@workspace/db/schema";
import { logger } from "../lib/logger";

type WhatsAppConnectionState = "starting" | "qr" | "connected" | "disconnected";

const authDir = path.resolve(
  process.env.WHATSAPP_AUTH_DIR ?? path.join(process.cwd(), ".data", "whatsapp-auth"),
);
const whatsappEnabled = process.env.WHATSAPP_ENABLED !== "false";
const PAIRING_CODE_TTL_MS = 5 * 60 * 1000;

let socket: WASocket | null = null;
let state: WhatsAppConnectionState = "disconnected";
let latestQr: string | null = null;
let qrUpdatedAt: Date | null = null;
let pairingPhone: string | null = null;
let latestPairingCode: string | null = null;
let pairingCodeExpiresAt: Date | null = null;
let pairingRequestPromise: Promise<{ code: string; expiresAt: Date }> | null = null;
let startPromise: Promise<void> | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let authSyncTimer: NodeJS.Timeout | null = null;
let authSyncPromise: Promise<void> | null = null;

function toWhatsAppJid(phone: string) {
  const digits = phone.replace(/\D/g, "").replace(/^0+/, "972");
  return `${digits}@s.whatsapp.net`;
}

const arabicIndicDigits = "٠١٢٣٤٥٦٧٨٩";
const easternArabicDigits = "۰۱۲۳۴۵۶۷۸۹";

/**
 * Baileys expects a digits-only international number without a leading +.
 * The UI accepts local Israeli notation as well as E.164/00-prefixed numbers.
 * Other E.164 countries are also accepted so a shop can use a non-Israeli
 * WhatsApp number without changing the pairing flow.
 */
export function normalizeWhatsAppPhone(value: string) {
  if (typeof value !== "string") return "";

  const translated = Array.from(value, (character) => {
    const arabicIndex = arabicIndicDigits.indexOf(character);
    if (arabicIndex >= 0) return String(arabicIndex);
    const easternIndex = easternArabicDigits.indexOf(character);
    return easternIndex >= 0 ? String(easternIndex) : character;
  }).join("");
  let digits = translated.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);

  if (digits.startsWith("0")) {
    // Israeli local mobile and landline formats. A local number is never
    // passed to Baileys directly because it must include its country code.
    if (!/^0(?:5\d{8}|[2-9]\d{7,8})$/.test(digits)) return "";
    digits = `972${digits.slice(1)}`;
  }

  return /^[1-9]\d{7,14}$/.test(digits) ? digits : "";
}

export function isValidWhatsAppPhone(value: string) {
  return normalizeWhatsAppPhone(value).length > 0;
}

export class WhatsAppPairingError extends Error {
  constructor(
    readonly code: "INVALID_PHONE" | "WHATSAPP_DISABLED" | "PAIRING_CODE_ACTIVE" | "WHATSAPP_ALREADY_CONNECTED" | "PAIRING_UNAVAILABLE",
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = "WhatsAppPairingError";
  }
}

function clearPairingCode() {
  pairingPhone = null;
  latestPairingCode = null;
  pairingCodeExpiresAt = null;
}

function scheduleReconnect() {
  if (reconnectTimer || state === "starting") return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void startWhatsApp();
  }, 5000);
}

async function resetLoggedOutSession() {
  try {
    await rm(authDir, { recursive: true, force: true });
    await db.delete(salonWhatsappAuthFiles);
    logger.warn({ authDir }, "WhatsApp session cleared after logout; preparing a new QR code");
  } catch (error) {
    logger.error({ error, authDir }, "Could not clear the logged-out WhatsApp session");
  } finally {
    scheduleReconnect();
  }
}

function authFilePath(relativePath: string) {
  const resolved = path.resolve(authDir, relativePath);
  if (resolved !== authDir && !resolved.startsWith(`${authDir}${path.sep}`)) {
    throw new Error("Invalid WhatsApp auth file path");
  }
  return resolved;
}

async function restoreAuthFiles() {
  const storedFiles = await db.select().from(salonWhatsappAuthFiles);
  for (const storedFile of storedFiles) {
    const destination = authFilePath(storedFile.path);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, storedFile.content, "utf8");
  }
  if (storedFiles.length > 0) {
    logger.info({ authDir, fileCount: storedFiles.length }, "Restored WhatsApp session from persistent storage");
  }
}

async function collectAuthFiles(directory: string, prefix = ""): Promise<Array<{ path: string; content: string }>> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: Array<{ path: string; content: string }> = [];
  for (const entry of entries) {
    const relativePath = prefix ? path.join(prefix, entry.name) : entry.name;
    const absolutePath = authFilePath(relativePath);
    if (entry.isDirectory()) {
      files.push(...await collectAuthFiles(absolutePath, relativePath));
    } else if (entry.isFile()) {
      files.push({ path: relativePath, content: await readFile(absolutePath, "utf8") });
    }
  }
  return files;
}

async function syncAuthFiles() {
  if (authSyncPromise) return authSyncPromise;
  authSyncPromise = (async () => {
    const files = await collectAuthFiles(authDir);
    if (files.length === 0) return;
    await db.transaction(async (tx) => {
      await tx.delete(salonWhatsappAuthFiles);
      await tx.insert(salonWhatsappAuthFiles).values(files.map((file) => ({
        path: file.path,
        content: file.content,
        updatedAt: new Date(),
      })));
    });
    logger.debug({ authDir, fileCount: files.length }, "Persisted WhatsApp session files");
  })().catch((error) => {
    logger.error({ error, authDir }, "Could not persist WhatsApp session files");
  }).finally(() => {
    authSyncPromise = null;
  });
  return authSyncPromise;
}

export async function startWhatsApp() {
  if (!whatsappEnabled) {
    state = "disconnected";
    logger.info("WhatsApp integration disabled by WHATSAPP_ENABLED=false");
    return;
  }
  if (startPromise) return startPromise;
  startPromise = (async () => {
    await mkdir(authDir, { recursive: true });
    await restoreAuthFiles();
    const { state: authState, saveCreds } = await useMultiFileAuthState(authDir);
    if (!authSyncTimer) {
      authSyncTimer = setInterval(() => void syncAuthFiles(), 5000);
    }
    state = "starting";
    socket = makeWASocket({
      auth: authState,
      printQRInTerminal: false,
      markOnlineOnConnect: false,
      syncFullHistory: false,
      logger: logger.child({ component: "whatsapp" }),
    });

    socket.ev.on("creds.update", (update) => {
      void saveCreds().then(() => syncAuthFiles());
    });
    socket.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        state = "qr";
        latestQr = qr;
        qrUpdatedAt = new Date();
        qrcode.generate(qr, { small: true }, (terminalQr) => {
          logger.warn(
            { authDir },
            "WhatsApp QR code ready — scan the block printed immediately below from WhatsApp > Linked devices",
          );
          const printableQr = terminalQr.replace(/\u001b\[[0-9;]*m/g, "");
          process.stdout.write(`\n${printableQr}\n\n`);
        });
      }
      if (connection === "open") {
        state = "connected";
        latestQr = null;
        qrUpdatedAt = null;
        clearPairingCode();
        logger.info({ authDir }, "WhatsApp connected");
      } else if (connection === "close") {
        socket = null;
        state = "disconnected";
        latestQr = null;
        qrUpdatedAt = null;
        clearPairingCode();
        const statusCode = (lastDisconnect?.error as { output?: { statusCode?: number } } | undefined)?.output?.statusCode;
        if (statusCode !== DisconnectReason.loggedOut) {
          logger.warn({ statusCode }, "WhatsApp disconnected; reconnecting");
          scheduleReconnect();
        } else {
          void resetLoggedOutSession();
        }
      }
    });
  })().finally(() => {
    startPromise = null;
  });
  return startPromise;
}

export function getWhatsAppStatus() {
  const pairingActive = Boolean(pairingCodeExpiresAt && pairingCodeExpiresAt.getTime() > Date.now());
  return {
    state,
    qr: latestQr,
    qrUpdatedAt: qrUpdatedAt?.toISOString() ?? null,
    pairingActive,
    pairingExpiresAt: pairingActive ? pairingCodeExpiresAt!.toISOString() : null,
  };
}

/**
 * Ask the current unauthenticated socket for a phone-number pairing code.
 *
 * This intentionally refuses to run against an existing/connected session.
 * Calling requestPairingCode on a live session changes Baileys' companion
 * identity, so it could disconnect the shop's active WhatsApp account.
 */
export async function requestWhatsAppPairingCode(phone: string) {
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  if (!normalizedPhone) {
    throw new WhatsAppPairingError(
      "INVALID_PHONE",
      "أدخل رقم WhatsApp صالحاً بصيغة محلية أو دولية",
      400,
    );
  }
  if (!whatsappEnabled) {
    throw new WhatsAppPairingError(
      "WHATSAPP_DISABLED",
      "ربط WhatsApp غير متاح حالياً",
      503,
    );
  }

  if (pairingRequestPromise) {
    if (pairingPhone !== normalizedPhone) {
      throw new WhatsAppPairingError(
        "PAIRING_UNAVAILABLE",
        "يوجد طلب ربط آخر قيد التنفيذ، انتظر ثم حاول مرة أخرى",
        409,
      );
    }
    return pairingRequestPromise;
  }

  if (latestPairingCode && pairingCodeExpiresAt && pairingCodeExpiresAt.getTime() > Date.now()) {
    throw new WhatsAppPairingError(
      "PAIRING_CODE_ACTIVE",
      "يوجد رمز ربط فعال حالياً. أدخل الرمز الظاهر قبل طلب رمز جديد",
      409,
    );
  }
  clearPairingCode();

  if (state === "connected" || socket?.authState.creds.registered) {
    throw new WhatsAppPairingError(
      "WHATSAPP_ALREADY_CONNECTED",
      "WhatsApp متصل حالياً. لن يتم تغيير الجلسة الحالية",
      409,
    );
  }

  pairingPhone = normalizedPhone;
  pairingRequestPromise = (async () => {
    try {
      if (!socket || state === "disconnected") await startWhatsApp();
      const pairingSocket = socket;
      if (!pairingSocket) throw new Error("WhatsApp socket unavailable");

      // requestPairingCode sends an IQ node and therefore must wait for the
      // underlying WebSocket, not merely for the connection.update event.
      await pairingSocket.waitForSocketOpen();
      if (getWhatsAppStatus().state === "connected" || pairingSocket.authState.creds.registered) {
        throw new WhatsAppPairingError(
          "WHATSAPP_ALREADY_CONNECTED",
          "WhatsApp متصل حالياً. لن يتم تغيير الجلسة الحالية",
          409,
        );
      }

      const code = await pairingSocket.requestPairingCode(normalizedPhone);
      const expiresAt = new Date(Date.now() + PAIRING_CODE_TTL_MS);
      latestPairingCode = code;
      pairingCodeExpiresAt = expiresAt;
      return { code, expiresAt };
    } catch (error) {
      if (error instanceof WhatsAppPairingError) throw error;
      // Deliberately do not log this error: Baileys errors can contain
      // protocol details and this endpoint must never log pairing material.
      throw new WhatsAppPairingError(
        "PAIRING_UNAVAILABLE",
        "تعذر تجهيز رمز الربط حالياً. حاول مرة أخرى بعد قليل",
        503,
      );
    } finally {
      pairingRequestPromise = null;
      if (!latestPairingCode) pairingPhone = null;
    }
  })();

  return pairingRequestPromise;
}

export async function sendWhatsAppMessage(phone: string, message: string) {
  if (!whatsappEnabled) {
    throw new Error("WhatsApp integration is disabled. Set WHATSAPP_ENABLED=true to enable messaging.");
  }
  if (!socket || state !== "connected") {
    throw new Error("WhatsApp is not connected. Scan the QR code shown in the API server logs.");
  }
  const result = await socket.sendMessage(toWhatsAppJid(phone), { text: message });
  return Boolean(result?.key?.id);
}