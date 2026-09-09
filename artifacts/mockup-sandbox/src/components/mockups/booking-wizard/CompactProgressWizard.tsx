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

export function CompactProgressWizard() {
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
  const reset = () => { setDone(false); setStep(1); };

  return (
    <main dir="rtl" className="cpw-shell">
      <style>{`
        .cpw-shell{min-height:100dvh;background:#e9e1d5;color:#302b26;font-family:ui-sans-serif,system-ui,sans-serif;padding:clamp(12px,3vw,38px);box-sizing:border-box}
        .cpw-frame{max-width:1080px;min-height:680px;margin:auto;background:#fbf8f2;border:1px solid #d8cdbf;box-shadow:0 22px 55px rgba(83,64,44,.16);overflow:hidden}
        .cpw-header{padding:21px clamp(20px,4vw,50px) 0;border-bottom:1px solid #e0d6c9;background:#f5f0e8}
        .cpw-brandline{display:flex;justify-content:space-between;align-items:center;gap:16px}.cpw-brand{display:flex;align-items:center;gap:11px}.cpw-crown{width:34px;height:34px;border:1px solid #af8245;color:#a27336;display:grid;place-items:center}.cpw-brand strong{display:block;font:500 20px Georgia,serif}.cpw-brand small{display:block;color:#988c80;font-size:8px;letter-spacing:2px;margin-top:2px}.cpw-cancel{border:0;background:none;color:#958777;cursor:pointer;font-size:11px;display:flex;gap:6px;align-items:center}
        .cpw-progress{display:flex;align-items:flex-start;gap:0;margin-top:27px;overflow:hidden}.cpw-pstep{display:flex;align-items:center;flex:1;min-width:0;color:#a3988d;font-size:10px;white-space:nowrap}.cpw-pstep:last-child{flex:0}.cpw-pstep b{width:25px;height:25px;border:1px solid #d0c4b6;background:#f5f0e8;display:grid;place-items:center;font-size:10px;font-weight:500;flex:none}.cpw-pstep span{margin:0 8px}.cpw-pstep:after{content:"";height:1px;background:#d4c8bb;width:100%;margin-left:5px}.cpw-pstep:last-child:after{display:none}.cpw-pstep.active{color:#60492f}.cpw-pstep.active b,.cpw-pstep.done b{background:#b6884e;border-color:#b6884e;color:#fffaf0}.cpw-pstep.done:after{background:#b6884e}
        .cpw-main{padding:clamp(28px,5vw,52px) clamp(20px,10vw,130px) 38px}.cpw-eyebrow{font-size:10px;letter-spacing:1.5px;color:#a67538;margin:0 0 12px}.cpw-heading{margin:0 0 30px}.cpw-heading h1{font:500 clamp(29px,4vw,43px)/1.15 Georgia,serif;color:#342e28;margin:0}.cpw-heading p{color:#9a8e82;font-size:13px;line-height:1.8;margin:12px 0 0;max-width:500px}.cpw-content{max-width:690px}.cpw-label{color:#88796b;font-size:11px;margin:0 0 13px}.cpw-list{display:grid;gap:9px}.cpw-choice{width:100%;text-align:right;background:#f7f2eb;border:1px solid #ded3c6;color:#3c342d;padding:14px 16px;display:flex;align-items:center;gap:13px;cursor:pointer;transition:transform .18s,background .18s,border-color .18s}.cpw-choice:hover{transform:translateX(-3px);border-color:#b9925c}.cpw-choice.selected{background:#eee3d3;border-color:#b88b50}.cpw-icon{width:34px;height:34px;background:#ede5db;color:#ae7e3e;display:grid;place-items:center;flex:none}.cpw-copy{display:grid;gap:4px;flex:1}.cpw-copy strong{font-size:14px;font-weight:600}.cpw-copy span{font-size:11px;color:#95887b}.cpw-mark{width:18px;height:18px;border:1px solid #b9aa9b;display:grid;place-items:center;color:#fff}.selected .cpw-mark{background:#b98b50;border-color:#b98b50}.cpw-price{font:18px Georgia,serif;color:#9d6b2e}.cpw-price small{font:10px sans-serif}.cpw-dates{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.cpw-date,.cpw-time{background:#f7f2eb;border:1px solid #ded3c6;color:#51473d;padding:13px 7px;cursor:pointer}.cpw-date span{display:block}.cpw-date-day{font-size:10px;color:#988b7d;margin-bottom:5px}.cpw-date-num{font:22px Georgia,serif}.cpw-date.selected,.cpw-time.selected{background:#b88f55;color:#fffaf2;border-color:#b88f55}.cpw-date.selected .cpw-date-day{color:#eddbc0}.cpw-sub{font-size:11px;color:#88796b;margin:24px 0 12px}.cpw-times{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.cpw-time{font-size:13px}.cpw-summary{margin-top:18px;border-top:1px solid #ded3c6;padding-top:15px;display:grid;gap:10px}.cpw-summary-row{display:flex;justify-content:space-between;font-size:12px}.cpw-summary-row span:first-child{color:#a09284}.cpw-summary-row span:last-child{color:#51473d}.cpw-actions{display:flex;align-items:center;gap:20px;margin-top:35px}.cpw-primary{background:#b88a50;border:0;color:#fff9ef;padding:14px 24px;cursor:pointer;font-weight:600;font-size:12px;display:flex;align-items:center;gap:18px}.cpw-secondary{background:none;border:0;color:#978a7d;cursor:pointer;font-size:12px}.cpw-confirm{max-width:550px;margin:35px auto;text-align:center}.cpw-confirm-mark{width:64px;height:64px;border:1px solid #b88a50;color:#a67538;display:grid;place-items:center;margin:0 auto 25px}.cpw-confirm h2{font:500 36px Georgia,serif;margin:0}.cpw-confirm p{color:#988b7e;font-size:13px;line-height:1.8}.cpw-card{border:1px solid #d6c8b8;background:#f5eee4;text-align:right;padding:18px;margin-top:25px;display:grid;gap:8px}.cpw-card strong{color:#9c6d34}.cpw-card span{font-size:12px;color:#7f7164}
        @media(max-width:620px){.cpw-header{padding-top:17px}.cpw-progress{margin-top:20px}.cpw-pstep span{display:none}.cpw-pstep{justify-content:center}.cpw-pstep b{width:23px;height:23px}.cpw-main{padding-top:30px}.cpw-heading{margin-bottom:25px}.cpw-dates{gap:5px}.cpw-times{grid-template-columns:repeat(2,1fr)}}
      `}</style>
      <div className="cpw-frame">
        <header className="cpw-header">
          <div className="cpw-brandline">
            <div className="cpw-brand"><div className="cpw-crown"><Crown size={17}/></div><div><strong>البارون</strong><small>BARON BARBER</small></div></div>
            <button className="cpw-cancel" onClick={reset} type="button"><ArrowRight size={14}/> إلغاء</button>
          </div>
          <div className="cpw-progress">{["طريقة الزيارة","الخدمة","الحلاق",...(mode === "appointment" ? ["الموعد"] : []),"التأكيد"].map((item, i) => <div className={`cpw-pstep ${i + 1 === step ? "active" : ""} ${i + 1 < step ? "done" : ""}`} key={item}><b>{i + 1 < step ? <Check size={12}/> : i + 1}</b><span>{item}</span></div>)}</div>
        </header>
        <section className="cpw-main">
          {done ? <div className="cpw-confirm"><div className="cpw-confirm-mark"><Check size={31}/></div><h2>تم تأكيد حجزك</h2><p>ننتظرك في البارون. احتفظ بتفاصيل حجزك، وسنكون جاهزين لك في الوقت المختار.</p><div className="cpw-card"><strong>{mode === "queue" ? "دور حالي" : `${date} · ${time}`}</strong><span>{selected.title} · {barber}</span></div><button className="cpw-primary" style={{margin:"22px auto 0"}} onClick={reset} type="button">حجز جديد <ArrowLeft size={15}/></button></div> : <>
            <div className="cpw-heading"><p className="cpw-eyebrow">تجربة البارون · شارع الجامعة</p><h1>{title}</h1><p>{step === 1 ? "اختصر وقت الانتظار أو احجز موعدك على راحتك." : step === 2 ? "كل خدمة تُنفّذ بنفس العناية التي نعرف بها." : step === 3 ? "اختر حلاقك المفضل، أو دعنا نختار لك الأقرب." : isDate ? "اختر اليوم والساعة التي تناسب إيقاعك." : "خطوة أخيرة قبل أن نجهز لك الكرسي."}</p></div>
            <div className="cpw-content">
              {step === 1 && <div><p className="cpw-label">اختر الطريقة الأنسب لك</p><div className="cpw-list"><button className={`cpw-choice ${mode === "queue" ? "selected" : ""}`} onClick={() => setMode("queue")} type="button"><span className="cpw-icon"><UsersRound size={18}/></span><span className="cpw-copy"><strong>دور حالي</strong><span>انضم الآن واحصل على دورك عند وصولك</span></span><span className="cpw-mark">{mode === "queue" && <Check size={12}/>}</span></button><button className={`cpw-choice ${mode === "appointment" ? "selected" : ""}`} onClick={() => setMode("appointment")} type="button"><span className="cpw-icon"><CalendarDays size={18}/></span><span className="cpw-copy"><strong>موعد محدد</strong><span>احجز كرسياً خاصاً في يوم ووقت تختارهما</span></span><span className="cpw-mark">{mode === "appointment" && <Check size={12}/>}</span></button></div></div>}
              {step === 2 && <div><p className="cpw-label">خدماتنا تبدأ من التفاصيل</p><div className="cpw-list">{services.map((item) => <button className={`cpw-choice ${service === item.id ? "selected" : ""}`} onClick={() => setService(item.id)} type="button" key={item.id}><span className="cpw-icon"><Scissors size={17}/></span><span className="cpw-copy"><strong>{item.title}</strong><span>{item.desc} · {item.time}</span></span><span className="cpw-price">{item.price}<small> ₪</small></span></button>)}</div></div>}
              {step === 3 && <div><p className="cpw-label">كل واحد منهم يعرف كيف يترك فرقاً</p><div className="cpw-list">{barbers.map((item) => <button className={`cpw-choice ${barber === item.name ? "selected" : ""}`} onClick={() => setBarber(item.name)} type="button" key={item.name}><span className="cpw-icon" style={{fontFamily:"Georgia",fontSize:18}}>{item.initials}</span><span className="cpw-copy"><strong>{item.name}</strong><span>{item.note} · <i style={{color:"#9c773f",fontStyle:"normal"}}>{item.status}</i></span></span><span className="cpw-mark">{barber === item.name && <Check size={12}/>}</span></button>)}</div></div>}
              {isDate && <div><p className="cpw-label">الأوقات المتاحة لهذا الأسبوع</p><div className="cpw-dates">{dates.map((item) => <button className={`cpw-date ${date === item.day ? "selected" : ""}`} onClick={() => setDate(item.day)} type="button" key={item.day}><span className="cpw-date-day">{item.day}</span><span className="cpw-date-num">{item.number}</span></button>)}</div><p className="cpw-sub">اختر الساعة</p><div className="cpw-times">{times.map((item) => <button className={`cpw-time ${time === item ? "selected" : ""}`} onClick={() => setTime(item)} type="button" key={item}>{item}</button>)}</div></div>}
              {((mode === "queue" && step === 4) || (mode === "appointment" && step === 5)) && <div><p className="cpw-label">تأكد من التفاصيل قبل الإرسال</p><div className="cpw-summary"><div className="cpw-summary-row"><span>الزيارة</span><span>{mode === "queue" ? "دور حالي" : `${date} · ${time}`}</span></div><div className="cpw-summary-row"><span>الخدمة</span><span>{selected.title}</span></div><div className="cpw-summary-row"><span>الحلاق</span><span>{barber}</span></div></div></div>}
            </div>
            <div className="cpw-actions"><button className="cpw-primary" onClick={() => step === total ? setDone(true) : setStep((value) => value + 1)} type="button">{step === total ? "تأكيد الحجز" : "التالي"} <ChevronLeft size={15}/></button>{step > 1 && <button className="cpw-secondary" onClick={() => setStep((value) => value - 1)} type="button">رجوع</button>}</div>
          </>}
        </section>
      </div>
    </main>
  );
}

export default CompactProgressWizard;