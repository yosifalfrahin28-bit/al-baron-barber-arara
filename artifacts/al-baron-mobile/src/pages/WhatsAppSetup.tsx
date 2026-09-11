import { Screen } from "@/components/SalonUI";
import WhatsAppPairingQr from "@/components/WhatsAppPairingQr";

export default function WhatsAppSetup() {
  return (
    <Screen className="items-center justify-center p-5">
      <WhatsAppPairingQr access="public" />
    </Screen>
  );
}