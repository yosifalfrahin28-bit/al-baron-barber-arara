import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { ArrowRightCircle, Crown } from 'lucide-react';
import { useSalon } from '@/context/SalonContext';

export default function TvDisplay() {
  const { tickets, advanceQueue } = useSalon();
  
  const active = tickets.find((ticket) => ticket.status === 'serving');
  const next = tickets.filter((ticket) => ticket.status === 'waiting').sort((a, b) => a.number - b.number).slice(0, 4);
  
  const [now, setNow] = useState(new Date());
  const [advanceError, setAdvanceError] = useState('');
  
  useEffect(() => { 
    const timer = setInterval(() => setNow(new Date()), 1000); 
    return () => clearInterval(timer); 
  }, []);
  
  const callNext = () => {
    setAdvanceError('');
    void advanceQueue().catch(() => setAdvanceError('تعذر تحديث الدور'));
  };
  
  return (
    <div className="min-h-[100dvh] bg-ink flex flex-col justify-between p-8 md:px-12 md:py-10 animate-fade-in overflow-hidden">
      {/* Header */}
      <div className="flex flex-row justify-between items-center animate-slide-up" style={{animationDelay: '0.1s'}}>
        <div className="flex flex-col items-start">
          <div className="text-4xl md:text-5xl font-light tracking-widest text-foreground">
            {now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-sm md:text-base mt-2 text-muted-foreground">
            صالون البارون · عرعرة النقب
          </div>
        </div>
        
        <div className="flex flex-row-reverse items-center gap-4">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-primary flex items-center justify-center bg-card">
            <Crown size={32} className="text-primary" />
          </div>
          <div className="flex flex-col items-end">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">البارون</h1>
            <span className="text-[11px] md:text-sm text-primary font-bold mt-1 tracking-wider uppercase">أترك الباقي علينا</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center flex-1 my-8 animate-slide-up" style={{animationDelay: '0.2s'}}>
        <div className="text-sm md:text-base font-bold tracking-[0.2em] text-primary mb-10 uppercase">
          نخدمك بكل عناية
        </div>
        
        <div className="text-xl md:text-2xl text-muted-foreground mb-4">الدور الحالي</div>
        
        <div className="text-[140px] md:text-[180px] leading-none font-bold text-primary mb-4 drop-shadow-[0_0_25px_rgba(212,175,55,0.4)]">
          {active ? `#${active.number}` : '—'}
        </div>
        
        <div className="text-4xl md:text-5xl font-semibold text-foreground mt-4 mb-16">
          {active?.name ?? 'بانتظار أول زبون'}
        </div>
        
        <div className="w-32 h-[1px] bg-primary/40 mb-12"></div>
        
        <div className="text-xl md:text-2xl font-semibold text-foreground mb-8">الأدوار القادمة</div>
        
        <div className="flex flex-row-reverse gap-6">
          {next.length > 0 ? (
            next.map((ticket, index) => (
              <div 
                key={ticket.id} 
                className={cn(
                  "w-[110px] h-[100px] md:w-[140px] md:h-[120px] rounded-3xl border-2 flex flex-col items-center justify-center transition-all",
                  index === 0 ? "bg-primary/20 border-primary" : "bg-card border-border"
                )}
              >
                <div className={cn(
                  "text-3xl md:text-4xl font-bold",
                  index === 0 ? "text-primary" : "text-foreground"
                )}>
                  {ticket.number}
                </div>
                <div className="text-xs md:text-sm mt-2 text-muted-foreground font-semibold max-w-full truncate px-3">
                  {ticket.name}
                </div>
              </div>
            ))
          ) : (
            <div className="text-muted-foreground text-lg py-4">لا يوجد منتظرين حالياً</div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-end animate-slide-up" style={{animationDelay: '0.3s'}}>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-gold-soft rounded-lg p-2 flex flex-wrap gap-[3px]">
            {/* Fake QR Code */}
            {Array.from({ length: 36 }).map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "w-2.5 h-2.5 rounded-sm",
                  [0, 2, 4, 7, 8, 11, 14, 15, 18, 20, 22, 25, 29, 31, 33, 35].includes(i) ? "bg-primary" : "bg-foreground"
                )} 
              />
            ))}
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground">احجز دورك الآن</span>
            <span className="text-sm mt-1 text-muted-foreground">امسح الرمز للبدء</span>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          <span className="text-base font-bold text-primary">جودة احترافية وثقة</span>
          <span className="text-sm mt-1 text-muted-foreground tracking-widest">0527752778</span>
        </div>
      </div>

      {/* Hidden dev button for testing advance queue on TV screen */}
      <button 
        onClick={callNext} 
        title="تحديث الشاشة (Dev Only)"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-20 hover:opacity-100 transition-opacity border border-border bg-card rounded-full px-4 py-2 flex items-center gap-2"
      >
        <ArrowRightCircle size={16} className="text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Simulate Next</span>
      </button>
      {advanceError && <div className="absolute bottom-20 left-1/2 -translate-x-1/2 rounded-xl border border-destructive/40 bg-destructive/15 px-4 py-2 text-xs font-bold text-destructive">{advanceError}</div>}
    </div>
  );
}
