import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { ChevronLeft, LoaderCircle, MessageCircle, QrCode, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import { usePhoneAuth } from "@/context/AuthContext";
import { sessionRequest, SessionApiError } from "@/lib/session-api";
import { BottomNavigation, Card, GoldButton, IconButtonLink, Screen } from "@/components/SalonUI";

type WhatsAppStatus = "starting" | "qr" | "connected" | "disconnected";

type WhatsAppQrResponse = {
  state: WhatsAppStatus;
  qr: string | null;
  updatedAt: string | null;
};

export default function WhatsAppQr() {
  const { user, isLoading } = usePhoneAuth();
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<WhatsAppStatus>("starting");
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const lastQr = useRef("");

  useEffect(() => {
    if (isLoading || user?.role !== "admin") return;

    let cancelled = false;
    const refresh = async () => {
      try {
        const next = await sessionRequest<WhatsAppQrResponse>("/api/admin/whatsapp/qr");
        if (cancelled) return;

        setStatus(next.state);
        setError("");
        if (next.qr && next.qr !== lastQr.current) {
          lastQr.current = next.qr;
          const image = await QRCode.toDataURL(next.qr, {
            width: 320,
            margin: 2,
            errorCorrectionLevel: "M",
            color: { dark: "#111111", light: "#ffffff" },
          });
          if (!cancelled) setQrImage(image);
        } else if (!next.qr) {
          lastQr.current = "";
          setQrImage(null);
        }
      } catch (requestError) {
        if (cancelled) return;
        setError(
          requestError instanceof SessionApiError && requestError.status === 403
            ? "هذه الصفحة مخصصة لحساب الإدارة."
            : "تعذر قراءة حالة WhatsApp حالياً.",
        );
      }
    };

    void refresh();
    const interval = window.setInterval(() => void refresh(), 5000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isLoading, user?.role]);

  if (isLoading) {
    return (
      <Screen className="items-center justify-center">
        <LoaderCircle className="animate-spin text-primary" size={32} />
        <p className="mt-4 text-sm text-muted-foreground">جارٍ التحقق من صلاحياتك...</p>
      </Screen>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <Screen className="items-center justify-center p-7">
        <Card className="w-full p-6 text-center">
          <QrCode className="mx-auto text-destructive" size={48} />
          <h1 className="mt-5 text-xl font-black text-foreground">لا تملك صلاحية الدخول</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">هذه الصفحة مخصصة لربط WhatsApp بحساب الإدارة.</p>
          <GoldButton title="العودة" onPress={() => setLocation("/account")} />
        </Card>
      </Screen>
    );
  }

  const connected = status === "connected";
  const waitingForQr = status === "starting" || (status === "qr" && !qrImage);

  return (
    <Screen>
      <div className="flex flex-row-reverse items-center justify-between pb-5 pt-4">
        <IconButtonLink icon={ChevronLeft} label="رجوع" href="/admin" />
        <div className="text-center">
          <p className="text-[10px] font-bold tracking-[0.16em] text-primary">WHATSAPP SETUP</p>
          <h1 className="mt-1 text-xl font-black text-foreground">ربط WhatsApp</h1>
        </div>
        <div className="h-10 w-10" aria-hidden="true" />
      </div>

      <Card className="flex flex-1 flex-col items-center justify-center p-5 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#25D366]/15">
          <MessageCircle className="text-[#25D366]" size={28} />
        </div>
        <h2 className="mt-5 text-2xl font-black text-foreground">
          {connected ? "WhatsApp متصل" : "امسح رمز QR"}
        </h2>
        <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">
          {connected
            ? "تم ربط حساب WhatsApp بالخادم ويمكن الآن إرسال OTP والتذكيرات."
            : "افتح WhatsApp في هاتفك، ثم الإعدادات ← الأجهزة المرتبطة ← ربط جهاز، وامسح الرمز أدناه."}
        </p>

        {qrImage && !connected ? (
          <div className="mt-6 rounded-2xl bg-white p-3 shadow-2xl shadow-black/30">
            <img src={qrImage} alt="رمز QR لربط WhatsApp" className="block h-auto w-[min(78vw,320px)]" />
          </div>
        ) : waitingForQr ? (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-8 py-10">
            <LoaderCircle className="animate-spin text-primary" size={34} />
            <p className="text-sm font-bold text-muted-foreground">جارٍ تجهيز رمز QR...</p>
          </div>
        ) : connected ? (
          <div className="mt-8 rounded-2xl border border-[#25D366]/30 bg-[#25D366]/10 px-8 py-5 text-sm font-bold text-[#9af0b7]">
            الاتصال جاهز
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/10 px-6 py-5 text-sm font-bold text-destructive">
            لا يوجد رمز متاح حالياً. ستتم المحاولة تلقائياً.
          </div>
        )}

        {error && <p className="mt-5 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">{error}</p>}
        {!connected && (
          <div className="mt-6 flex items-center gap-2 text-[11px] text-muted-foreground">
            <RefreshCw size={14} />
            يتجدد الرمز تلقائياً كل 5 ثوانٍ
          </div>
        )}
      </Card>
      <BottomNavigation />
    </Screen>
  );
}