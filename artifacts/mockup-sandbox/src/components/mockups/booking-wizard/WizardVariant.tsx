import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronLeft, Crown, Scissors, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";

type Mode = "queue" | "appointment";
type ServiceId = "signature" | "beard" | "combo";

const services = [
  { id: "signature" as ServiceId, title: "قصة البارون", desc: "تدريج وتصفيف بلمسة الحلاق", price: "45", time: "35 دقيقة" },
  { id: "beard" as ServiceId, title: "تهذيب اللحية", desc: "تحديد ساخن وعناية دقيقة", price: "30", time: "25 دقيقة" },
  { id: "combo" as ServiceId, title: "القصة واللحية", desc: "التجربة الكاملة في جلسة واحدة", price: "65", time: "55 دقيقة" },
];
const barbers = [
  { name: "سامر", initials: "س", note: "القصات الكلاسيكية", status: "متاح اليوم" },
  { name: "فادي", initials: "ف", note: "التدرجات والستايل الحديث", status: "متاح اليوم" },
  { name: "أول حلاق متاح", initials: "ب", note: "نختار لك الأقرب", status: "أقرب دور" },
];
const dates = [{ day: "اليوم", number: "٢٤" }, { day: "غداً", number: "٢٥" }, { day: "الخميس", number: "٢٦" }, { day: "الجمعة", number: "٢٧" }];
const times = ["١٦:٣٠", "١٧:٠٠", "١٨:٣٠", "١٩:٠٠", "٢٠:٣٠", "٢١:٠٠"];

export function WizardVariant() {
  const [mode, setMode] = useState<Mode>("queue");
  const [service, setService] = useState<ServiceId>("signature");
  const [barber, setBarber] = useState("سامر");
  const [date, setDate] = useState("اليوم");
  const [time, setTime] = useState("١٨:٣٠");
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const selected = useMemo(() => services.find((item) => item.id === service) ?? services[0], [service]);
  const total = mode === "appointment" ? 5 : 4;
  const isDate = mode === "appointment" && step === 4;
  const title = step === 1 ? "كيف تحب تزورنا؟" : step === 2 ? "اختر خدمتك" : step === 3 ? "من يحلق لك؟" : isDate ? "متى نجهز لك الكرسي؟" : "مراجعة الحجز";

  const next = () => step === total ? setDone(true) : setStep((value) => value + 1);
  const reset = () => { setDone(false); setStep(1); };

  return (
    <main dir="rtl" className="wv-shell">
      <style>{`
        .wv-shell{min-height:100dvh;background:#211f1c;color:#f5eee3;font-family:ui-sans-serif,system-ui,sans-serif;padding:clamp(14px,3vw,42px);box-sizing:border-box}
        .wv-frame{max-width:1080px;min-height:670px;margin:auto;background:#2b2925;border:1px solid #554b40;display:grid;grid-template-columns:280px 1fr;box-shadow:0 24px 80px #151311;overflow:hidden}
        .wv-rail{background:#24221f;border-left:1px solid #51483e;padding:30px 24px;display:flex;flex-direction:column;justify-content:space-between}
        .wv-brand{display:flex;gap:12px;align-items:center}.wv-crown{width:38px;height:38px;border:1px solid #ac8952;color:#d8b36e;display:grid;place-items:center}.wv-brand strong{font-family:Georgia,serif;font-size:21px;font-weight:500;display:block}.wv-brand small{font-size:8px;letter-spacing:2px;color:#b8a99a;display:block;margin-top:3px}
        .wv-rail-title{color:#b9aa9a;font-size:11px;margin:55px 0 22px}.wv-steps{display:grid;gap:19px}.wv-step{display:flex;align-items:center;gap:12px;color:#84796e;font-size:12px}.wv-step b{width:27px;height:27px;border:1px solid #574d43;display:grid;place-items:center;font-size:11px;font-weight:500}.wv-step.active{color:#f5eee3}.wv-step.active b,.wv-step.done b{background:#b89155;border-color:#b89155;color:#211f1c}.wv-rule{height:1px;background:#4a4138;margin:28px 0}.wv-address{font-size:11px;color:#a99b8d;line-height:1.8}.wv-address strong{font-size:12px;color:#eee4d7;font-weight:500}
        .wv-main{padding:34px clamp(22px,5vw,64px);display:flex;flex-direction:column}.wv-top{display:flex;justify-content:space-between;align-items:center;color:#a99887;font-size:11px}.wv-cancel{background:none;border:0;color:#b8aa9b;cursor:pointer;font:inherit;display:flex;align-items:center;gap:6px}.wv-heading{margin:48px 0 28px}.wv-kicker{font-size:10px;letter-spacing:1.5px;color:#bd9659;margin:0 0 12px}.wv-heading h1{font:500 clamp(28px,4vw,43px)/1.15 Georgia,serif;margin:0;color:#fbf5eb}.wv-heading p{color:#b4a699;font-size:13px;margin:13px 0 0;max-width:430px;line-height:1.8}.wv-content{max-width:650px;flex:1}.wv-label{color:#cbbcad;font-size:11px;margin:0 0 13px}.wv-list{display:grid;gap:9px}.wv-choice{width:100%;text-align:right;background:#322f2a;border:1px solid #4a4239;color:#f5eee3;padding:15px 16px;display:flex;align-items:center;gap:13px;cursor:pointer;transition:transform .18s,background .18s,border-color .18s}.wv-choice:hover{transform:translateX(-3px);border-color:#9f7c4b}.wv-choice.selected{background:#3b342b;border-color:#b78f54}.wv-icon{width:33px;height:33px;display:grid;place-items:center;background:#292622;color:#c19a60;flex:none}.wv-copy{display:grid;gap:4px;flex:1}.wv-copy strong{font-size:14px;font-weight:500}.wv-copy span{font-size:11px;color:#a99b8d}.wv-mark{width:18px;height:18px;border:1px solid #6d6257;display:grid;place-items:center;color:#211f1c}.selected .wv-mark{background:#c39b5e;border-color:#c39b5e}.wv-price{font:18px Georgia,serif;color:#d4ad6a}.wv-price small{font:10px sans-serif}.wv-dates{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.wv-date,.wv-time{background:#322f2a;border:1px solid #4a4239;color:#e9ded2;padding:13px 7px;cursor:pointer}.wv-date span{display:block}.wv-date-day{font-size:10px;color:#aa9c8e;margin-bottom:5px}.wv-date-num{font:22px Georgia,serif}.wv-date.selected,.wv-time.selected{background:#b88f55;color:#211f1c;border-color:#b88f55}.wv-date.selected .wv-date-day{color:#4f3b24}.wv-sub{font-size:11px;color:#cbbcad;margin:24px 0 12px}.wv-times{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.wv-time{font-size:13px}.wv-summary{margin-top:18px;border-top:1px solid #51473d;padding-top:15px;display:grid;gap:9px}.wv-summary-row{display:flex;justify-content:space-between;font-size:12px}.wv-summary-row span:first-child{color:#9e9185}.wv-summary-row span:last-child{color:#eee3d5}.wv-actions{display:flex;align-items:center;gap:20px;margin-top:35px}.wv-primary{background:#c39a5b;border:0;color:#211f1c;padding:14px 24px;cursor:pointer;font-weight:600;font-size:12px;display:flex;align-items:center;gap:18px}.wv-secondary{background:none;border:0;color:#aa9d90;cursor:pointer;font-size:12px}.wv-confirm{max-width:550px;margin:auto;text-align:center}.wv-confirm-mark{width:64px;height:64px;border:1px solid #c39a5b;color:#c39a5b;display:grid;place-items:center;margin:0 auto 25px}.wv-confirm h2{font:500 36px Georgia,serif;margin:0}.wv-confirm p{color:#b5a89b;font-size:13px;line-height:1.8}.wv-card{border:1px solid #635545;background:#322e29;text-align:right;padding:18px;margin-top:25px;display:grid;gap:8px}.wv-card strong{color:#d5ac69}.wv-card span{font-size:12px;color:#c3b4a5}
        @media(max-width:720px){.wv-frame{display:block;min-height:calc(100dvh - 28px)}.wv-rail{padding:18px 20px;border-left:0;border-bottom:1px solid #51483e}.wv-rail-title,.wv-address{display:none}.wv-steps{display:flex;margin-top:18px;justify-content:space-between}.wv-step{font-size:0;gap:0}.wv-step b{font-size:11px}.wv-rule{display:none}.wv-main{padding:26px 20px 30px}.wv-heading{margin:32px 0 24px}.wv-dates{gap:5px}.wv-times{grid-template-columns:repeat(2,1fr)}}
      `}</style>
      <div className="wv-frame">
        <aside className="wv-rail">
          <div>
            <div className="wv-brand"><div className="wv-crown"><Crown size={18}/></div><div><strong>البارون</strong><small>BARON BARBER</small></div></div>
            <p className="wv-rail-title">رحلتك معنا</p>
            <div className="wv-steps">
              {["طريقة الزيارة","الخدمة","الحلاق",...(mode === "appointment" ? ["الموعد"] : []),"التأكيد"].map((item, i) => <div className={`wv-step ${i + 1 === step ? "active" : ""} ${i + 1 < step ? "done" : ""}`} key={item}><b>{i + 1 < step ? <Check size={13}/> : i + 1}</b><span>{item}</span></div>)}
            </div>
          </div>
          <div className="wv-address"><div className="wv-rule"/><strong>شارع الجامعة</strong><br/>البارون — ننتظرك كما تحب</div>
        </aside>
        <section className="wv-main">
          <div className="wv-top"><span>حجز جديد / {String(step).padStart(2, "0")}</span><button className="wv-cancel" onClick={reset} type="button"><ArrowRight size={14}/> إلغاء</button></div>
          {done ? <div className="wv-confirm"><div className="wv-confirm-mark"><Check size={31}/></div><h2>تم تأكيد حجزك</h2><p>ننتظرك في البارون. احتفظ بتفاصيل حجزك، وسنكون جاهزين لك في الوقت المختار.</p><div className="wv-card"><strong>{mode === "queue" ? "دور حالي" : `${date} · ${time}`}</strong><span>{selected.title} · {barber}</span></div><button className="wv-primary" style={{margin:"22px auto 0"}} onClick={reset} type="button">حجز جديد <ArrowLeft size={15}/></button></div> : <>
            <div className="wv-heading"><p className="wv-kicker">تجربة البارون · شارع الجامعة</p><h1>{title}</h1><p>{step === 1 ? "اختصر وقت الانتظار أو احجز موعدك على راحتك." : step === 2 ? "كل خدمة تُنفّذ بنفس العناية التي نعرف بها." : step === 3 ? "اختر حلاقك المفضل، أو دعنا نختار لك الأقرب." : isDate ? "اختر اليوم والساعة التي تناسب إيقاعك." : "خطوة أخيرة قبل أن نجهز لك الكرسي."}</p></div>
            <div className="wv-content">
              {step === 1 && <div><p className="wv-label">اختر الطريقة الأنسب لك</p><div className="wv-list"><button className={`wv-choice ${mode === "queue" ? "selected" : ""}`} onClick={() => setMode("queue")} type="button"><span className="wv-icon"><UsersRound size={18}/></span><span className="wv-copy"><strong>دور حالي</strong><span>انضم الآن واحصل على دورك عند وصولك</span></span><span className="wv-mark">{mode === "queue" && <Check size={12}/>}</span></button><button className={`wv-choice ${mode === "appointment" ? "selected" : ""}`} onClick={() => setMode("appointment")} type="button"><span className="wv-icon"><CalendarDays size={18}/></span><span className="wv-copy"><strong>موعد محدد</strong><span>احجز كرسياً خاصاً في يوم ووقت تختارهما</span></span><span className="wv-mark">{mode === "appointment" && <Check size={12}/>}</span></button></div></div>}
              {step === 2 && <div><p className="wv-label">خدماتنا تبدأ من التفاصيل</p><div className="wv-list">{services.map((item) => <button className={`wv-choice ${service === item.id ? "selected" : ""}`} onClick={() => setService(item.id)} type="button" key={item.id}><span className="wv-icon"><Scissors size={17}/></span><span className="wv-copy"><strong>{item.title}</strong><span>{item.desc} · {item.time}</span></span><span className="wv-price">{item.price}<small> ₪</small></span></button>)}</div></div>}
              {step === 3 && <div><p className="wv-label">كل واحد منهم يعرف كيف يترك فرقاً</p><div className="wv-list">{barbers.map((item) => <button className={`wv-choice ${barber === item.name ? "selected" : ""}`} onClick={() => setBarber(item.name)} type="button" key={item.name}><span className="wv-icon" style={{fontFamily:"Georgia",fontSize:18}}>{item.initials}</span><span className="wv-copy"><strong>{item.name}</strong><span>{item.note} · <i style={{color:"#b9a078",fontStyle:"normal"}}>{item.status}</i></span></span><span className="wv-mark">{barber === item.name && <Check size={12}/>}</span></button>)}</div></div>}
              {isDate && <div><p className="wv-label">الأوقات المتاحة لهذا الأسبوع</p><div className="wv-dates">{dates.map((item) => <button className={`wv-date ${date === item.day ? "selected" : ""}`} onClick={() => setDate(item.day)} type="button" key={item.day}><span className="wv-date-day">{item.day}</span><span className="wv-date-num">{item.number}</span></button>)}</div><p className="wv-sub">اختر الساعة</p><div className="wv-times">{times.map((item) => <button className={`wv-time ${time === item ? "selected" : ""}`} onClick={() => setTime(item)} type="button" key={item}>{item}</button>)}</div></div>}
              {((mode === "queue" && step === 4) || (mode === "appointment" && step === 5)) && <div><p className="wv-label">تأكد من التفاصيل قبل الإرسال</p><div className="wv-summary"><div className="wv-summary-row"><span>الزيارة</span><span>{mode === "queue" ? "دور حالي" : `${date} · ${time}`}</span></div><div className="wv-summary-row"><span>الخدمة</span><span>{selected.title}</span></div><div className="wv-summary-row"><span>الحلاق</span><span>{barber}</span></div></div></div>}
            </div>
            <div className="wv-actions"><button className="wv-primary" onClick={next} type="button">{step === total ? "تأكيد الحجز" : "التالي"} <ChevronLeft size={15}/></button>{step > 1 && <button className="wv-secondary" onClick={() => setStep((value) => value - 1)} type="button">رجوع</button>}</div>
          </>}
        </section>
      </div>
    </main>
  );
}

export default WizardVariant;