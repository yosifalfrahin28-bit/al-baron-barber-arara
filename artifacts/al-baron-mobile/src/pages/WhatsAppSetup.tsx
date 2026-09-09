import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import QRCode from "qrcode";
import { LoaderCircle, MessageCircle, ShieldCheck } from "lucide-react";
import { Card, Screen } from "@/components/SalonUI";
import { apiUrl } from "@/lib/api";

type WhatsAppSetupResponse = {
  state: "starting" | "qr" | "connected" | "disconnected";
  qr: string | null;
  updatedAt: string | null;
};

export default function WhatsAppSetup() {
  const tokenFromUrl = useMemo(() => new URLSearchParams(window.location.search).get("token") ?? "", []);
  const [tokenInput, setTokenInput] = useState("");
  const [activeToken, setActiveToken] = useState(tokenFromUrl);
  const [status, setStatus] = useState<WhatsAppSetupResponse["state"]>("starting");
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const lastQr = useRef("");

  useEffect(() => {
    if (!activeToken) return;

    let cancelled = false;
    const refresh = async () => {
      try {
        const response = await fetch(
          apiUrl(`/api/whatsapp/setup-qr?token=${encodeURIComponent(activeToken)}`),
          { cache: "no-store" },
        );
        if (!response.ok) throw new Error("setup access denied");
        const next = await response.json() as WhatsAppSetupResponse;
        if (cancelled) return;

        setStatus(next.state);
        setError("");
        if (next.qr && next.qr !== lastQr.current) {
          lastQr.current = next.qr;
          const image = await QRCode.toDataURL(next.qr, {
            width: 420,
            margin: 3,
            errorCorrectionLevel: "M",
            color: { dark: "#111111", light: "#ffffff" },
          });
          if (!cancelled) setQrImage(image);
        } else if (!next.qr && next.state === "connected") {
          setQrImage(null);
        }
      } catch {
        if (!cancelled) setError("تعذر الوصول إلى شاشة إعداد WhatsApp.");
      }
    };

    void refresh();
    const interval = window.setInterval(() => void refresh(), 3000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [activeToken]);

  const connected = status === "connected";
  const submitToken = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextToken = tokenInput.trim();
    if (!nextToken) {
      setError("أدخل رمز إعداد WhatsApp أولاً.");
      return;
    }
    setError("");
    setActiveToken(nextToken);
  };

  return (
    <Screen className="items-center justify-center p-5">
      <Card className="w-full max-w-lg p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#25D366]/15">
          <MessageCircle className="text-[#25D366]" size={28} />
        </div>
        <h1 className="mt-5 text-2xl font-black text-foreground">ربط WhatsApp</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          افتح WhatsApp في هاتفك، ثم الأجهزة المرتبطة، ثم ربط جهاز، وامسح الرمز الظاهر أدناه.
        </p>

        {!activeToken ? (
          <form onSubmit={submitToken} className="mt-8 space-y-3 text-right">
            <label className="block text-sm font-bold text-foreground">
              رمز إعداد WhatsApp
              <input
                type="password"
                value={tokenInput}
                onChange={(event) => setTokenInput(event.target.value)}
                placeholder="أدخل الرمز الذي وضعته في Render"
                dir="ltr"
                autoComplete="off"
                className="mt-2 h-12 w-full rounded-xl border border-border bg-black/30 px-4 text-left text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
              />
            </label>
            <button type="submit" className="h-12 w-full rounded-xl bg-primary font-black text-primary-foreground">
              عرض رمز QR
            </button>
          </form>
        ) : qrImage && !connected ? (
          <div className="mx-auto mt-6 w-fit rounded-2xl bg-white p-4 shadow-2xl">
            <img src={qrImage} alt="رمز QR لربط WhatsApp" className="block h-auto w-[min(82vw,420px)]" />
          </div>
        ) : connected ? (
          <div className="mx-auto mt-8 flex items-center justify-center gap-2 rounded-2xl border border-[#25D366]/30 bg-[#25D366]/10 px-5 py-4 font-bold text-[#9af0b7]">
            <ShieldCheck size={20} />
            تم ربط WhatsApp بنجاح
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-8 py-10">
            <LoaderCircle className="animate-spin text-primary" size={34} />
            <p className="text-sm font-bold text-muted-foreground">جارٍ تجهيز رمز QR...</p>
          </div>
        )}

        {error ? (
          <p className="mt-5 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
        ) : activeToken ? (
          <p className="mt-5 text-xs text-muted-foreground">يتجدد الرمز تلقائياً كل عدة ثوانٍ.</p>
        ) : (
          <p className="mt-5 text-xs text-muted-foreground">الرمز موجود في Environment داخل Render.</p>
        )}
      </Card>
    </Screen>
  );
}