import { Component, StrictMode, useEffect, useState, type ErrorInfo, type FormEvent, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Redirect, Route, Switch, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import { configuredApiBase } from "./lib/api";
import { getSessionToken } from "./lib/session-api";

import "./index.css";
import "./auth.css";
import { SalonProvider } from "./context/SalonContext";
import { AuthProvider, usePhoneAuth } from "./context/AuthContext";
import { Screen, LogoMark } from "./components/SalonUI";
import { ShopBackground } from "./components/ShopBackground";
import Home from "./pages/Home";
import Booking from "./pages/Booking";
import Account from "./pages/Account";
import Admin from "./pages/Admin";
import TvDisplay from "./pages/TvDisplay";
import WhatsAppQr from "./pages/WhatsAppQr";
import WhatsAppSetup from "./pages/WhatsAppSetup";
import Reviews from "./pages/Reviews";
import NotFound from "./pages/NotFound";
import { Share2, X, Mail } from "lucide-react";

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

async function shareApplication() {
  const shareData = {
    title: 'صالون البارون',
    text: 'احجز موعدك أو دورك من صالون البارون',
    url: window.location.href,
  };

  if (typeof navigator.share === 'function') {
    await navigator.share(shareData);
    return 'shared' as const;
  }

  const copyText = async () => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(window.location.href);
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = window.location.href;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    if (!copied) throw new Error('copy-failed');
  };

  await copyText();
  return 'copied' as const;
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
  const [shareNotice, setShareNotice] = useState('');
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
      setLocation('/home');
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

  const handleShare = async () => {
    setShareNotice('');
    try {
      const result = await shareApplication();
      setShareNotice(result === 'copied' ? 'تم نسخ رابط التطبيق' : 'تم فتح المشاركة');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setShareNotice('تعذرت المشاركة حالياً');
    }
  };

  return (
    <div className="auth-layout" dir="rtl">
      <ShopBackground />

      <div className="auth-content">
        <div className="auth-logo-area">
          <img src={`${import.meta.env.BASE_URL || '/'}icon-512.png`.replace('//', '/')} alt="شعار صالون البارون" />
        </div>

        <div className="auth-wave-wrapper">
          <svg viewBox="0 0 390 80" className="w-full h-auto max-w-[320px]" preserveAspectRatio="xMidYMid meet">
            <path
              d="M-20,30 C120,70 260,-10 410,40"
              fill="none"
              stroke="url(#goldGradientWave)"
              strokeWidth="3.5"
            />
            <path
              d="M-20,45 C120,85 260,5 410,55"
              fill="none"
              stroke="url(#goldGradientWave)"
              strokeWidth="1.5"
              opacity="0.4"
            />
            <defs>
              <linearGradient id="goldGradientWave" x1="0" y1="0" x2="390" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#8A6B27" />
                <stop offset="30%" stopColor="#FDE08B" />
                <stop offset="70%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#8A6B27" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {step === 'details' ? (
          <>
            <div className="auth-tabs-container">
              {[
                { value: 'sign-in' as const, label: 'تسجيل الدخول' },
                { value: 'sign-up' as const, label: 'إنشاء حساب جديد' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => switchMode(tab.value)}
                  className={`auth-tab-btn ${mode === tab.value ? 'active' : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={submitDetails} className="w-full flex flex-col">
              {mode === 'sign-up' && !resetMode && (
                <div className="auth-input-wrapper">
                  <label className="auth-input-label">الاسم الكامل</label>
                  <input
                    required
                    minLength={2}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="اكتب اسمك الكامل"
                    autoComplete="name"
                    className="auth-input text-right"
                  />
                </div>
              )}

              <div className="auth-input-wrapper">
                <label className="auth-input-label">رقم الجوال</label>
                <input
                  required
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="05X XXX XXXX"
                  autoComplete="tel"
                  dir="ltr"
                  className="auth-input text-left"
                />
              </div>

              <div className="auth-input-wrapper">
                <div className="flex justify-between items-center mb-1">
                  <label className="auth-input-label mb-0">{resetMode ? 'كلمة المرور الجديدة' : 'كلمة المرور'}</label>
                  {mode === 'sign-in' && !resetMode && (
                    <button type="button" onClick={() => { setResetMode(true); setError(''); setNotice(''); setPassword(''); setPasswordConfirmation(''); }} className="auth-link">
                      نسيت كلمة المرور؟
                    </button>
                  )}
                </div>
                <input
                  required
                  minLength={8}
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === 'sign-in' && !resetMode ? 'current-password' : 'new-password'}
                  dir="ltr"
                  className="auth-input text-left"
                />
              </div>

              {(mode === 'sign-up' || resetMode) && (
                <div className="auth-input-wrapper">
                  <label className="auth-input-label">{resetMode ? 'تأكيد كلمة المرور الجديدة' : 'تأكيد كلمة المرور'}</label>
                  <input
                    required
                    minLength={8}
                    type="password"
                    value={passwordConfirmation}
                    onChange={(event) => setPasswordConfirmation(event.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    dir="ltr"
                    className="auth-input text-left"
                  />
                </div>
              )}

              {notice && (
                <div className="auth-notice">
                  <p className="text-sm font-bold text-primary mb-2">{notice}</p>
                  <button type="button" onClick={() => switchMode('sign-up')} className="bg-primary/20 text-primary px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-[0.98]">
                    إنشاء حساب جديد
                  </button>
                </div>
              )}

              {error && <div className="auth-error">{error}</div>}

              <button disabled={submitting} className="auth-submit-btn">
                {submitting ? (resetMode ? 'جارٍ إرسال الرمز...' : mode === 'sign-in' ? 'جارٍ الدخول...' : 'جارٍ الإرسال...') : resetMode ? 'إرسال الرمز' : mode === 'sign-in' ? 'تسجيل الدخول' : 'إنشاء حساب'}
              </button>

              {resetMode && (
                <div className="text-center mt-6">
                  <button type="button" onClick={() => { setResetMode(false); setError(''); setPassword(''); setPasswordConfirmation(''); }} className="auth-link text-[13px] text-white/50 hover:text-white">
                    العودة إلى تسجيل الدخول
                  </button>
                </div>
              )}
            </form>

            <div className="mt-8 mb-4">
              <button
                type="button"
                onClick={() => void handleShare()}
                className="w-full flex items-center justify-center gap-2 text-xs font-bold text-white/70 hover:text-white transition-colors py-2 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 rounded-lg"
              >
                <Share2 size={16} />
                مشاركة التطبيق
              </button>
              {shareNotice && <p className="text-center text-[11px] font-bold text-primary mt-1">{shareNotice}</p>}
            </div>
          </>
        ) : (
          <div className="flex flex-col text-center w-full">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6">
              <Mail size={32} strokeWidth={1.5} />
            </div>

            <h1 className="text-2xl font-black text-white mb-2">{resetMode ? 'تأكيد استعادة كلمة المرور' : 'تأكيد رقم الهاتف'}</h1>
            <p className="text-sm text-white/60 mb-8 leading-relaxed">
              أدخل الرمز المرسل عبر WhatsApp إلى<br/>
              <span className="font-bold text-white tracking-widest inline-block mt-1" dir="ltr">{phone}</span>
            </p>

            {devOtp && (
              <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-6 text-center">
                <p className="text-xs text-primary mb-2">رمز التطوير (للاختبار)</p>
                <p dir="ltr" className="text-3xl font-black tracking-[0.3em] text-primary">{devOtp}</p>
              </div>
            )}

            <form onSubmit={submitCode} className="w-full flex flex-col gap-5">
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
                className="w-full bg-black/40 border border-white/20 rounded-xl h-16 text-center text-3xl tracking-[0.5em] text-white focus:border-primary outline-none transition-colors"
              />

              {error && <div className="auth-error">{error}</div>}

              <button disabled={submitting || code.length < 4} className="auth-submit-btn">
                {submitting ? 'جارٍ التحقق...' : resetMode ? 'تأكيد الدخول' : 'تأكيد الدخول'}
              </button>

              <div className="flex flex-col gap-4 mt-2">
                <button type="button" disabled={submitting} onClick={resendCode} className="auth-link text-[13px]">
                  إعادة إرسال الرمز
                </button>
                <button type="button" onClick={() => { setStep('details'); setError(''); }} className="auth-link text-[13px] text-white/50 hover:text-white">
                  تعديل رقم الهاتف
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="auth-bottom-deco">
          <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-primary/60"></div>
          <div className="mx-4 w-2 h-2 rotate-45 bg-primary/80"></div>
          <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-primary/60"></div>
        </div>
      </div>
    </div>
  );
}

function ProtectedPage({ children }: { children: ReactNode }) {
  const { user, isLoading, startupError, retryStartup } = usePhoneAuth();
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    setSlow(false);
    if (!isLoading) return;
    const timer = window.setTimeout(() => setSlow(true), 3000);
    return () => window.clearTimeout(timer);
  }, [isLoading]);
  if (isLoading || startupError) {
    return (
      <Screen className="items-center justify-center">
        <div role="status" className="max-w-sm rounded-2xl bg-black/80 p-6 text-center">
          <LogoMark />
          <p className="mt-5 text-sm text-white">{startupError || 'جارٍ فتح حسابك...'}</p>
          {!startupError && slow && <p className="mt-3 text-sm leading-7 text-white/75">الخادم يستيقظ بعد فترة خمول، وقد يستغرق ذلك نحو دقيقة. لا حاجة لإعادة تسجيل الدخول.</p>}
          {startupError && <button type="button" onClick={retryStartup} className="mt-5 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground">إعادة الاتصال</button>}
        </div>
      </Screen>
    );
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
  const [shareNotice, setShareNotice] = useState('');

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

  const shareApp = async () => {
    try {
      const result = await shareApplication();
      setShareNotice(result === 'copied' ? 'تم نسخ رابط التطبيق' : 'تم فتح المشاركة');
      window.setTimeout(() => setShareNotice(''), 2500);
    } catch (error) {
      // Closing the native share sheet is not an error.
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setShareNotice('تعذرت المشاركة حالياً');
      window.setTimeout(() => setShareNotice(''), 2500);
    }
  };

  return (
    <aside className="ios-install-prompt" role="status" dir="rtl">
      <button className="ios-install-prompt-close" onClick={dismiss} aria-label="إغلاق">
        <X size={16} />
      </button>
      <button
        type="button"
        className="ios-install-prompt-icon cursor-pointer transition-transform hover:scale-105 active:scale-95"
        onClick={() => void shareApp()}
        aria-label="مشاركة تطبيق البارون"
        title="مشاركة التطبيق"
      >
        <Share2 size={18} />
      </button>
      <div className="ios-install-prompt-copy">
        <strong>ثبّت تطبيق البارون على جهازك</strong>
        <span>من Safari اضغط «مشاركة» ثم «إضافة إلى الشاشة الرئيسية».</span>
        {shareNotice && <small role="status">{shareNotice}</small>}
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
