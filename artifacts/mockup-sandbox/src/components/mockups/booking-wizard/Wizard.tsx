import { ArrowRight, CalendarDays, Check, ChevronLeft, Crown, Scissors, Sparkles, UserRound, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import "./_group.css";

type Mode = "queue" | "appointment";
type ServiceId = "signature" | "beard" | "combo";

const services: Array<{ id: ServiceId; title: string; description: string; price: string; duration: string }> = [
  { id: "signature", title: "قصة البارون", description: "تدريج وتصفيف بلمسة الحلاق", price: "45", duration: "35 دقيقة" },
  { id: "beard", title: "تهذيب اللحية", description: "تحديد ساخن وعناية دقيقة", price: "30", duration: "25 دقيقة" },
  { id: "combo", title: "القصة واللحية", description: "التجربة الكاملة في جلسة واحدة", price: "65", duration: "55 دقيقة" },
];

const barbers = [
  { name: "سامر", initials: "س", note: "متخصص في القصات الكلاسيكية", status: "متاح اليوم" },
  { name: "فادي", initials: "ف", note: "خبير التدرجات والستايل الحديث", status: "متاح اليوم" },
  { name: "أول حلاق متاح", initials: "ب", note: "نختار لك الحلاق الأسرع", status: "أقرب دور" },
];

const dates = [
  { day: "اليوم", number: "٢٤" },
  { day: "غداً", number: "٢٥" },
  { day: "الخميس", number: "٢٦" },
  { day: "الجمعة", number: "٢٧" },
];

const times = ["١٦:٣٠", "١٧:٠٠", "١٨:٣٠", "١٩:٠٠", "٢٠:٣٠", "٢١:٠٠"];
const references = ["تدريج ملكي", "كلاسيك أنيق", "لحية منحوتة"];

function ChoiceMark({ selected }: { selected: boolean }) {
  return <span className="baron-check" aria-hidden="true">{selected ? <Check size={13} strokeWidth={3} /> : null}</span>;
}

export function Wizard() {
  const [mode, setMode] = useState<Mode>("queue");
  const [serviceId, setServiceId] = useState<ServiceId>("signature");
  const [barber, setBarber] = useState("سامر");
  const [date, setDate] = useState("اليوم");
  const [time, setTime] = useState("١٨:٣٠");
  const [reference, setReference] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [confirmed, setConfirmed] = useState(false);

  const totalSteps = mode === "appointment" ? 5 : 4;
  const selectedService = useMemo(() => services.find((service) => service.id === serviceId) ?? services[0], [serviceId]);
  const selectedBarber = useMemo(() => barbers.find((item) => item.name === barber) ?? barbers[0], [barber]);
  const isDateStep = mode === "appointment" && step === 4;
  const isReferenceStep = (mode === "appointment" && step === 5) || (mode === "queue" && step === 4);

  const goNext = () => {
    if (step < totalSteps) setStep((current) => current + 1);
    else setConfirmed(true);
  };

  const goBack = () => {
    if (step > 1) setStep((current) => current - 1);
  };

  if (confirmed) {
    return (
      <main className="baron-wizard-shell" dir="rtl">
        <div className="baron-wizard">
          <header className="baron-topbar">
            <div className="baron-brand">
              <div className="baron-crown"><Crown size={19} strokeWidth={1.5} /></div>
              <div><div className="baron-brand-name">البارون</div><div className="baron-brand-sub">BARON BARBER</div></div>
            </div>
            <button className="baron-back" type="button" onClick={() => setConfirmed(false)}><ArrowRight size={15} /> تعديل الحجز</button>
          </header>
          <section className="baron-confirm" aria-live="polite">
            <div>
              <div className="baron-confirm-mark"><Check size={35} strokeWidth={1.7} /></div>
              <h2>تم تأكيد حجزك</h2>
              <p>ننتظرك في البارون. احتفظ بتفاصيل حجزك، وسنكون جاهزين لك في الوقت المختار.</p>
              <div className="baron-confirm-card">
                <strong>{mode === "queue" ? "دور حالي" : `${date} · ${time}`}</strong>
                <span>{selectedService.title} · {selectedBarber.name}</span>
                {reference ? <span>المرجع: {reference}</span> : null}
              </div>
              <button className="baron-primary" type="button" style={{ marginTop: 18, width: "100%" }} onClick={() => { setConfirmed(false); setStep(1); }}>حجز جديد</button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="baron-wizard-shell" dir="rtl">
      <div className="baron-wizard">
        <header className="baron-topbar">
          <div className="baron-brand">
            <div className="baron-crown"><Crown size={19} strokeWidth={1.5} /></div>
            <div><div className="baron-brand-name">البارون</div><div className="baron-brand-sub">BARON BARBER</div></div>
          </div>
          <button className="baron-back" type="button" onClick={() => setStep(1)}><ArrowRight size={15} /> إلغاء</button>
        </header>

        <div className="baron-heading">
          <p className="baron-eyebrow">تجربة البارون · شارع الجامعة</p>
          <h1>{step === 1 ? "كيف تحب تزورنا؟" : step === 2 ? "اختر خدمتك" : step === 3 ? "من تحب أن يحلق لك؟" : isDateStep ? "متى نجهز لك الكرسي؟" : "لمستك الأخيرة"}</h1>
          <p>{step === 1 ? "اختصر وقت الانتظار أو احجز موعدك على راحتك." : step === 2 ? "كل خدمة تُنفّذ بنفس العناية التي نعرف بها." : step === 3 ? "اختر حلاقك المفضل، أو دعنا نختار لك الأقرب." : isDateStep ? "اختر اليوم والساعة التي تناسب إيقاعك." : "الصورة اختيارية، لكنها تساعدنا على فهم ذوقك."}</p>
        </div>

        <div className="baron-progress-wrap" aria-label={`الخطوة ${step} من ${totalSteps}`}>
          <div className="baron-progress-meta"><strong>الخطوة {step} من {totalSteps}</strong><span>{step === totalSteps ? "جاهز للتأكيد" : "حجز سريع"}</span></div>
          <div className="baron-progress-track">{Array.from({ length: totalSteps }, (_, index) => <span className={`baron-progress-segment ${index < step ? "is-done" : ""}`} key={index} />)}</div>
        </div>

        <section className="baron-step" key={`${mode}-${step}`}>
          {step === 1 ? (
            <div className="baron-option-list">
              <p className="baron-step-kicker">اختر الطريقة الأنسب لك</p>
              <button type="button" className={`baron-choice ${mode === "queue" ? "is-selected" : ""}`} onClick={() => setMode("queue")}>
                <span className="baron-choice-icon"><UsersRound size={20} /></span>
                <span className="baron-choice-copy"><span className="baron-choice-title">دور حالي</span><span className="baron-choice-description">انضم الآن واحصل على دورك عند وصولك</span></span>
                <ChoiceMark selected={mode === "queue"} />
              </button>
              <button type="button" className={`baron-choice ${mode === "appointment" ? "is-selected" : ""}`} onClick={() => setMode("appointment")}>
                <span className="baron-choice-icon"><CalendarDays size={20} /></span>
                <span className="baron-choice-copy"><span className="baron-choice-title">موعد محدد</span><span className="baron-choice-description">احجز كرسياً خاصاً في يوم ووقت تختارهما</span></span>
                <ChoiceMark selected={mode === "appointment"} />
              </button>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="baron-option-list">
              <p className="baron-step-kicker">خدماتنا تبدأ من التفاصيل</p>
              {services.map((service) => (
                <button type="button" key={service.id} className={`baron-choice ${serviceId === service.id ? "is-selected" : ""}`} onClick={() => setServiceId(service.id)}>
                  <span className="baron-choice-icon"><Scissors size={19} /></span>
                  <span className="baron-choice-copy"><span className="baron-choice-title">{service.title}</span><span className="baron-choice-description">{service.description} · {service.duration}</span></span>
                  <span className="baron-service-price">{service.price}<small> ₪</small></span>
                </button>
              ))}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="baron-option-list">
              <p className="baron-step-kicker">كل واحد منهم يعرف كيف يترك فرقاً</p>
              {barbers.map((item) => (
                <button type="button" key={item.name} className={`baron-choice baron-barber-card ${barber === item.name ? "is-selected" : ""}`} onClick={() => setBarber(item.name)}>
                  <span className="baron-barber-avatar">{item.initials}</span>
                  <span className="baron-choice-copy"><span className="baron-choice-title">{item.name}</span><span className="baron-barber-note">{item.note}</span><span className="baron-status"><i className="baron-status-dot" /> {item.status}</span></span>
                  <ChoiceMark selected={barber === item.name} />
                </button>
              ))}
            </div>
          ) : null}

          {isDateStep ? (
            <div>
              <p className="baron-step-kicker">الأوقات المتاحة لهذا الأسبوع</p>
              <div className="baron-date-row">{dates.map((item) => <button type="button" key={item.day} className={`baron-date ${date === item.day ? "is-selected" : ""}`} onClick={() => setDate(item.day)}><span className="baron-date-weekday">{item.day}</span><span className="baron-date-number">{item.number}</span></button>)}</div>
              <h3 className="baron-subhead">اختر الساعة</h3>
              <div className="baron-time-grid">{times.map((item) => <button type="button" key={item} className={`baron-time ${time === item ? "is-selected" : ""}`} onClick={() => setTime(item)}>{item}</button>)}</div>
            </div>
          ) : null}

          {isReferenceStep ? (
            <div>
              <p className="baron-step-kicker">صورة واحدة تكفي لتصل الفكرة</p>
              <div className="baron-reference-grid">{references.map((item, index) => <button type="button" key={item} className={`baron-reference ${reference === item ? "is-selected" : ""}`} onClick={() => setReference(reference === item ? null : item)}><span className="baron-reference-art" /><span className="baron-reference-label">{item}</span>{reference === item ? <span className="baron-reference-check"><Check size={16} strokeWidth={3} /></span> : null}</button>)}</div>
              <span className="baron-optional">اختياري · يمكنك المتابعة بدون اختيار</span>
              <div className="baron-summary">
                <p className="baron-summary-title">ملخص حجزك</p>
                <div className="baron-summary-row"><span className="baron-summary-label">الزيارة</span><span className="baron-summary-value">{mode === "queue" ? "دور حالي" : `${date} · ${time}`}</span></div>
                <div className="baron-summary-row"><span className="baron-summary-label">الخدمة</span><span className="baron-summary-value">{selectedService.title}</span></div>
                <div className="baron-summary-row"><span className="baron-summary-label">الحلاق</span><span className="baron-summary-value">{selectedBarber.name}</span></div>
              </div>
            </div>
          ) : null}
        </section>

        <footer className="baron-footer">
          <button className="baron-primary" type="button" onClick={goNext}>{step === totalSteps ? "تأكيد الحجز" : "التالي"} <ChevronLeft size={16} style={{ verticalAlign: "middle" }} /></button>
          {step > 1 ? <button className="baron-secondary" type="button" onClick={goBack}>رجوع</button> : null}
        </footer>
      </div>
    </main>
  );
}

export default Wizard;