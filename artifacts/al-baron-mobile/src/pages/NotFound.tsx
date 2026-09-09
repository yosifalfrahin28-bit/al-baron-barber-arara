import { useLocation } from 'wouter';
import { Screen, LogoMark, GoldButton } from '@/components/SalonUI';

export default function NotFound() {
  const [, setLocation] = useLocation();
  return (
    <Screen className="items-center justify-center">
      <LogoMark />
      <h2 className="text-xl font-bold mt-8 mb-2 text-foreground">الصفحة غير موجودة</h2>
      <p className="text-muted-foreground text-center text-sm mb-8">عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها.</p>
      <GoldButton 
        title="العودة للرئيسية" 
        onPress={() => setLocation('/')}
      />
    </Screen>
  );
}
