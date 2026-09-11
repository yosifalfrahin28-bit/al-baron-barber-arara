import { ChevronLeft, LoaderCircle, QrCode } from "lucide-react";
import { useLocation } from "wouter";
import { usePhoneAuth } from "@/context/AuthContext";
import { BottomNavigation, Card, GoldButton, IconButtonLink, Screen } from "@/components/SalonUI";
import WhatsAppPairingQr from "@/components/WhatsAppPairingQr";

export default function WhatsAppQr() {
  const { user, isLoading } = usePhoneAuth();
  const [, setLocation] = useLocation();

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

      <Card className="flex flex-1 flex-col items-center justify-center p-5">
        <WhatsAppPairingQr access="admin" />
      </Card>
      <BottomNavigation />
    </Screen>
  );
}