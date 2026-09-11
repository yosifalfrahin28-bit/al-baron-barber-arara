import { useEffect, useRef, useState, type FormEvent } from "react";
import QRCode from "qrcode";
import { KeyRound, LoaderCircle, MessageCircle, ShieldCheck } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { sessionRequest } from "@/lib/session-api";

type WhatsAppConnectionState = "starting" | "qr" | "connected" | "disconnected";

type WhatsAppSetupResponse = {
  state: WhatsAppConnectionState;
  qr: string | null;
  updatedAt: string | null;
};

type WhatsAppPairingCodeResponse = {
  code: string;
  expiresAt: string;
};

type WhatsAppPairingQrProps = {
  compact?: boolean;
  access?: "public" | "admin";
};

class PairingRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "PairingRequestError";
  }
}

async function requestPublicJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(apiUrl(path), {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const payload = await response.json().catch(() => null) as { message?: string } | null;
  if (!response.ok) {
    throw new PairingRequestError(
      response.status,
      payload?.message || "تعذر تنفيذ طلب ربط WhatsApp حالياً.",
    );
  }
  return payload as T;
}

export default function WhatsAppPairingQr({ compact = false, access = "public" }: WhatsAppPairingQrProps) {
  const [status, setStatus] = useState<WhatsAppConnectionState>("starting");
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingExpiresAt, setPairingExpiresAt] = useState<string | null>(null);
  const [pairingError, setPairingError] = useState("");
  const [requestingPairingCode, setRequestingPairingCode] = useState(false);
  const lastQr = useRef("");

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const path = access === "admin" ? "/api/admin/whatsapp/qr" : "/api/whatsapp/setup-qr";
        const next = access === "admin"
          ? await sessionRequest<WhatsAppSetupResponse>(path)
          : await requestPublicJson<WhatsAppSetupResponse>(path);
        if (cancelled) return;

        setStatus(next.state);
        setError("");

        if (next.qr && next.qr !== lastQr.current) {
          lastQr.current = next.qr;
          const image = await QRCode.toDataURL(next.qr, {
            width: compact ? 560 : 480,
            margin: compact ? 4 : 3,
            errorCorrectionLevel: "L",
            color: { dark: "#111111", light: "#ffffff" },
          });
          if (!cancelled) setQrImage(image);
        } else if (!next.qr) {
          lastQr.current = "";
          setQrImage(null);
        }

        if (next.state === "connected") {
          setPairingCode(null);
          setPairingExpiresAt(null);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            access === "admin" && requestError instanceof Error && "status" in requestError && requestError.status === 403
              ? "هذه الصفحة مخصصة لحساب الإدارة."
              : "تعذر تجهيز رمز WhatsApp حالياً.",
          );
        }
      }
    };

    void refresh();
    const interval = window.setInterval(() => void refresh(), access === "admin" ? 5000 : 3000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [access, compact]);

  const requestPairingCode = async (event: FormEvent) => {
    event.preventDefault();
    setPairingError("");
    setPairingCode(null);
    setPairingExpiresAt(null);
    setRequestingPairingCode(true);

    try {
      const path = access === "admin"
        ? "/api/admin/whatsapp/pairing-code"
        : "/api/whatsapp/setup-pairing-code";
      const init: RequestInit = {
        method: "POST",
        body: JSON.stringify({ phone }),
      };
      const result = access === "admin"
        ? await sessionRequest<WhatsAppPairingCodeResponse>(path, init)
        : await requestPublicJson<WhatsAppPairingCodeResponse>(path, init);
      setPairingCode(result.code);
      setPairingExpiresAt(result.expiresAt);
    } catch (requestError) {
      setPairingError(requestError instanceof Error ? requestError.message : "تعذر تجهيز رمز الربط حالياً.");
    } finally {
      setRequestingPairingCode(false);
    }
  };

  const connected = status === "connected";
  if (compact && connected) return null;

  return (
    <section
      dir="rtl"
      className={
        compact
          ? "mt-5 rounded-2xl border border-[#25D366]/25 bg-[#25D366]/[0.06] p-4 text-center"
          : "w-full max-w-lg rounded-[28px] border border-primary/25 bg-card/70 p-6 text-center shadow-2xl shadow-black/30 backdrop-blur-xl"
      }
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#25D366]/15">
        <MessageCircle className="text-[#25D366]" size={25} />
      </div>
      <h2 className={`${compact ? "mt-3 text-base" : "mt-5 text-2xl"} font-black text-foreground`}>
        ربط WhatsApp
      </h2>
      <p className="mt-2 text-xs leading-6 text-muted-foreground">
        اختر الطريقة المناسبة: امسح رمز QR من الأجهزة المرتبطة، أو اطلب رمزاً لإدخاله في WhatsApp.
      </p>

      {qrImage && !connected ? (
        <div className="mx-auto mt-4 w-fit rounded-2xl bg-white p-3 shadow-2xl">
          <img
            src={qrImage}
            alt="رمز QR لربط WhatsApp"
            className={`block h-auto ${compact ? "w-[min(88vw,420px)]" : "w-[min(88vw,460px)]"}`}
            style={{ imageRendering: "pixelated" }}
          />
        </div>
      ) : connected ? (
        <div className="mx-auto mt-6 flex items-center justify-center gap-2 rounded-2xl border border-[#25D366]/30 bg-[#25D366]/10 px-5 py-4 font-bold text-[#9af0b7]">
          <ShieldCheck size={20} />
          تم ربط WhatsApp بنجاح
        </div>
      ) : (
        <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-8">
          <LoaderCircle className="animate-spin text-primary" size={30} />
          <p className="text-sm font-bold text-muted-foreground">جارٍ تجهيز رمز QR...</p>
        </div>
      )}

      {!connected && (
        <div className="mt-6 border-t border-border/70 pt-5 text-right">
          <div className="flex items-center gap-2">
            <KeyRound className="text-primary" size={18} />
            <h3 className="text-sm font-black text-foreground">بديل QR: رمز الربط بالهاتف</h3>
          </div>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">
            في WhatsApp افتح الأجهزة المرتبطة ← ربط جهاز ← الربط برقم الهاتف، ثم أدخل الرمز الذي سيظهر هنا.
          </p>
          <form onSubmit={requestPairingCode} className="mt-3 space-y-3">
            <label className="block text-xs font-bold text-foreground">
              رقم WhatsApp المراد ربطه
              <input
                required
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+972 52 123 4567"
                dir="ltr"
                className="mt-2 h-12 w-full rounded-xl border border-border bg-black/20 px-4 text-left text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
              />
            </label>
            <button
              type="submit"
              disabled={requestingPairingCode}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-black text-primary-foreground transition-opacity disabled:opacity-60"
            >
              {requestingPairingCode && <LoaderCircle className="animate-spin" size={17} />}
              {requestingPairingCode ? "جارٍ تجهيز الرمز..." : "إظهار رمز الربط"}
            </button>
          </form>

          {pairingCode && (
            <div className="mt-4 rounded-2xl border border-primary/40 bg-primary/10 p-4 text-center">
              <p className="text-xs font-bold text-primary">أدخل هذا الرمز في WhatsApp</p>
              <p
                dir="ltr"
                aria-label="رمز ربط WhatsApp"
                className="mt-2 select-all font-mono text-2xl font-black tracking-[0.28em] text-primary"
              >
                {pairingCode}
              </p>
              <p className="mt-2 text-[11px] text-muted-foreground">
                صالح لمدة 5 دقائق. لا تشارك الرمز مع أي شخص.
              </p>
            </div>
          )}
          {pairingError && <p className="mt-3 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">{pairingError}</p>}
          {pairingExpiresAt && pairingCode && (
            <p className="mt-2 text-[10px] text-muted-foreground" dir="ltr">
              صالح حتى {new Date(pairingExpiresAt).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
      )}

      {error ? (
        <p className="mt-4 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">{error}</p>
      ) : (
        <p className="mt-4 text-[11px] text-muted-foreground">
          استخدم ماسح «الأجهزة المرتبطة» داخل WhatsApp، وليس كاميرا الهاتف العادية. يتجدد الرمز تلقائياً.
        </p>
      )}
    </section>
  );
}