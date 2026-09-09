import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronLeft, Crown, Scissors, Sparkles, UsersRound } from "lucide-react";
import { useState, type CSSProperties } from "react";

type Service = "signature" | "beard" | "combo";

const services = [
  { id: "signature" as Service, title: "قصة البارون", detail: "تدريج وتصفيف بلمسة الحلاق", price: "45", mins: "35 دقيقة" },
  { id: "beard" as Service, title: "تهذيب اللحية", detail: "تحديد ساخن وعناية دقيقة", price: "30", mins: "25 دقيقة" },
  { id: "combo" as Service, title: "القصة واللحية", detail: "التجربة الكاملة في جلسة واحدة", price: "65", mins: "55 دقيقة" },
];

const barbers = [
  { name: "أول حلاق متاح", caption: "الأسرع الآن", initials: "ب", live: "متاح · يبدأ خلال 12 دقيقة" },
  { name: "سامر", caption: "قصات كلاسيكية", initials: "س", live: "متاح اليوم" },
  { name: "فادي", caption: "التدرجات والستايل الحديث", initials: "ف", live: "متاح اليوم" },
];

function Mark({ active }: { active: boolean }) {
  return <span style={{ width: 23, height: 23, borderRadius: "50%", display: "grid", placeItems: "center", background: active ? "#c89a4b" : "transparent", border: active ? "none" : "1px solid #665744", color: "#201e1b", flexShrink: 0 }}>{active && <Check size={14} strokeWidth={3} />}</span>;
}

export function QueueFast() {
  const [step, setStep] = useState(1);
  const [service, setService] = useState<Service>("signature");
  const [barber, setBarber] = useState("أول حلاق متاح");
  const [confirmed, setConfirmed] = useState(false);
  const chosen = services.find((item) => item.id === service)!;

  if (confirmed) return (
    <main dir="rtl" style={shell}>
      <div style={frame}>
        <header style={topbar}><div style={brand}><span style={crown}><Crown size={18} /></span><span><b style={brandName}>البارون</b><small style={brandSub}>BARON BARBER</small></span></div><button style={edit} onClick={() => setConfirmed(false)}><ArrowRight size={15} /> تعديل الحجز</button></header>
        <section style={{ padding: "54px 38px 30px", textAlign: "center" }} aria-live="polite">
          <div style={{ width: 73, height: 73, margin: "0 auto 21px", borderRadius: "50%", display: "grid", placeItems: "center", border: "1px solid #c89a4b", color: "#d3a85b", background: "#2d2923" }}><Check size={37} strokeWidth={1.5} /></div>
          <p style={eyebrow}>حجزك مؤكد · دورك محفوظ</p><h1 style={{ ...title, fontSize: 34, marginTop: 8 }}>أهلاً بك في الدور</h1>
          <p style={{ color: "#b8ab98", lineHeight: 1.8, maxWidth: 390, margin: "10px auto 25px" }}>وصل طلبك بنجاح. تابع تقدم الدور من هاتفك وخذ وقتك — سنكون جاهزين لك قريباً.</p>
          <div style={{ ...card, textAlign: "right", padding: 23, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: "0 0 0 auto", width: 4, background: "#c89a4b" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}><div><small style={muted}>رقم دورك</small><strong style={{ display: "block", color: "#e3b668", fontSize: 41, letterSpacing: 2, lineHeight: 1.1 }}>#٠٧</strong></div><span style={livePill}><i style={dot} /> جاري التحديث</span></div>
            <div style={{ height: 1, background: "#4a4033", margin: "18px 0" }} /><div style={{ display: "flex", justifyContent: "space-between", color: "#dfd0ba" }}><span>{chosen.title}</span><span style={{ color: "#988d7d" }}>الخدمة</span></div><div style={{ display: "flex", justifyContent: "space-between", color: "#dfd0ba", marginTop: 10 }}><span>{barber}</span><span style={{ color: "#988d7d" }}>الحلاق</span></div>
          </div>
          <div style={{ marginTop: 20, background: "#302b24", border: "1px solid #4f4435", borderRadius: 10, padding: "16px 18px", display: "flex", alignItems: "center", gap: 13, textAlign: "right" }}><span style={{ color: "#d3a85b" }}><Sparkles size={20} /></span><span><b style={{ color: "#eee0ca", display: "block", fontSize: 14 }}>متوقع دخولك خلال 12–18 دقيقة</b><small style={{ color: "#a99d8c" }}>يتغير الوقت مع تقدم الدور</small></span></div>
        </section>
        <footer style={footer}><button style={primary} onClick={() => setConfirmed(false)}>حجز دور جديد <ArrowLeft size={16} /></button></footer>
      </div>
    </main>
  );

  return (
    <main dir="rtl" style={shell}>
      <div style={frame}>
        <header style={topbar}><div style={brand}><span style={crown}><Crown size={18} /></span><span><b style={brandName}>البارون</b><small style={brandSub}>BARON BARBER</small></span></div><span style={openNow}><i style={dot} /> مفتوح الآن</span></header>
        <div style={{ padding: "27px 38px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}><div><p style={eyebrow}>حجز سريع · دور حالي</p><h1 style={title}>احجز دورك<br /><em>بدون انتظار.</em></h1></div><span style={{ color: "#827666", fontSize: 12 }}>٠{step} / ٠٣</span></div>
          <div style={{ display: "flex", gap: 5, margin: "22px 0 28px" }}>{[1, 2, 3].map((n) => <span key={n} style={{ height: 3, flex: 1, borderRadius: 4, background: n <= step ? "#c89a4b" : "#463d31", transition: "background .2s" }} />)}</div>
        </div>
        <section style={{ padding: "0 38px 22px", minHeight: 310 }}>
          {step === 1 && <div><div style={sectionHead}><span style={iconBox}><Scissors size={18} /></span><span><b style={head}>اختر خدمتك</b><small style={sub}>نبدأ بالأساس، ثم نكمل التفاصيل</small></span></div><div style={list}>{services.map((item) => <button key={item.id} onClick={() => setService(item.id)} style={{ ...choice, borderColor: service === item.id ? "#b18446" : "#4b4134", background: service === item.id ? "#302a22" : "#27241f" }}><span style={{ ...serviceIcon, color: service === item.id ? "#d2a85a" : "#8c7c68" }}><Scissors size={18} /></span><span style={{ flex: 1, textAlign: "right" }}><b style={choiceTitle}>{item.title}</b><small style={choiceSub}>{item.detail} · {item.mins}</small></span><span style={{ color: "#d1a258", fontFamily: "monospace", fontSize: 15 }}>{item.price} <small>₪</small></span><Mark active={service === item.id} /></button>)}</div></div>}
          {step === 2 && <div><div style={sectionHead}><span style={iconBox}><UsersRound size={18} /></span><span><b style={head}>من يعتني بك اليوم؟</b><small style={sub}>اختر شخصاً أو دعنا نختار الأسرع</small></span></div><div style={list}>{barbers.map((item) => <button key={item.name} onClick={() => setBarber(item.name)} style={{ ...choice, borderColor: barber === item.name ? "#b18446" : "#4b4134", background: barber === item.name ? "#302a22" : "#27241f" }}><span style={{ width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: "50%", color: "#d7b170", background: "#4a3b2a", fontSize: 18 }}>{item.initials}</span><span style={{ flex: 1, textAlign: "right" }}><b style={choiceTitle}>{item.name}</b><small style={choiceSub}>{item.caption}</small><small style={{ ...choiceSub, color: "#b99555" }}><i style={dot} /> {item.live}</small></span><Mark active={barber === item.name} /></button>)}</div></div>}
          {step === 3 && <div><div style={sectionHead}><span style={iconBox}><CalendarDays size={18} /></span><span><b style={head}>جاهز؟ هذا ملخص دورك</b><small style={sub}>كل شيء واضح قبل التأكيد</small></span></div><div style={{ ...card, padding: 22, marginTop: 18 }}><div style={summary}><span>الزيارة</span><b>دور حالي</b></div><div style={summary}><span>الخدمة</span><b>{chosen.title}</b></div><div style={summary}><span>الحلاق</span><b>{barber}</b></div><div style={{ borderTop: "1px solid #4a4033", marginTop: 17, paddingTop: 17, display: "flex", gap: 10, color: "#b99a60", fontSize: 13 }}><Sparkles size={16} /> تأكيد فوري — لا تحتاج للانتظار هنا</div></div></div>}
        </section>
        <footer style={footer}><button style={primary} onClick={() => step < 3 ? setStep(step + 1) : setConfirmed(true)}>{step === 3 ? "تأكيد الدور الآن" : "التالي"} <ChevronLeft size={17} /></button>{step > 1 && <button style={secondary} onClick={() => setStep(step - 1)}>رجوع</button>}</footer>
      </div>
    </main>
  );
}

const shell: CSSProperties = { minHeight: "100dvh", background: "#1d1b18", color: "#eee3d1", padding: "18px 12px", fontFamily: "'DM Sans', 'Tahoma', sans-serif" };
const frame: CSSProperties = { width: "100%", maxWidth: 570, minHeight: "calc(100dvh - 36px)", margin: "0 auto", background: "#24221f", border: "1px solid #3f382f", borderRadius: 16, overflow: "hidden", boxShadow: "0 18px 60px rgba(0,0,0,.26)" };
const topbar: CSSProperties = { height: 76, padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #3b352d" };
const brand: CSSProperties = { display: "flex", alignItems: "center", gap: 10 }; const crown: CSSProperties = { width: 34, height: 34, display: "grid", placeItems: "center", color: "#d0a152", border: "1px solid #6b5331", borderRadius: 8 }; const brandName: CSSProperties = { display: "block", fontFamily: "serif", fontSize: 18, fontWeight: 500 }; const brandSub: CSSProperties = { display: "block", color: "#897b68", fontSize: 8, letterSpacing: 2 }; const openNow: CSSProperties = { color: "#b2a18a", fontSize: 11, display: "flex", gap: 6, alignItems: "center" }; const dot: CSSProperties = { width: 7, height: 7, display: "inline-block", borderRadius: "50%", background: "#b89a5d" }; const eyebrow: CSSProperties = { color: "#c79c50", fontSize: 11, letterSpacing: 1, margin: 0 }; const title: CSSProperties = { fontFamily: "serif", fontWeight: 400, fontSize: 35, lineHeight: 1.12, margin: "9px 0 0", color: "#f1e4cf" }; const card: CSSProperties = { background: "#292621", border: "1px solid #4c4235", borderRadius: 11 }; const sectionHead: CSSProperties = { display: "flex", alignItems: "center", gap: 12 }; const iconBox: CSSProperties = { width: 37, height: 37, borderRadius: 9, display: "grid", placeItems: "center", color: "#c99b51", background: "#342c21", border: "1px solid #59472f" }; const head: CSSProperties = { display: "block", fontSize: 18, fontWeight: 500 }; const sub: CSSProperties = { display: "block", color: "#938777", fontSize: 12, marginTop: 4 }; const list: CSSProperties = { display: "grid", gap: 9, marginTop: 19 }; const choice: CSSProperties = { width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 14px", borderRadius: 10, border: "1px solid", color: "#eadcca", textAlign: "right", cursor: "pointer", transition: "background .2s, border-color .2s" }; const serviceIcon: CSSProperties = { width: 33, height: 33, display: "grid", placeItems: "center", borderRadius: 8, background: "#393127" }; const choiceTitle: CSSProperties = { display: "block", fontSize: 14, fontWeight: 500 }; const choiceSub: CSSProperties = { display: "block", color: "#918475", fontSize: 11, marginTop: 4 }; const footer: CSSProperties = { padding: "18px 38px 27px", borderTop: "1px solid #3b352d", display: "flex", gap: 10, alignItems: "center" }; const primary: CSSProperties = { flex: 1, border: 0, borderRadius: 8, background: "#c89a4b", color: "#211d18", fontWeight: 700, padding: "14px 18px", fontSize: 14, display: "flex", justifyContent: "center", alignItems: "center", gap: 8, cursor: "pointer" }; const secondary: CSSProperties = { border: 0, background: "transparent", color: "#a59683", padding: 13, fontSize: 13, cursor: "pointer" }; const summary: CSSProperties = { display: "flex", justifyContent: "space-between", padding: "11px 0", color: "#938777", fontSize: 13 }; const muted: CSSProperties = { color: "#988c7c", fontSize: 12 }; const livePill: CSSProperties = { color: "#c9aa70", background: "#393123", border: "1px solid #655235", borderRadius: 99, padding: "6px 9px", fontSize: 10, display: "flex", alignItems: "center", gap: 5 }; const edit: CSSProperties = { background: "transparent", border: 0, color: "#b1a28f", display: "flex", alignItems: "center", gap: 5, cursor: "pointer", fontSize: 12 };

export default QueueFast;