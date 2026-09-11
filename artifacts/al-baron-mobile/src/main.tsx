import { Component, StrictMode, useEffect, useState, type ErrorInfo, type FormEvent, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Redirect, Route, Switch, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import { configuredApiBase } from "./lib/api";
import { getSessionToken } from "./lib/session-api";

import "./index.css";
import { SalonProvider } from "./context/SalonContext";
import { AuthProvider, usePhoneAuth } from "./context/AuthContext";
import { Screen, LogoMark } from "./components/SalonUI";
import Home from "./pages/Home";
import Booking from "./pages/Booking";
import Account from "./pages/Account";
import Admin from "./pages/Admin";
import TvDisplay from "./pages/TvDisplay";
import WhatsAppQr from "./pages/WhatsAppQr";
import WhatsAppSetup from "./pages/WhatsAppSetup";
import Reviews from "./pages/Reviews";
import NotFound from "./pages/NotFound";
import { Share2, X } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

setBaseUrl(configuredApiBase || null);
setAuthTokenGetter(getSessionToken);

function normalizePhoneInput(value: string) {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('972')) digits = digits.slice(3);
  digits = digits.replace(/^0+/, '');
  return /^5\d{8}$/.test(digits) ? `+972${digits}` : '';
}

function isValidIsraeliPhone(value: string) {
  return normalizePhoneInput(value).length > 0;
}

function AuthScreen({ initialMode, initialReset = false }: { initialMode: "sign-in" | "sign-up"; initialReset?: boolean }) {
  const { requestCode, passwordLogin, requestPasswordReset, confirmPasswordReset, verifyCode } = usePhoneAuth();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"sign-in" | "sign-up">(initialMode);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetMode, setResetMode] = useState(initialReset);

  const switchMode = (nextMode: "sign-in" | "sign-up") => {
    setMode(nextMode);
    setStep('details');
    setError('');
    setNotice('');
    setCode('');
    setDevOtp(null);
    setPassword('');
    setPasswordConfirmation('');
    setResetMode(false);
    setLocation(nextMode === 'sign-in' ? '/sign-in' : '/sign-up');
  };

  const submitDetails = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    const internationalPhone = normalizePhoneInput(phone);
    if (!isValidIsraeliPhone(phone)) {
      setError('أدخل رقم هاتف إسرائيلي صالحاً مثل 05XXXXXXXX');
      return;
    }
    if (mode === 'sign-up' && name.trim().length < 2) {
      setError('اكتب الاسم الكامل للمتابعة');
      return;
    }
    if (password.length < 8) {
      setError('كلمة المرور يجب أن تتكون من 8 أحرف على الأقل');
      return;
    }
    if ((mode === 'sign-up' || resetMode) && password !== passwordConfirmation) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }
    setPhone(internationalPhone);
    setSubmitting(true);
    try {
      if (resetMode) {
        const developmentOtp = await requestPasswordReset(internationalPhone);
        setDevOtp(developmentOtp);
        setCode('');
        setStep('otp');
        return;
      }
      if (mode === 'sign-in') {
        const developmentOtp = await passwordLogin(internationalPhone, password);
        setDevOtp(developmentOtp);
        setCode('');
        setStep('otp');
        return;
      }
      const developmentOtp = await requestCode(internationalPhone, mode, mode === 'sign-up' ? name.trim() : undefined, password);
      setDevOtp(developmentOtp);
      setCode('');
      setStep('otp');
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'تعذر إرسال رمز التحقق';
      if (message === 'الرقم غير مسجل، يرجى إنشاء حساب') {
        setNotice(message);
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const submitCode = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (resetMode) {
        await confirmPasswordReset(phone, code, password);
      } else {
        await verifyCode(phone, code);
      }
      window.location.replace('/home');
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'رمز التحقق غير صحيح');
    } finally {
      setSubmitting(false);
    }
  };

  const resendCode = async () => {
    setError('');
    setSubmitting(true);
    try {
      const developmentOtp = resetMode
        ? await requestPasswordReset(phone)
        : await requestCode(phone, mode, mode === 'sign-up' ? name.trim() : undefined, password);
      setDevOtp(developmentOtp);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'تعذر إعادة إرسال الرمز');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen className="items-center justify-center">
      <div className="flex w-full max-w-sm flex-col items-center py-6" dir="rtl">
        <div className="mb-8"><LogoMark /></div>
        <div className="w-full rounded-[28px] border border-primary/25 bg-card/70 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
          {step === 'details' ? (
            <>
              <div className="rounded-2xl bg-secondary/70 p-1.5">
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { value: 'sign-in' as const, label: 'تسجيل الدخول' },
                    { value: 'sign-up' as const, label: 'إنشاء حساب جديد' },
                  ].map((tab) => (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => switchMode(tab.value)}
                      className={`min-h-11 rounded-xl px-2 text-xs font-black transition-all ${mode === tab.value ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-7 text-right">
                <p className="text-xs font-bold tracking-[0.16em] text-primary">AL-BARON</p>
                <h1 className="mt-2 text-2xl font-black text-foreground">
                  {resetMode ? 'استعادة كلمة المرور' : mode === 'sign-in' ? 'أهلاً بعودتك' : 'انضم إلى صالون البارون'}
                </h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {resetMode ? 'سنرسل رمزاً إلى WhatsApp المرتبط بالرقم لتعيين كلمة مرور جديدة.' : mode === 'sign-in' ? 'سجّل الدخول برقم هاتفك وكلمة المرور.' : 'أنشئ حسابك بالاسم والهاتف وكلمة المرور للبدء.'}
                </p>
              </div>

              <form onSubmit={submitDetails} className="mt-7 space-y-4">
                {mode === 'sign-up' && !resetMode && (
                  <label className="block text-right text-sm font-bold text-foreground">
                    الاسم الكامل
                    <input
                      required
                      minLength={2}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="اكتب اسمك الكامل"
                      autoComplete="name"
                      className="mt-2 h-12 w-full rounded-xl border border-border bg-black/30 px-4 text-right text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                    />
                  </label>
                )}
                <label className="block text-right text-sm font-bold text-foreground">
                  رقم الهاتف
                  <input
                    required
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="05X XXX XXXX"
                    autoComplete="tel"
                    dir="ltr"
                    className="mt-2 h-12 w-full rounded-xl border border-border bg-black/30 px-4 text-left text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                  />
                  <span className="mt-1.5 block text-right text-[11px] font-normal text-muted-foreground">
                    مثال: <span dir="ltr" className="inline-block">052 123 4567</span>
                  </span>
                </label>
                <label className="relative block text-right text-sm font-bold text-foreground">
                  {resetMode ? 'كلمة المرور الجديدة' : 'كلمة المرور'}
                  {mode === 'sign-in' && !resetMode && (
                    <button type="button" onClick={() => { setResetMode(true); setError(''); setNotice(''); setPassword(''); setPasswordConfirmation(''); }} className="absolute left-0 top-0 text-[10px] font-black text-primary underline-offset-2 hover:underline">
                      تغيير كلمة المرور
                    </button>
                  )}
                  <input
                    required
                    minLength={8}
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="8 أحرف على الأقل"
                  autoComplete={mode === 'sign-in' && !resetMode ? 'current-password' : 'new-password'}
                    dir="ltr"
                    className="mt-2 h-12 w-full rounded-xl border border-border bg-black/30 px-4 text-left text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                  />
                </label>
                {(mode === 'sign-up' || resetMode) && (
                  <label className="block text-right text-sm font-bold text-foreground">
                    {resetMode ? 'تأكيد كلمة المرور الجديدة' : 'تأكيد كلمة المرور'}
                    <input
                      required
                      minLength={8}
                      type="password"
                      value={passwordConfirmation}
                      onChange={(event) => setPasswordConfirmation(event.target.value)}
                      placeholder="أعد كتابة كلمة المرور"
                      autoComplete="new-password"
                      dir="ltr"
                      className="mt-2 h-12 w-full rounded-xl border border-border bg-black/30 px-4 text-left text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                    />
                  </label>
                )}
                {notice && (
                  <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-right">
                    <p className="text-sm font-bold text-primary">{notice}</p>
                    <button type="button" onClick={() => switchMode('sign-up')} className="mt-3 rounded-xl bg-primary px-4 py-2 text-xs font-black text-primary-foreground">
                      إنشاء حساب جديد
                    </button>
                  </div>
                )}
                {error && <p className="rounded-xl bg-destructive/10 p-3 text-right text-xs text-destructive">{error}</p>}
                <button disabled={submitting} className="h-14 w-full rounded-xl bg-primary font-black text-primary-foreground transition-opacity disabled:opacity-60">
                  {submitting ? (resetMode ? 'جارٍ إرسال رمز الاستعادة...' : mode === 'sign-in' ? 'جارٍ تسجيل الدخول...' : 'جارٍ إرسال رمز التحقق...') : resetMode ? 'إرسال رمز الاستعادة' : mode === 'sign-in' ? 'تسجيل الدخول' : 'إنشاء الحساب وإرسال الرمز'}
                </button>
                {resetMode && (
                  <button type="button" onClick={() => { setResetMode(false); setError(''); setPassword(''); setPasswordConfirmation(''); }} className="w-full text-xs font-bold text-muted-foreground">
                    العودة إلى تسجيل الدخول
                  </button>
                )}
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-3xl">✉</div>
              <p className="mt-6 text-xs font-bold tracking-[0.16em] text-primary">VERIFY PHONE</p>
               <h1 className="mt-2 text-2xl font-black text-foreground">{resetMode ? 'تأكيد استعادة كلمة المرور' : 'تأكيد رقم الهاتف'}</h1>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                 أدخل الرمز المرسل عبر WhatsApp إلى
                <span className="mx-1 font-bold text-foreground" dir="ltr">{phone}</span>
              </p>
              {devOtp && (
                <div className="mt-5 rounded-2xl border border-primary/40 bg-primary/10 p-4 text-center">
                  <p className="text-xs font-bold text-primary">رمز التطوير — استخدمه لإكمال الاختبار</p>
                  <p dir="ltr" className="mt-2 text-3xl font-black tracking-[0.35em] text-primary">{devOtp}</p>
                </div>
              )}
              <form onSubmit={submitCode} className="mt-7 space-y-4">
                <input
                  required
                  minLength={4}
                  maxLength={6}
                  inputMode="numeric"
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  autoComplete="one-time-code"
                  autoFocus
                  aria-label="رمز التحقق"
                  className="h-16 w-full rounded-2xl border border-primary/50 bg-black/30 px-4 text-center text-3xl tracking-[0.45em] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                />
                {error && <p className="rounded-xl bg-destructive/10 p-3 text-right text-xs text-destructive">{error}</p>}
                <button disabled={submitting || code.length < 4} className="h-14 w-full rounded-xl bg-primary font-black text-primary-foreground transition-opacity disabled:opacity-60">
                   {submitting ? 'جارٍ التحقق...' : resetMode ? 'تعيين كلمة المرور والدخول' : 'تأكيد الدخول'}
                </button>
                <button type="button" disabled={submitting} onClick={resendCode} className="w-full text-sm font-bold text-primary disabled:opacity-50">
                  إعادة إرسال الرمز
                </button>
                <button type="button" onClick={() => { setStep('details'); setError(''); }} className="w-full text-xs font-bold text-muted-foreground">
                  تعديل رقم الهاتف
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </Screen>
  );
}

function ProtectedPage({ children }: { children: ReactNode }) {
  const { user, isLoading } = usePhoneAuth();
  if (isLoading) {
    return <Screen className="items-center justify-center"><p className="text-sm text-muted-foreground">جارٍ تحميل حسابك...</p></Screen>;
  }
  return user ? <SalonProvider>{children}</SalonProvider> : <AuthScreen initialMode="sign-in" />;
}

class RootErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Al-Baron web app error", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <Screen className="items-center justify-center">
        <div className="max-w-md rounded-2xl border border-destructive/30 bg-card p-6 text-center">
          <LogoMark compact />
          <h1 className="mt-5 text-xl font-bold">تعذر فتح الصفحة</h1>
          <p className="mt-2 text-sm text-muted">حدث خطأ غير متوقع. يمكنك إعادة تحميل الصفحة والمحاولة مجددًا.</p>
          <button className="mt-6 rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground" onClick={() => window.location.reload()}>
            إعادة تحميل
          </button>
        </div>
      </Screen>
    );
  }
}

function Routes() {
  return (
    <Switch>
      <Route path="/sign-in"><AuthScreen initialMode="sign-in" /></Route>
      <Route path="/sign-up"><AuthScreen initialMode="sign-up" /></Route>
      <Route path="/forgot-password"><AuthScreen initialMode="sign-in" initialReset /></Route>
      <Route path="/continue"><Redirect to="/home" /></Route>
      <Route path="/tv"><SalonProvider><TvDisplay /></SalonProvider></Route>
      <Route path="/tv-display"><SalonProvider><TvDisplay /></SalonProvider></Route>
      <Route path="/"><ProtectedPage><Home /></ProtectedPage></Route>
      <Route path="/home"><ProtectedPage><Home /></ProtectedPage></Route>
      <Route path="/booking"><ProtectedPage><Booking /></ProtectedPage></Route>
      <Route path="/queue"><ProtectedPage><Account /></ProtectedPage></Route>
      <Route path="/account"><ProtectedPage><Account /></ProtectedPage></Route>
      <Route path="/reviews"><ProtectedPage><Reviews /></ProtectedPage></Route>
      <Route path="/whatsapp-setup"><WhatsAppSetup /></Route>
      <Route path="/admin/qr"><ProtectedPage><WhatsAppQr /></ProtectedPage></Route>
      <Route path="/admin"><ProtectedPage><Admin /></ProtectedPage></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <RootErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <IosInstallPrompt />
          <Routes />
        </QueryClientProvider>
      </AuthProvider>
    </RootErrorBoundary>
  );
}

function IosInstallPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isSafari = /Safari/i.test(userAgent)
      && !/CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser/i.test(userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    const dismissedUntil = Number(window.localStorage.getItem('al-baron-ios-prompt-dismissed-until') ?? 0);

    if (isIos && isSafari && !isStandalone && dismissedUntil < Date.now()) {
      const timer = window.setTimeout(() => setVisible(true), 1400);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    window.localStorage.setItem(
      'al-baron-ios-prompt-dismissed-until',
      String(Date.now() + 14 * 24 * 60 * 60 * 1000),
    );
    setVisible(false);
  };

  return (
    <aside className="ios-install-prompt" role="status" dir="rtl">
      <button className="ios-install-prompt-close" onClick={dismiss} aria-label="إغلاق">
        <X size={16} />
      </button>
      <div className="ios-install-prompt-icon" aria-hidden="true"><Share2 size={18} /></div>
      <div className="ios-install-prompt-copy">
        <strong>ثبّت تطبيق البارون على جهازك</strong>
        <span>من Safari اضغط «مشاركة» ثم «إضافة إلى الشاشة الرئيسية».</span>
      </div>
    </aside>
  );
}

const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
