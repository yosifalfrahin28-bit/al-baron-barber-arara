import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { LoaderCircle, MessageCircle, ShieldCheck } from "lucide-react";
import { apiUrl } from "@/lib/api";

type WhatsAppSetupResponse = {
  state: "starting" | "qr" | "connected" | "disconnected";
  qr: string | null;
  updatedAt: string | null;
};

type WhatsAppPairingQrProps = {
  compact?: boolean;
};

export default function WhatsAppPairingQr({ compact = false }: WhatsAppPairingQrProps) {
  const [status, setStatus] = useState<WhatsAppSetupResponse["state"]>("starting");
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const lastQr = useRef("");

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const response = await fetch(apiUrl("/api/whatsapp/setup-qr"), {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("whatsapp setup unavailable");

        const next = await response.json() as WhatsAppSetupResponse;
        if (cancelled) return;

        setStatus(next.state);
        setError("");

        if (next.qr && next.qr !== lastQr.current) {
          lastQr.current = next.qr;
          const image = await QRCode.toDataURL(next.qr, {
            width: 560,
            margin: 4,
            errorCorrectionLevel: "L",
            color: { dark: "#111111", light: "#ffffff" },
          });
          if (!cancelled) setQrImage(image);
        } else if (!next.qr) {
          setQrImage(null);
        }
      } catch {
        if (!cancelled) setError("تعذر تجهيز رمز WhatsApp حالياً.");
      }
    };

    void refresh();
    const interval = window.setInterval(() => void refresh(), 3000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

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
        افتح WhatsApp ثم الأجهزة المرتبطة ثم ربط جهاز، وامسح الرمز الظاهر هنا من داخل WhatsApp.
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