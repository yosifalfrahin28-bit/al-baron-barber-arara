import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, ChevronLeft, Crown, ExternalLink, Info, Lock, Plus, Users, Zap } from 'lucide-react';
import { useLocation } from 'wouter';
import { useSalon } from '@/context/SalonContext';
import { usePhoneAuth } from '@/context/AuthContext';
import { BottomNavigation, Card, GoldButton, IconButtonLink, LogoMark, Screen, StatusPill, cn } from '@/components/SalonUI';
import { barberCategory, trackEvent } from '@/lib/analytics';
import { barberPhotoUrl } from '@/lib/api';

type BookingStep = 1 | 2 | 3 | 4;
type BookingMode = 'queue' | 'appointment';

const namedDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const salonTimeZone = 'Asia/Jerusalem';
const paymentMethods = [
  { id: 'bit' as const, label: 'الدفع عبر bit', description: 'تحويل مباشر من تطبيق bit' },
  { id: 'cash_at_shop' as const, label: 'كاش عند الحلاق', description: 'الدفع عند الوصول' },
];

function additionalMinutesForCategory(category: string, categories: Array<{ name: string; additionalMinutes: number }>) {
  const configured = categories.find((item) => item.name === category)?.additionalMinutes;
  if (configured !== undefined) return configured;
  if (category.includes('طف') || category.toLowerCase().includes('child')) return 10;
  if (category.includes('شب') || category.toLowerCase().includes('teen')) return 20;
  return 25;
}

function roundToBookingUnits(minutes: number) {
  return Math.ceil(minutes / 20) * 20;
}

function salonDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: salonTimeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function salonMinutes(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: salonTimeZone,
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return value('hour') * 60 + value('minute') + value('second') / 60;
}

function salonCalendarDay(date: Date, offset: number) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: salonTimeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const calendarDate = new Date(Date.UTC(value('year'), value('month') - 1, value('day') + offset, 12));
  return {
    date: calendarDate.toISOString().slice(0, 10),
    dayOfWeek: calendarDate.getUTCDay(),
  };
}

export default function Booking() {
  const [, setLocation] = useLocation();
  const { services, barbers, ageCategories, schedule, appointments, tickets, waitingTickets, shopInfo, selectedStyle, setSelectedStyle, joinQueue, bookAppointment, shopOpen, showDurationToCustomers } = useSalon();
  const { user } = usePhoneAuth();
  const [step, setStep] = useState<BookingStep>(1);
  const [mode, setMode] = useState<BookingMode>(() => new URLSearchParams(window.location.search).get('mode') === 'appointment' ? 'appointment' : 'queue');
  const [serviceId, setServiceId] = useState('haircut');
  const [participantCategories, setParticipantCategories] = useState<string[]>(['بالغون']);
  const [paymentMethod, setPaymentMethod] = useState<'bit' | 'cash_at_shop'>('bit');
  const [barber, setBarber] = useState('أول حلاق متاح');
  const [dayOffset, setDayOffset] = useState(0);
  const [time, setTime] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [nowTick, setNowTick] = useState(() => Date.now());
  const availableBarbers = useMemo(() => [
    { id: 'available', name: 'أول حلاق متاح', photoPath: null },
    ...barbers,
  ], [barbers]);

  const visibleServices = useMemo(() => services.filter((service) => service.visible), [services]);
  const selectedService = visibleServices.find((service) => service.id === serviceId) ?? visibleServices[0];
  const dayOptions = useMemo(() => Array.from({ length: 7 }, (_, offset) => {
    const salonDay = salonCalendarDay(new Date(nowTick), offset);
    return {
      offset,
      dayOfWeek: salonDay.dayOfWeek,
      label: offset === 0 ? 'اليوم' : offset === 1 ? 'غداً' : namedDays[salonDay.dayOfWeek],
      date: salonDay.date,
    };
  }), [nowTick]);
  const selectedDay = dayOptions[dayOffset] ?? dayOptions[0];
  const scheduledTimes = useMemo(() => schedule
    .filter((slot) => slot.dayOfWeek === selectedDay?.dayOfWeek && slot.active)
    .map((slot) => slot.time)
    .filter((slot) => {
      const [hours, minutes] = slot.split(':').map(Number);
      return Number.isFinite(hours) && Number.isFinite(minutes) && minutes % 20 === 0;
    })
    .filter((slot, index, slots) => slots.indexOf(slot) === index)
    .sort(), [schedule, selectedDay]);
  const selectedDuration = roundToBookingUnits((selectedService?.duration ?? 30)
    + participantCategories.slice(1).reduce((total, category) => total + additionalMinutesForCategory(category, ageCategories), 0));
  const todayKey = salonDateKey(new Date(nowTick));
  const currentSalonMinutes = salonMinutes(new Date(nowTick));
  const availableTimes = useMemo(() => {
    const toMinutes = (value: string) => {
      const [hours, minutes] = value.split(':').map(Number);
      return hours * 60 + minutes;
    };
    const scheduledSet = new Set(scheduledTimes);
    return scheduledTimes.filter((candidate) => {
      const candidateStart = toMinutes(candidate);
      if (selectedDay?.date === todayKey && candidateStart <= currentSalonMinutes + 10) return false;
      const candidateEnd = candidateStart + selectedDuration;
      const requiredUnits = selectedDuration / 20;
      const requiredSlots = Array.from({ length: requiredUnits }, (_, index) => {
        const minutes = candidateStart + index * 20;
        return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
      });
      if (requiredSlots.some((slot) => !scheduledSet.has(slot))) return false;
      return !appointments.some((appointment) => {
        if (appointment.date !== selectedDay?.date || appointment.status === 'cancelled') return false;
        const existingStart = toMinutes(appointment.time);
        const existingDuration = roundToBookingUnits((services.find((service) => service.name === appointment.service)?.duration ?? 30)
          + (appointment.participantCategories?.slice(1).reduce((total, category) => total + additionalMinutesForCategory(category, ageCategories), 0) ?? Math.max(0, (appointment.guestCount ?? 1) - 1) * 25));
        return candidateStart < existingStart + existingDuration && existingStart < candidateEnd;
      });
    });
  }, [ageCategories, appointments, currentSalonMinutes, scheduledTimes, selectedDay, selectedDuration, services, todayKey]);
  const queueEstimateMinutes = useMemo(() => {
    const durationFor = (serviceName: string) => services.find((service) => service.name === serviceName)?.duration ?? 30;
    const durationForTicket = (ticket: (typeof tickets)[number]) => roundToBookingUnits(
      durationFor(ticket.service) + (ticket.participantCategories?.slice(1).reduce((sum, category) => sum + additionalMinutesForCategory(category, ageCategories), 0) ?? Math.max(0, (ticket.guestCount ?? 1) - 1) * 25),
    );
    const currentTicket = tickets.find((ticket) => ticket.status === 'serving');
    const currentServiceMinutes = currentTicket ? durationForTicket(currentTicket) : 0;
    const waitingServiceMinutes = waitingTickets.reduce((total, ticket) => total + roundToBookingUnits(
      durationFor(ticket.service) + (ticket.participantCategories?.slice(1).reduce((sum, category) => sum + additionalMinutesForCategory(category, ageCategories), 0) ?? Math.max(0, (ticket.guestCount ?? 1) - 1) * 25),
    ), 0);
    return currentServiceMinutes + waitingServiceMinutes;
  }, [ageCategories, services, tickets, waitingTickets]);
  const nearestQueueTime = useMemo(() => {
    const quarterHour = 15 * 60 * 1000;
    const estimatedTimestamp = Date.now() + queueEstimateMinutes * 60 * 1000;
    return new Date(Math.ceil(estimatedTimestamp / quarterHour) * quarterHour)
      .toLocaleTimeString('ar-IL', { hour: '2-digit', minute: '2-digit', hour12: false });
  }, [queueEstimateMinutes]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (visibleServices.length > 0 && !visibleServices.some((service) => service.id === serviceId)) {
      setServiceId(visibleServices[0].id);
    }
  }, [serviceId, visibleServices]);

  useEffect(() => {
    if (ageCategories.length > 0 && !ageCategories.some((category) => category.name === participantCategories[0])) {
      setParticipantCategories((current) => [ageCategories[0].name, ...current.slice(1)]);
    }
  }, [ageCategories, participantCategories]);

  useEffect(() => {
    if (availableBarbers.length > 0 && !availableBarbers.some((item) => item.name === barber)) {
      setBarber(availableBarbers[0].name);
    }
  }, [availableBarbers, barber]);

  useEffect(() => {
    if (availableTimes.length > 0 && !availableTimes.includes(time)) {
      setTime(availableTimes[0]);
    }
    if (availableTimes.length === 0) {
      setTime('');
    }
  }, [availableTimes, time]);

  const selectMode = (nextMode: BookingMode) => {
    setMode(nextMode);
    setStep(1);
    setErrorMessage('');
    trackEvent('booking_mode_selected', { mode: nextMode, shop_open: shopOpen });
  };

  const selectService = (nextServiceId: string, duration: number) => {
    setServiceId(nextServiceId);
    setErrorMessage('');
    trackEvent('booking_service_selected', { service_duration_minutes: duration });
  };

  const selectBarber = (nextBarber: string) => {
    setBarber(nextBarber);
    setErrorMessage('');
    trackEvent('booking_barber_selected', { barber_choice: barberCategory(nextBarber) });
  };

  const canContinue = step === 1
    ? Boolean(selectedService)
    : step === 2
      ? Boolean(barber && participantCategories[0])
      : mode === 'queue' || Boolean(time);

  const nextStep = () => {
    if (!canContinue || step >= 4) return;
    setErrorMessage('');
    setStep((current) => (current + 1) as BookingStep);
  };

  const previousStep = () => {
    if (step === 1) {
      setLocation('/');
      return;
    }
    setErrorMessage('');
    setStep((current) => (current - 1) as BookingStep);
  };

  const confirm = async () => {
    if (!selectedService || (mode === 'queue' && !shopOpen) || (mode === 'appointment' && (!selectedDay || !time))) return;
    setIsConfirming(true);
    setErrorMessage('');
    try {
      if (mode === 'queue') {
        await joinQueue({
          service: selectedService.name,
          barber,
          ageCategory: participantCategories[0],
          guestCount: participantCategories.length,
          participantCategories,
          paymentMethod,
        });
      } else {
        await bookAppointment({
          date: selectedDay.date,
          time,
          barber,
          service: selectedService.name,
          ageCategory: participantCategories[0],
          guestCount: participantCategories.length,
          participantCategories,
          paymentMethod,
        });
      }
      setIsComplete(true);
    } catch (error) {
      setErrorMessage(error instanceof Error && error.message.includes('تم حظر')
        ? 'عذراً، تم حظر حسابك من حجز المواعيد'
        : error instanceof Error && error.message.includes('محجوز')
          ? error.message
          : 'تعذر إتمام الحجز الآن. تحقق من الاتصال وحاول مرة أخرى.');
    } finally {
      setIsConfirming(false);
    }
  };

  if (isComplete) {
    return (
      <>
        <Screen>
          <div className="flex flex-1 flex-col items-center justify-center text-center animate-slide-up" dir="rtl">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/15">
              <CheckCircle2 size={42} className="text-primary" />
            </div>
            <p className="mt-7 text-xs font-bold tracking-widest text-primary">تم الحفظ بنجاح</p>
            <h1 className="mt-3 text-3xl font-black text-foreground">تم تأكيد الحجز</h1>
            <p className="mt-3 max-w-xs text-sm leading-7 text-muted-foreground">
              {mode === 'queue'
                ? 'تمت إضافتك إلى الدور. يمكنك متابعة رقمك وحالته من صفحة حسابي.'
                : `موعدك محفوظ في ${selectedDay.label} الساعة ${time}. يمكنك مراجعة التفاصيل من صفحة حسابي.`}
            </p>
            <div className="mt-9 w-full max-w-xs">
              <GoldButton title="عرض حسابي" icon={ArrowLeft} onPress={() => setLocation('/account')} />
            </div>
            <button type="button" onClick={() => setLocation('/')} className="mt-5 text-sm font-bold text-primary">
              العودة للرئيسية
            </button>
          </div>
        </Screen>
        <BottomNavigation />
      </>
    );
  }

  const stepLabels = ['الخدمة', 'الحلاق واليوم', mode === 'queue' ? 'مراجعة الدور' : 'الوقت', 'التأكيد'];

  return (
    <>
      <Screen>
        <div className="flex items-center justify-between pt-4 mb-6 animate-fade-in">
          <IconButtonLink icon={ChevronLeft} label="رجوع" href="/" />
          <LogoMark compact />
        </div>

        <div className="mb-6 text-right animate-slide-up">
          <div className="mb-2 text-xs font-bold tracking-widest text-primary">احجز تجربتك</div>
          <h1 className="text-3xl font-bold text-foreground">حجز على أربع خطوات</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">اختيار واضح، مراجعة هادئة، وموعد محفوظ.</p>
        </div>

        <div className="mb-6 flex flex-row-reverse gap-2 rounded-2xl bg-secondary p-1" dir="rtl">
          <button
            type="button"
            onClick={() => selectMode('queue')}
            data-testid="button-mode-queue"
            className={cn('flex min-h-12 flex-1 flex-row-reverse items-center justify-center gap-2 rounded-[13px] transition-colors', mode === 'queue' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
          >
            <Zap size={18} />
            <span className="text-sm font-bold">دور حالي</span>
          </button>
          <button
            type="button"
            onClick={() => selectMode('appointment')}
            data-testid="button-mode-appointment"
            className={cn('flex min-h-12 flex-1 flex-row-reverse items-center justify-center gap-2 rounded-[13px] transition-colors', mode === 'appointment' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
          >
            <CalendarDays size={18} />
            <span className="text-sm font-bold">موعد محدد</span>
          </button>
        </div>

        <div className="mb-7 flex flex-row-reverse items-start justify-between" dir="rtl">
          {stepLabels.map((label, index) => {
            const number = index + 1;
            const active = number === step;
            const complete = number < step;
            return (
              <div key={label} className="relative flex flex-1 flex-col items-center gap-2">
                {index < stepLabels.length - 1 && (
                  <div className={cn('absolute right-1/2 top-4 h-px w-full -translate-y-1/2', complete ? 'bg-primary' : 'bg-border')} />
                )}
                <div className={cn('relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-black', active || complete ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground')}>
                  {complete ? <CheckCircle2 size={16} /> : number}
                </div>
                <span className={cn('text-[10px] font-bold', active ? 'text-primary' : 'text-muted-foreground')}>{label}</span>
              </div>
            );
          })}
        </div>

        {user?.accountNotice && (
          <div className="mb-5 rounded-xl border border-primary/30 bg-primary/10 p-4 text-right text-xs font-semibold leading-relaxed text-primary">
            {user.accountNotice}
          </div>
        )}

        {user?.bookingRestricted && (
          <div className="mb-5 flex flex-row-reverse items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
            <Lock size={18} className="shrink-0 text-destructive" />
            <p className="flex-1 text-right text-xs font-semibold leading-relaxed text-destructive">تم تقييد الحجز على حسابك. يرجى التواصل مع الصالون.</p>
          </div>
        )}

        {!shopOpen && (
          <div className="mb-5 flex flex-row-reverse items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 animate-fade-in">
            <Lock size={18} className="shrink-0 text-destructive" />
            <p className="flex-1 text-right text-xs font-semibold leading-relaxed text-destructive">الصالون مغلق حالياً — يمكنك حجز موعد محدد لوقت قادم.</p>
          </div>
        )}

        {step === 1 && (
          <section className="animate-slide-up" aria-labelledby="booking-service-title">
            <div className="mb-4 flex flex-row-reverse items-end justify-between">
              <div className="text-right">
                <p className="mb-1 text-xs font-bold text-primary">الخطوة الأولى</p>
                <h2 id="booking-service-title" className="text-xl font-bold text-foreground">اختر الخدمة</h2>
              </div>
              <span className="text-xs text-muted-foreground">{visibleServices.length} خدمات</span>
            </div>
            <div className="space-y-3">
              {visibleServices.map((service) => {
                const selected = service.id === selectedService?.id;
                return (
                  <button
                    type="button"
                    key={service.id}
                    onClick={() => selectService(service.id, service.duration)}
                    data-testid={`button-service-${service.id}`}
                    className={cn('flex w-full flex-row-reverse items-center gap-4 rounded-2xl border p-4 text-right transition-colors', selected ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/50')}
                  >
                    <div className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px]', selected ? 'border-primary' : 'border-muted-foreground')}>
                      {selected && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-foreground">{service.name}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {service.description}
                        {showDurationToCustomers && ` · ${service.duration} دقيقة`}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-primary">{service.price} ₪</div>
                  </button>
                );
              })}
              {visibleServices.length === 0 && (
                <Card className="p-6 text-center text-sm text-muted-foreground">لا توجد خدمات متاحة للحجز حالياً.</Card>
              )}
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="animate-slide-up" aria-labelledby="booking-barber-title">
            <div className="mb-4 text-right">
              <p className="mb-1 text-xs font-bold text-primary">الخطوة الثانية</p>
              <h2 id="booking-barber-title" className="text-xl font-bold text-foreground">اختر الحلاق واليوم</h2>
              <p className="mt-2 text-sm text-muted-foreground">اختر اسماً محدداً واليوم المناسب لموعدك.</p>
            </div>
            <div className="space-y-3">
              {availableBarbers.map((item) => {
                const selected = barber === item.name;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => selectBarber(item.name)}
                    data-testid={`button-barber-${item.id}`}
                    className={cn('flex w-full flex-row-reverse items-center gap-4 rounded-2xl border p-4 text-right transition-colors', selected ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/50')}
                  >
                    <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl', item.name === 'سامر' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground')}>
                      {item.photoPath ? (
                        <img src={barberPhotoUrl(item.photoPath)} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Crown size={19} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-foreground">{item.name}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground">{item.name === 'أول حلاق متاح' ? 'أقصر وقت انتظار' : 'اختيارك المفضل'}</div>
                    </div>
                    <div className={cn('h-5 w-5 rounded-full border-[1.5px] p-1', selected ? 'border-primary' : 'border-muted-foreground')}>
                      {selected && <div className="h-full w-full rounded-full bg-primary" />}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-6">
              <h3 className="mb-3 text-right text-sm font-bold text-foreground">الفئة العمرية</h3>
              <div className="grid grid-cols-2 gap-2.5">
                {ageCategories.map((category) => (
                  <button
                    type="button"
                    key={category.id}
                    onClick={() => setParticipantCategories((current) => [category.name, ...current.slice(1)])}
                    className={cn('rounded-xl border px-3 py-3 text-right transition-colors', participantCategories[0] === category.name ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground')}
                  >
                    <span className="block text-sm font-bold">{category.name}</span>
                    <span className="mt-1 block text-[10px] text-muted-foreground">
                      {category.maxAge === null ? `${category.minAge}+ سنة` : `${category.minAge}–${category.maxAge} سنة`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex flex-row-reverse items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                  <Users size={18} className="text-primary" />
                </div>
                <div className="flex-1 text-right">
                  <h3 className="text-sm font-bold text-foreground">لمن يكون الحجز؟</h3>
                  <p className="mt-1 text-[11px] leading-5 text-muted-foreground">حدد فئة كل شخص؛ الزيادة قابلة للتعديل من لوحة الحلاق، ومدة الحجز تُحسب بأدوار 20 دقيقة.</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {participantCategories.map((category, index) => (
                  <div key={`${index}-${category}`} className="rounded-xl border border-border bg-card p-3">
                    <div className="mb-2 flex flex-row-reverse items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{index === 0 ? 'الشخص الأول (أنت)' : `الشخص ${index + 1}`}</span>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => setParticipantCategories((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                          className="text-[11px] font-bold text-destructive"
                        >
                          إزالة
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {ageCategories.map((categoryOption) => (
                        <button
                          key={categoryOption.id}
                          type="button"
                          onClick={() => setParticipantCategories((current) => current.map((item, itemIndex) => itemIndex === index ? categoryOption.name : item))}
                          className={cn('rounded-lg border px-2 py-2 text-right text-xs font-bold', category === categoryOption.name ? 'border-primary bg-primary/10 text-primary' : 'border-border text-foreground')}
                        >
                          {categoryOption.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  disabled={participantCategories.length >= 8}
                  onClick={() => setParticipantCategories((current) => [...current, ageCategories.find((category) => category.name.includes('بالغ'))?.name ?? 'بالغون'])}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/50 px-3 py-3 text-xs font-bold text-primary disabled:opacity-40"
                >
                  <Plus size={15} />
                  إضافة شخص
                </button>
              </div>
              {showDurationToCustomers && <p className="mt-2 text-center text-[10px] font-bold text-primary">مدة الخدمة المتوقعة: {selectedDuration} دقيقة</p>}
            </div>
              <div className="mt-6">
                <h3 className="mb-3 text-right text-sm font-bold text-foreground">طريقة الدفع</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={cn('rounded-xl border p-3 text-right', paymentMethod === method.id ? 'border-primary bg-primary/10' : 'border-border bg-card')}
                    >
                      <span className="block text-sm font-bold text-foreground">{method.label}</span>
                      <span className="mt-1 block text-[10px] text-muted-foreground">{method.description}</span>
                    </button>
                  ))}
                </div>
                {paymentMethod === 'bit' && (
                  shopInfo.bitLink ? (
                    <a
                      href={shopInfo.bitLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 flex min-h-11 flex-row-reverse items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/15 px-3 text-xs font-black text-primary"
                    >
                      <ExternalLink size={15} />
                      فتح رابط Bit للدفع
                    </a>
                  ) : (
                    <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-right text-[11px] leading-5 text-amber-700">
                      لم يضف المحل رابط Bit بعد. يمكنك متابعة الطلب، وسيؤكد الحلاق الدفع يدوياً عند الحضور.
                    </p>
                  )
                )}
              </div>
            {mode === 'appointment' && (
              <div className="mt-6">
                <h3 className="mb-3 text-right text-sm font-bold text-foreground">اليوم</h3>
                <div className="flex flex-row-reverse gap-2.5 overflow-x-auto pb-2 hide-scrollbar">
                  {dayOptions.map((item) => (
                    <button
                      type="button"
                      key={`${item.offset}-${item.dayOfWeek}`}
                      onClick={() => setDayOffset(item.offset)}
                      data-testid={`button-day-${item.offset}`}
                      className={cn('shrink-0 rounded-xl border px-5 py-3 transition-colors', dayOffset === item.offset ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:border-primary/50')}
                    >
                      <span className="text-xs font-bold">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {step === 3 && mode === 'appointment' && (
          <section className="animate-slide-up" aria-labelledby="booking-time-title">
            <div className="mb-4 text-right">
              <p className="mb-1 text-xs font-bold text-primary">الخطوة الثالثة</p>
              <h2 id="booking-time-title" className="text-xl font-bold text-foreground">اختر الوقت</h2>
              <p className="mt-2 text-sm text-muted-foreground">الأوقات تبدأ كل 20 دقيقة. حجز أكثر من شخص يحتاج أدواراً متتالية بدون تداخل.</p>
            </div>
            <div className="flex flex-row-reverse flex-wrap gap-2.5">
              {scheduledTimes.map((item) => {
                const available = availableTimes.includes(item);
                const [hours, minutes] = item.split(':').map(Number);
                const itemMinutes = hours * 60 + minutes;
                const tooSoon = selectedDay?.date === todayKey && itemMinutes <= currentSalonMinutes + 10;
                return (
                <button
                  type="button"
                  key={item}
                  onClick={() => available && setTime(item)}
                  disabled={!available}
                  data-testid={`button-time-${item}`}
                  className={cn('w-[calc(33.333%-7px)] rounded-xl border py-3 transition-colors', time === item ? 'border-primary bg-primary/10' : available ? 'border-border bg-card hover:border-primary/50' : 'cursor-not-allowed border-border/50 bg-secondary/50 opacity-60')}
                >
                  <span className={cn('text-sm font-bold', time === item ? 'text-primary' : 'text-foreground')}>{item}</span>
                  <span className={cn('mt-1 block text-[9px]', available ? 'text-success' : tooSoon ? 'text-destructive' : 'text-muted-foreground')}>{available ? 'متاح' : tooSoon ? 'مغلق' : 'محجوز'}</span>
                </button>
                );
              })}
              {scheduledTimes.length === 0 && (
                <div className="w-full rounded-2xl border border-border bg-card p-5 text-center text-sm text-muted-foreground">لا توجد فترات متاحة لهذا اليوم حالياً.</div>
              )}
              {scheduledTimes.length > 0 && availableTimes.length === 0 && (
                <div className="w-full rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center text-xs font-semibold leading-6 text-destructive">لا توجد أوقات يمكن حجزها الآن؛ الأوقات الماضية أو التي بقي عليها أقل من 10 دقائق مغلقة تلقائياً.</div>
              )}
            </div>
          </section>
        )}

        {step === 3 && mode === 'queue' && (
          <section className="animate-slide-up" aria-labelledby="booking-queue-review-title">
            <div className="mb-4 text-right">
              <p className="mb-1 text-xs font-bold text-primary">الخطوة الثالثة</p>
              <h2 id="booking-queue-review-title" className="text-xl font-bold text-foreground">مراجعة الدور</h2>
              <p className="mt-2 text-sm text-muted-foreground">تأكد من اختيارك قبل دخولك إلى الطابور الحالي.</p>
            </div>
            <Card className="border border-primary/30 p-5">
              <div className="flex flex-row-reverse items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15">
                  <Zap size={21} className="text-primary" />
                </div>
                <div className="flex-1 text-right">
                  <div className="text-sm font-bold text-foreground">{selectedService?.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">مع {barber}</div>
                </div>
                <StatusPill>دور حالي</StatusPill>
              </div>
              <div className="mt-5 flex flex-row-reverse items-start gap-2 border-t border-border pt-4">
                <Info size={15} className="mt-0.5 shrink-0 text-primary" />
                <div className="flex-1 text-right">
                  <p className="text-xs leading-6 text-muted-foreground">أقرب وقت متوقع لدورك هو حوالي الساعة <strong className="text-primary">{nearestQueueTime}</strong>.</p>
                  <p className="mt-1 text-[11px] leading-5 text-muted-foreground">التقدير يعتمد على مدة الخدمات الحالية وقد يتغير حسب سرعة العمل.</p>
                </div>
              </div>
            </Card>
          </section>
        )}

        {step === 4 && (
          <section className="animate-slide-up" aria-labelledby="booking-summary-title">
            <div className="mb-4 text-right">
              <p className="mb-1 text-xs font-bold text-primary">الخطوة الرابعة</p>
              <h2 id="booking-summary-title" className="text-xl font-bold text-foreground">ملخص الحجز والتأكيد</h2>
              <p className="mt-2 text-sm text-muted-foreground">لحظة أخيرة للتأكد من التفاصيل.</p>
            </div>
            <Card className="divide-y divide-border border border-border">
              <div className="flex flex-row-reverse items-center justify-between p-4">
                <span className="text-xs text-muted-foreground">الخدمة</span>
                <span className="text-sm font-bold text-foreground">{selectedService?.name ?? '—'}</span>
              </div>
              <div className="flex flex-row-reverse items-center justify-between p-4">
                <span className="text-xs text-muted-foreground">الحلاق</span>
                <span className="text-sm font-bold text-foreground">{barber}</span>
              </div>
              <div className="flex flex-row-reverse items-center justify-between p-4">
                <span className="text-xs text-muted-foreground">الفئة العمرية</span>
                <span className="text-sm font-bold text-foreground">{participantCategories[0]}</span>
              </div>
              <div className="flex flex-row-reverse items-center justify-between p-4">
                <span className="text-xs text-muted-foreground">عدد الأشخاص</span>
                <span className="text-sm font-bold text-foreground">{participantCategories.length}</span>
              </div>
              <div className="flex flex-row-reverse items-center justify-between p-4">
                {showDurationToCustomers && (
                  <>
                    <span className="text-xs text-muted-foreground">مدة الحجز</span>
                    <span className="text-sm font-bold text-primary">{selectedDuration} دقيقة</span>
                  </>
                )}
              </div>
              <>
                  <div className="flex flex-row-reverse items-start justify-between gap-4 p-4">
                    <span className="text-xs text-muted-foreground">فئات الأشخاص</span>
                    <span className="text-left text-sm font-bold text-foreground">{participantCategories.join('، ')}</span>
                  </div>
                  <div className="flex flex-row-reverse items-center justify-between p-4">
                    <span className="text-xs text-muted-foreground">طريقة الدفع</span>
                    <span className="text-sm font-bold text-primary">{paymentMethod === 'bit' ? 'عبر bit' : 'كاش عند الحلاق'}</span>
                  </div>
              </>
              <div className="flex flex-row-reverse items-center justify-between p-4">
                <span className="text-xs text-muted-foreground">نوع الزيارة</span>
                <span className="text-sm font-bold text-primary">{mode === 'queue' ? 'دور حالي' : `${selectedDay.label} · ${time}`}</span>
              </div>
              {mode === 'queue' && (
                <div className="flex flex-row-reverse items-center justify-between bg-primary/5 p-4">
                  <span className="text-xs text-muted-foreground">أقرب وقت متوقع</span>
                  <span className="text-sm font-black text-primary">حوالي {nearestQueueTime}</span>
                </div>
              )}
              <div className="flex flex-row-reverse items-center justify-between p-4">
                <span className="text-xs text-muted-foreground">السعر</span>
                <span className="text-sm font-bold text-primary">{selectedService?.price ?? 0} ₪</span>
              </div>
            </Card>
            {selectedStyle && (
              <div className="mt-4 flex flex-row-reverse items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <Info size={17} className="shrink-0 text-primary" />
                <p className="flex-1 text-right text-xs leading-6 text-muted-foreground">مرجع القصة: <strong className="text-foreground">«{selectedStyle}»</strong></p>
                <button type="button" onClick={() => setSelectedStyle(null)} data-testid="button-clear-style" className="text-[11px] font-bold text-primary">إزالة</button>
              </div>
            )}
          </section>
        )}

        {errorMessage && <div role="alert" data-testid="status-booking-error" className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-right text-xs font-semibold leading-6 text-destructive">{errorMessage}</div>}

        <div className="mt-7 flex flex-row-reverse gap-3">
          {step > 1 && (
            <button type="button" onClick={previousStep} data-testid="button-booking-back" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-secondary text-foreground transition-colors hover:border-primary">
              <ArrowRight size={20} />
            </button>
          )}
          {step < 4 ? (
            <div className="flex-1">
              <GoldButton title="التالي" icon={ArrowLeft} onPress={nextStep} disabled={!canContinue} />
            </div>
          ) : (
            <div className="flex-1">
              <GoldButton
                title={isConfirming ? 'جارٍ تأكيد الحجز...' : mode === 'queue' ? 'تأكيد الدور' : 'احجز الآن'}
                icon={isConfirming ? undefined : CheckCircle2}
                onPress={() => { void confirm(); }}
                disabled={isConfirming || !selectedService || user?.bookingRestricted || (mode === 'queue' && !shopOpen) || (mode === 'appointment' && !time)}
              />
            </div>
          )}
        </div>
        <p className="px-4 pb-20 pt-4 text-center text-[10px] leading-relaxed text-muted-foreground">بالضغط على التأكيد، أنت توافق على سياسة الحجز الخاصة بالصالون.</p>
      </Screen>
      <BottomNavigation />
    </>
  );
}