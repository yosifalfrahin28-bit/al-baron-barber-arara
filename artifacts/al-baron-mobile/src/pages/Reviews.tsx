import { useState } from 'react';
import { ChevronLeft, Home, MessageSquareHeart, Send, Star } from 'lucide-react';
import { useSalon } from '@/context/SalonContext';
import { BottomNavigation, Card, GoldButton, IconButtonLink, LogoMark, Screen } from '@/components/SalonUI';
import { sessionJson } from '@/lib/session-api';

export default function Reviews() {
  const { appointments } = useSalon();
  const [rating, setRating] = useState(0);
  const [appointmentId, setAppointmentId] = useState('');
  const [feedback, setFeedback] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const submit = async () => {
    if (rating < 1 || (!feedback.trim() && !suggestion.trim())) {
      setError('اختر تقييماً واكتب ملاحظة أو اقتراحاً قبل الإرسال.');
      setState('error');
      return;
    }
    setState('sending');
    setError('');
    try {
      await sessionJson('/api/reviews', 'POST', {
        rating,
        appointmentId: appointmentId || undefined,
        feedback: feedback.trim(),
        suggestion: suggestion.trim(),
      });
      setState('success');
      setFeedback('');
      setSuggestion('');
      setRating(0);
      setAppointmentId('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'تعذر إرسال التقييم الآن.');
      setState('error');
    }
  };

  return (
    <>
      <Screen>
        <div className="mb-7 flex items-center justify-between pt-4" dir="rtl">
          <IconButtonLink icon={Home} label="الرئيسية" href="/" filled />
          <LogoMark compact />
          <IconButtonLink icon={ChevronLeft} label="حسابي" href="/account" />
        </div>
        <div className="text-right" dir="rtl">
          <div className="flex flex-row-reverse items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15">
              <MessageSquareHeart size={24} className="text-primary" />
            </div>
            <div>
              <p className="text-xs font-black tracking-[0.16em] text-primary">صوتك يهمنا</p>
              <h1 className="mt-1 text-2xl font-black text-foreground">تقييم وتجربة العملاء</h1>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            قيّم زيارتك الأخيرة وساعدنا على تحسين كل تفاصيل تجربة الحلاقة في صالون البارون.
          </p>
        </div>

        <Card className="mt-6 p-5" dir="rtl">
          <label className="block text-right text-xs font-black text-muted-foreground">
            الزيارة المرتبطة بالتقييم (اختياري)
            <select
              value={appointmentId}
              onChange={(event) => setAppointmentId(event.target.value)}
              className="mt-2 h-12 w-full rounded-xl border border-border bg-black/25 px-3 text-right text-sm text-foreground outline-none focus:border-primary"
            >
              <option value="">تقييم عام للتجربة</option>
              {appointments.filter((appointment) => appointment.status !== 'cancelled').map((appointment) => (
                <option key={appointment.id} value={appointment.id}>
                  {appointment.date} · {appointment.time} · {appointment.service}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-6 text-center">
            <p className="text-xs font-black text-muted-foreground">كيف كانت تجربتك؟</p>
            <div className="mt-3 flex flex-row-reverse justify-center gap-2" aria-label="التقييم من 1 إلى 5">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`${value} نجوم`}
                  onClick={() => setRating(value)}
                  className="rounded-xl p-2 transition-transform hover:scale-110"
                >
                  <Star size={28} className={value <= rating ? 'fill-primary text-primary' : 'text-muted-foreground'} />
                </button>
              ))}
            </div>
          </div>

          <label className="mt-6 block text-right text-xs font-black text-muted-foreground">
            ملاحظتك عن الخدمة
            <textarea
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="ما الذي أعجبك؟ وما الذي يمكننا تحسينه؟"
              className="mt-2 w-full resize-none rounded-xl border border-border bg-black/25 p-4 text-right text-sm leading-7 text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
            />
          </label>

          <label className="mt-4 block text-right text-xs font-black text-muted-foreground">
            اقتراح أو ميزة جديدة
            <textarea
              value={suggestion}
              onChange={(event) => setSuggestion(event.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="أخبرنا بما تتمنى أن تراه في التطبيق أو الصالون"
              className="mt-2 w-full resize-none rounded-xl border border-border bg-black/25 p-4 text-right text-sm leading-7 text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
            />
          </label>

          {error && <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-right text-xs text-destructive">{error}</div>}
          {state === 'success' && <div className="mt-4 rounded-xl border border-success/30 bg-success/10 p-3 text-right text-xs font-bold text-success">شكراً لك، تم حفظ تقييمك واقتراحك بنجاح.</div>}

          <div className="mt-5">
            <GoldButton
              title={state === 'sending' ? 'جارٍ الإرسال...' : 'إرسال التقييم'}
              icon={Send}
              onPress={() => { void submit(); }}
              disabled={state === 'sending'}
            />
          </div>
        </Card>
        <div className="h-20 shrink-0" />
      </Screen>
      <BottomNavigation />
    </>
  );
}