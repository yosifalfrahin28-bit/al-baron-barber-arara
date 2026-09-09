import { useState } from 'react';
import { Settings, X, Calendar as CalendarIcon, ShieldCheck, ChevronLeft, Bookmark, Ticket, Home, MessageSquareHeart } from 'lucide-react';
import { useLocation } from 'wouter';
import { useSalon } from '@/context/SalonContext';
import { usePhoneAuth } from '@/context/AuthContext';
import { BottomNavigation, Card, GoldButton, IconButton, IconButtonLink, LogoMark, Screen, SectionTitle, StatusPill, cn } from '@/components/SalonUI';
import { trackEvent } from '@/lib/analytics';

export default function Account() {
  const [, setLocation] = useLocation();
  const { profile, setProfile, activeTicket, appointments, lastReminderAt, summon, cancelTicket } = useSalon();
  const { signOut } = usePhoneAuth();
  
  const [name, setName] = useState(profile.name);
  const [phone] = useState(profile.phone);
  const [note, setNote] = useState(profile.note);
  const [editing, setEditing] = useState(false);
  
  const save = () => { 
    setProfile({ name, phone, note }); 
    setEditing(false); 
    alert('تم تحديث ملفك وتفضيلاتك بنجاح.'); 
  };
  
  const sendReminder = () => { 
    summon(undefined, 'account'); 
    trackEvent('whatsapp_opened', { source: 'account_reminder' });
    window.open(`https://wa.me/972527752778?text=${encodeURIComponent(`مرحباً ${name}، تذكير بموعدك في صالون البارون! باقي على دورك 20 دقيقة، يرجى التوجه للصالون الآن لتنفيذ خدمتك في الوقت المحدد.`)}`, '_blank'); 
  };

  return (
    <>
    <Screen>
      <div className="flex justify-between items-center mb-6 pt-4 animate-fade-in">
        <IconButtonLink icon={Home} label="الرئيسية" href="/" filled />
        <LogoMark compact />
        <IconButton icon={Settings} label="إعدادات الحساب" onPress={() => setEditing(!editing)} />
      </div>
      <div className="flex flex-col items-center mb-4 animate-slide-up" style={{animationDelay: '0.1s'}}>
        <div className="w-20 h-20 rounded-full border border-primary bg-primary/10 flex items-center justify-center mb-4">
          <span className="text-3xl font-bold text-primary">{name.slice(0, 1) || 'أ'}</span>
        </div>
        <h2 className="text-2xl font-bold text-foreground">{profile.name}</h2>
        <p className="text-sm mt-1.5 text-muted-foreground">{profile.phone}</p>
      </div>

      {editing && (
        <Card className="p-5 mt-4 space-y-4 animate-fade-in">
          <h3 className="text-right text-base font-bold mb-1">تعديل الملف الشخصي</h3>
          <input 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="الاسم" 
            className="w-full h-12 bg-white/5 border border-border rounded-xl px-4 text-right text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" 
          />
          <input 
            value={phone} 
            readOnly
            placeholder="رقم الهاتف" 
            type="tel"
            className="w-full h-12 bg-white/5 border border-border rounded-xl px-4 text-right text-sm text-muted-foreground outline-none" 
          />
          <input 
            value={note} 
            onChange={(e) => setNote(e.target.value)} 
            placeholder="ملاحظتك المفضلة لدى الحلاق" 
            className="w-full h-12 bg-white/5 border border-border rounded-xl px-4 text-right text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" 
          />
          <GoldButton title="حفظ التغييرات" onPress={save} />
        </Card>
      )}

      <div className="animate-slide-up" style={{animationDelay: '0.2s'}}>
        <SectionTitle title="دورك الحالي" />
        {activeTicket ? (
          <Card className="p-5">
            <div className="flex justify-between items-center">
              <StatusPill>{activeTicket.status === 'serving' ? 'جاري خدمتك' : 'بانتظارك'}</StatusPill>
              <span className="text-xs text-muted-foreground">تذكرة #{activeTicket.number}</span>
            </div>
            
            <div className="flex flex-row-reverse items-center gap-5 my-6">
              <div className="text-4xl font-bold text-primary">#{activeTicket.number}</div>
              <div className="text-right">
                <div className="text-sm font-bold text-foreground">{activeTicket.service}</div>
                <div className="text-xs mt-1.5 text-muted-foreground">مع {activeTicket.barber}</div>
              </div>
            </div>
            
            <div className="flex flex-row-reverse items-center gap-3">
              <div className="flex-1">
                <GoldButton title="ذكّرني الآن" onPress={sendReminder} secondary />
              </div>
              <button 
                 onClick={() => { if(window.confirm('هل أنت متأكد من إلغاء الدور؟')) { cancelTicket(undefined, 'account'); } }}
                className="flex flex-row-reverse items-center gap-1.5 p-2 rounded-lg hover:bg-destructive/10"
              >
                <X size={18} className="text-destructive" />
                <span className="text-xs font-bold text-destructive">إلغاء الدور</span>
              </button>
            </div>
            {lastReminderAt && (
              <div className="text-right text-[11px] mt-4 font-medium text-success">آخر تذكير: تم إرسال رسالة واتساب</div>
            )}
          </Card>
        ) : (
          <Card className="flex flex-row-reverse items-center justify-center gap-3 p-6">
            <Ticket size={28} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">لا يوجد دور نشط حالياً</span>
          </Card>
        )}
      </div>

      <div className="animate-slide-up" style={{animationDelay: '0.3s'}}>
        <SectionTitle title="ملاحظاتك المحفوظة" action="تعديل" onAction={() => setEditing(true)} />
        <Card className="flex flex-row-reverse items-start gap-4 p-4">
          <Bookmark size={22} className="text-primary mt-1 shrink-0" />
          <p className="flex-1 text-right text-sm leading-relaxed text-foreground">
            {profile.note || 'أضف ملاحظتك الخاصة ليحافظ الحلاق على تفاصيل قصتك.'}
          </p>
        </Card>
      </div>

      <div className="animate-slide-up" style={{animationDelay: '0.4s'}}>
        <SectionTitle title="سجل الزيارات" />
        <div className="space-y-3">
          {appointments.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground p-4">لا يوجد سجل زيارات</div>
          ) : (
            appointments.map((appointment) => (
              <Card key={appointment.id} className="flex flex-row-reverse items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <CalendarIcon size={18} className="text-primary" />
                </div>
                <div className="flex-1 text-right">
                  <div className="text-sm font-bold text-foreground">{appointment.service}</div>
                  <div className="text-[11px] mt-1 text-muted-foreground">{appointment.date} · {appointment.time} · {appointment.barber}</div>
                </div>
                <div className={cn("text-xs font-bold", appointment.status === 'completed' ? "text-success" : appointment.status === 'cancelled' ? "text-destructive" : "text-primary")}>
                  {appointment.status === 'completed' ? 'مكتمل' : appointment.status === 'cancelled' ? 'ملغى' : 'مؤكد'}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setLocation('/reviews')}
        className="mt-7 flex w-full flex-row-reverse items-center gap-3 rounded-2xl border border-primary/25 bg-primary/10 p-4 text-right transition-colors hover:bg-primary/15"
      >
        <MessageSquareHeart size={21} className="text-primary" />
        <span className="flex-1">
          <span className="block text-sm font-black text-foreground">قيّم تجربتك واقترح علينا</span>
          <span className="mt-1 block text-xs text-muted-foreground">ملاحظتك تساعدنا على تقديم خدمة أفضل</span>
        </span>
        <ChevronLeft size={18} className="text-primary" />
      </button>
      
      <button 
        onClick={() => setLocation('/admin')}
        className="w-full min-h-[56px] border border-border rounded-2xl px-5 flex flex-row-reverse items-center gap-3 mt-8 mb-6 hover:bg-secondary/50 transition-colors animate-slide-up"
        style={{animationDelay: '0.5s'}}
      >
        <ShieldCheck size={20} className="text-primary" />
        <span className="flex-1 text-right text-sm font-bold text-foreground">دخول لوحة الحلاق</span>
        <ChevronLeft size={18} className="text-muted-foreground" />
      </button>
      <button
        onClick={() => { void signOut(); }}
        className="mb-8 w-full rounded-2xl border border-destructive/30 px-5 py-4 text-sm font-bold text-destructive transition-colors hover:bg-destructive/10"
      >
        تسجيل الخروج
      </button>
      <div className="h-20 shrink-0" />
    </Screen>
    <BottomNavigation />
    </>
  );
}
