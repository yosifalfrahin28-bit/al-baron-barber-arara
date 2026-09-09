import { User, Info, Flashlight, Calendar, Scissors, Sparkles, Crown, Wind, ChevronLeft, MapPin, Navigation, Phone, ShoppingBag, Instagram } from 'lucide-react';
import { useLocation } from 'wouter';
import { useSalon } from '@/context/SalonContext';
import { BottomNavigation, Card, IconButtonLink, LogoMark, Screen, SectionTitle, StatusPill } from '@/components/SalonUI';
import { trackEvent } from '@/lib/analytics';

const gallery = [
  { name: 'تدريج ملكي', hint: 'اضغط لاختيار المرجع' },
  { name: 'لحية منحوتة', hint: 'اضغط لاختيار المرجع' },
  { name: 'كلاسيك أنيق', hint: 'اضغط لاختيار المرجع' },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const { profile, activeTicket, waitingTickets, services, products, shopInfo, shopOpen, lastReminderAt, setSelectedStyle } = useSalon();
  
  const peopleAhead = activeTicket?.peopleAhead ?? (activeTicket ? waitingTickets.filter((ticket) => ticket.number < activeTicket.number).length : 0);
  const wait = Math.max(10, peopleAhead * 10);
  
  const openDirections = () => {
    trackEvent('directions_opened', { source: 'home' });
    window.open(shopInfo.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shopInfo.address || 'صالون البارون')}`, '_blank');
  };
  const openWhatsApp = () => {
    trackEvent('whatsapp_opened', { source: 'home' });
    const phone = (shopInfo.whatsapp || shopInfo.phone).replace(/\D/g, '');
    if (phone) window.open(`https://wa.me/${phone.replace(/^0/, '972')}?text=${encodeURIComponent(`مرحباً ${profile.name}، أريد الاستفسار من ${shopInfo.shopName}.`)}`, '_blank');
  };

  const openBooking = (mode: 'queue' | 'appointment', source: string) => {
    trackEvent('booking_cta_clicked', { mode, source });
    setLocation(`/booking?mode=${mode}`);
  };

  return (
    <>
    <Screen>
      <div className="flex justify-between items-center mb-6 pt-4 animate-fade-in">
        <IconButtonLink icon={User} label="الحساب الشخصي" href="/account" onPress={() => trackEvent('account_opened', { source: 'home' })} />
        <LogoMark />
      </div>
      
      <div className="flex flex-row-reverse items-center gap-3 p-3 rounded-2xl border border-primary/30 bg-primary/10 mb-8 animate-slide-up" style={{animationDelay: '0.1s'}}>
        <Info size={20} className="text-primary shrink-0" />
        <p className="flex-1 text-xs leading-relaxed text-right font-semibold text-gold-soft">
          لا تحجز دور عن طريق الهاتف — احجز مباشرة عبر المنصة لضمان أسبقية الدور.
        </p>
      </div>
      
      <div className="flex flex-col items-end mb-8 animate-slide-up" style={{animationDelay: '0.2s'}}>
        <div className="text-xs font-bold tracking-widest text-primary mb-2">صالون البارون للحلاقة</div>
        <h1 className="text-3xl leading-snug font-bold text-right text-foreground">
          أترك الباقي علينا،<br/>يا {profile.name}
        </h1>
        <p className="text-sm leading-relaxed text-right mt-3 text-muted-foreground">
          جودة احترافية وثقة — كل زيارة بتفاصيلك أنت.
        </p>
      </div>

      <div className="animate-slide-up" style={{animationDelay: '0.3s'}}>
      {activeTicket ? (
        <Card className="p-6 mb-5">
          <div className="flex justify-between items-center">
            <StatusPill>{activeTicket.status === 'serving' ? 'جاري خدمتك الآن' : 'دورك محفوظ'}</StatusPill>
            <span className="text-xs text-muted-foreground">تذكرة اليوم</span>
          </div>
          
          <div className="flex justify-between items-center my-6">
            <div className="text-right">
              <div className="text-5xl font-bold text-primary">#{activeTicket.number}</div>
              <div className="text-sm text-foreground mt-1">{activeTicket.service}</div>
            </div>
            
            <div className="w-24 h-24 rounded-full border-2 border-primary flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-foreground">
                {activeTicket.status === 'serving' ? 'الآن' : `${activeTicket.queuePosition ?? peopleAhead + 1}`}
              </div>
              {activeTicket.status !== 'serving' && (
                <div className="text-xs mt-1 text-muted-foreground">موقعك بالدور</div>
              )}
            </div>
          </div>
          
          <div className="h-1.5 rounded-full overflow-hidden bg-secondary w-full flex justify-end">
            <div 
              className="h-full rounded-full bg-primary" 
              style={{ width: `${Math.max(18, 100 - peopleAhead * 12)}%` }}
            />
          </div>
          
          <div className="flex flex-row-reverse justify-between items-center mt-4">
            <span className="text-xs text-right text-muted-foreground">
              {activeTicket.status === 'serving' ? 'توجه للحلاق الآن' : `الوقت المتوقع: ${wait} دقيقة`}
            </span>
            {lastReminderAt && (
              <span className="text-[11px] font-bold text-success">تم إرسال التذكير</span>
            )}
          </div>
        </Card>
      ) : (
        <Card className="flex flex-row-reverse items-center gap-4 mb-5 p-4 cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => openBooking('queue', 'empty_ticket')} data-testid="card-empty-ticket">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Scissors size={24} className="text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-right text-foreground">لا يوجد دور نشط</h3>
            <p className="text-xs text-right mt-1.5 text-muted-foreground">احجز دورك الآن بدون انتظار على الهاتف.</p>
          </div>
          <ChevronLeft size={20} className="text-muted-foreground shrink-0" />
        </Card>
      )}
      </div>

      <div className="flex gap-4 mb-6 animate-slide-up" style={{animationDelay: '0.4s'}}>
        <button 
          onClick={() => openBooking('queue', 'home_primary')}
          data-testid="btn-book-queue"
          className="flex-1 rounded-3xl p-5 min-h-[150px] flex flex-col justify-between bg-primary active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary-foreground/10 flex items-center justify-center ml-auto">
            <Flashlight size={24} className="text-primary-foreground" />
          </div>
          <div className="text-right mt-3">
            <div className="text-base font-bold text-primary-foreground">حجز دور حالي</div>
            <div className="text-xs mt-1 text-primary-foreground/70">ادخل الطابور الآن</div>
          </div>
        </button>
        
        <button 
          onClick={() => openBooking('appointment', 'home_secondary')}
          data-testid="btn-book-appointment"
          className="flex-1 rounded-3xl p-5 min-h-[150px] flex flex-col justify-between bg-secondary border border-border active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center ml-auto">
            <Calendar size={24} className="text-primary" />
          </div>
          <div className="text-right mt-3">
            <div className="text-base font-bold text-foreground">حجز موعد</div>
            <div className="text-xs mt-1 text-muted-foreground">اختر وقتك بدقة</div>
          </div>
        </button>
      </div>

      <div className="animate-slide-up" style={{animationDelay: '0.5s'}}>
        <SectionTitle title="خدماتنا" action="كل الخدمات" onAction={() => openBooking('queue', 'services')} />
        <div className="flex overflow-x-auto pb-4 gap-3 flex-row-reverse snap-x snap-mandatory hide-scrollbar -mx-5 px-5">
          {services.filter(s => s.visible).map((service) => (
            <Card key={service.id} className="w-[150px] p-5 shrink-0 snap-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 ml-auto">
                {service.id === 'beard' ? <Scissors size={24} className="text-primary" /> : 
                 service.id === 'steam' ? <Sparkles size={24} className="text-primary" /> : 
                 service.id === 'vip' ? <Crown size={24} className="text-primary" /> : 
                 <Wind size={24} className="text-primary" />}
              </div>
              <div className="text-sm font-bold text-right leading-tight text-foreground">{service.name}</div>
              <div className="text-[11px] text-right mt-2 text-muted-foreground">{service.duration} دقيقة</div>
              <div className="text-base font-bold text-right mt-4 text-primary">{service.price} ₪</div>
            </Card>
          ))}
        </div>
      </div>

      <div className="animate-slide-up" style={{animationDelay: '0.6s'}}>
        {products.length > 0 && (
          <>
            <SectionTitle title="منتجات المحل" action="متوفر الآن" />
            <div className="mb-6 flex overflow-x-auto gap-3 flex-row-reverse snap-x hide-scrollbar -mx-5 px-5">
              {products.map((product) => (
                <Card key={product.id} className="w-[170px] shrink-0 snap-center p-4">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                    <ShoppingBag size={21} className="text-primary" />
                  </div>
                  <div className="text-right text-sm font-bold text-foreground">{product.name}</div>
                  {product.description && <div className="mt-1 line-clamp-2 text-right text-[11px] leading-5 text-muted-foreground">{product.description}</div>}
                  <div className="mt-3 flex flex-row-reverse items-center justify-between">
                    <span className="text-sm font-black text-primary">{product.price} ₪</span>
                    <span className="text-[10px] text-success">متوفر</span>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
        <SectionTitle title="إلهام لقصتك القادمة" action="المعرض الكامل" />
        <div className="flex overflow-x-auto pb-4 gap-4 flex-row-reverse snap-x snap-mandatory hide-scrollbar -mx-5 px-5">
          {gallery.map((item, i) => (
            <button 
              key={item.name} 
               onClick={() => {
                 trackEvent('style_reference_selected', { source: 'home', style_slot: i });
                 setSelectedStyle(item.name);
                 setLocation('/booking');
               }}
              data-testid={`btn-gallery-${i}`}
              className="w-[190px] h-[240px] rounded-3xl overflow-hidden relative shrink-0 snap-center active:scale-95 transition-transform"
            >
              <div className="absolute inset-0 bg-secondary" />
              <div className="absolute inset-x-0 bottom-0 p-4 pt-12 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end text-right">
                <div className="text-white text-sm font-bold">{item.name}</div>
                <div className="text-primary text-[10px] mt-1">{item.hint}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="animate-slide-up" style={{animationDelay: '0.7s'}}>
        <Card className="flex flex-row-reverse items-center gap-4 mt-6 p-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <MapPin size={24} className="text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-right text-foreground">نحن بانتظارك</h3>
            <p className="text-[11px] leading-relaxed text-right mt-1 text-muted-foreground">{shopInfo.address || 'العنوان سيظهر هنا بعد تحديث معلومات المحل'}</p>
          </div>
          <button 
            onClick={openDirections} 
            className="w-10 h-10 rounded-full flex items-center justify-center bg-primary text-primary-foreground transition-opacity active:opacity-70"
          >
            <Navigation size={20} />
          </button>
        </Card>

        <div className="flex flex-row-reverse justify-between items-center pt-6 pb-2">
          <StatusPill positive={shopOpen}>{shopOpen ? 'مفتوح الآن' : 'مغلق حالياً'}</StatusPill>
          <button onClick={openWhatsApp} className="flex flex-row-reverse items-center gap-2 hover:opacity-80 transition-opacity">
            <Phone size={16} className="text-success" />
            <span className="text-xs text-muted-foreground">{shopInfo.phone || shopInfo.whatsapp || 'تواصل معنا'}</span>
          </button>
        </div>
        {shopInfo.instagramUrl && (
          <a href={shopInfo.instagramUrl} target="_blank" rel="noreferrer" className="mt-3 flex flex-row-reverse items-center justify-center gap-2 text-xs font-bold text-primary">
            <Instagram size={15} /> Instagram
          </a>
        )}
      </div>
      <div className="h-20 shrink-0" />
    </Screen>
    <BottomNavigation />
    </>
  );
}
