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

let socket: WASocket | null = null;
let state: WhatsAppConnectionState = "disconnected";
let latestQr: string | null = null;
let qrUpdatedAt: Date | null = null;
let startPromise: Promise<void> | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let authSyncTimer: NodeJS.Timeout | null = null;
let authSyncPromise: Promise<void> | null = null;

function toWhatsAppJid(phone: string) {
  const digits = phone.replace(/\D/g, "").replace(/^0+/, "972");
  return `${digits}@s.whatsapp.net`;
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
        logger.info({ authDir }, "WhatsApp connected");
      } else if (connection === "close") {
        socket = null;
        state = "disconnected";
        latestQr = null;
        qrUpdatedAt = null;
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
  return {
    state,
    authDir,
    qr: latestQr,
    qrUpdatedAt: qrUpdatedAt?.toISOString() ?? null,
  };
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