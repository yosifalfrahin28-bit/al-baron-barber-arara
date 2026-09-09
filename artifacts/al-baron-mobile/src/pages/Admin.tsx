>
    );
  }
  
  if (!user || role !== 'admin') {
    return (
      <Screen scroll={false} className="items-center justify-center p-7 gap-4">
        <ShieldX size={48} className="text-destructive" />
        <h2 className="text-2xl font-black text-center text-foreground">لا تملك صلاحية الدخول</h2>
        <p className="text-sm text-center text-muted-foreground mb-4">حسابك عميل. تواصل مع الإدارة إذا كنت من فريق الصالون.</p>
        <GoldButton title="العودة" onPress={() => setLocation('/account')} />
      </Screen>
    );
  }

  return (
    <>
    <Screen>
      <div className="flex flex-row-reverse justify-between items-center mb-6 pt-4 animate-fade-in">
        <IconButtonLink icon={ChevronLeft} label="رجوع" href="/account" />
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold tracking-[0.15em] text-primary">BARON CONTROL</span>
          <span className="text-xl font-bold text-foreground mt-1">لوحة الحلاق</span>
        </div>
         <div className="flex flex-row-reverse gap-2">
           <IconButtonLink icon={QrCode} label="ربط WhatsApp" href="/admin/qr" />
           <IconButtonLink icon={Tv} label="شاشة الانتظار" href="/tv-display" />
         </div>
      </div>

      <div className="flex flex-row-reverse justify-between items-center p-4 border border-border rounded-[20px] bg-card animate-slide-up" style={{animationDelay: '0.1s'}}>
        <div className="text-right">
          <div className="text-[11px] text-muted-foreground">حالة الصالون</div>
          <div className="flex flex-row-reverse items-center gap-2 mt-1.5">
            <div className={cn("w-2 h-2 rounded-full", shopOpen ? "bg-success" : "bg-destructive")} />
            <div className="text-sm font-bold text-foreground">{shopOpen ? 'مفتوح ويستقبل الحجوزات' : 'مغلق — الحجوزات متوقفة'}</div>
          </div>
        </div>
        
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" checked={shopOpen} onChange={() => { void handleToggleShop(); }} disabled={shopPending} />
          <div className={cn(
            "w-12 h-6 rounded-full peer transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all",
            shopOpen ? "bg-primary/80 after:translate-x-6 after:border-white" : "bg-secondary peer-focus:ring-primary/30"
          )}></div>
        </label>
      </div>
      {shopError && <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-right text-xs text-destructive">{shopError}</div>}
      {actionError && <div role="alert" className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-right text-xs text-destructive">{actionError}</div>}

      <div className="flex flex-row-reverse gap-2.5 mt-3 animate-slide-up" style={{animationDelay: '0.2s'}}>
        {[
          { label: 'المنتظرون', value: waiting.length, icon: Clock },
          { label: 'المواعيد المؤكدة', value: displayedAppointments.filter((appointment) => appointment.status === 'confirmed').length, icon: CalendarIcon },
          { label: 'تمت خدمتهم', value: 24, icon: CheckCircle }
        ].map((metric) => (
          <Card key={metric.label} className="flex-1 p-3 flex flex-col items-end">
            <metric.icon size={20} className="text-primary" />
            <div className="text-[26px] font-bold mt-2 text-foreground leading-none">{metric.value}</div>
            <div className="text-[11px] text-right mt-1 text-muted-foreground">{metric.label}</div>
          </Card>
        ))}
      </div>

      <div className="flex flex-row-reverse gap-1 overflow-x-auto p-1 rounded-[16px] bg-secondary mt-5 mb-2 animate-slide-up" style={{animationDelay: '0.3s'}}>
        {[
          ['queue', 'الدور الحالي'], 
          ['appointments', 'المواعيد'],
          ['schedule', 'الجدول'],
          ['services', 'الخدمات والأسعار'], 
          ['ages', 'الفئات العمرية'],
          ['products', 'المنتجات'],
          ['shop', 'معلومات المحل'],
          ['clients', 'الزبائن'],
           ['broadcast', 'رسالة جماعية'],
           ['templates', 'قوالب الرسائل'],
           ['reviews', 'التقييمات']
        ].map(([key, label]) => (
          <button
            type="button"
            key={key} 
            onClick={() => setTab(key as typeof tab)} 
            className={cn(
              "min-w-[92px] flex-1 min-h-[40px] rounded-xl flex items-center justify-center transition-colors",
              tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="text-xs font-bold">{label}</span>
          </button>
        ))}
      </div>

      {tab === 'queue' && (
        <div className="animate-fade-in">
          <Card className="mt-4 p-5">
            <div className="flex justify-between items-center">
              <StatusPill>جاري الخدمة</StatusPill>
              <span className="text-xs text-muted-foreground">الدور الحالي</span>
            </div>
            
            <div className="flex flex-row-reverse items-center gap-5 my-5">
              <div className="text-[52px] font-bold text-primary leading-none">{active ? `#${active.number}` : '—'}</div>
              <div className="text-right">
                <div className="text-xl font-bold text-foreground">{active?.name ?? 'لا يوجد زبون'}</div>
                <div className="text-xs mt-1.5 text-muted-foreground">{active?.service ?? 'ابدأ الدور التالي'}</div>
              </div>
            </div>
            
            <div className="flex flex-row-reverse gap-3">
              <div className="flex-1">
                 <GoldButton title={queuePending ? "جارٍ تحديث الدور..." : "الدور التالي"} icon={ArrowRight} onPress={() => { void handleAdvanceQueue(); }} disabled={queuePending} />
              </div>
              <button 
                 onClick={() => active && cancelTicket(active.id, 'admin')} 
                className="h-14 px-5 rounded-2xl border border-border flex flex-row-reverse items-center justify-center gap-2 active:bg-secondary/50"
              >
                <X size={18} className="text-destructive" />
                <span className="text-sm font-bold text-destructive">إلغاء</span>
              </button>
            </div>
            {queueError && <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-right text-xs text-destructive">{queueError}</div>}
          </Card>
          
          <button 
            onClick={() => setWalkInModal(true)} 
            className="w-full h-14 border border-primary rounded-2xl mt-3 flex flex-row-reverse items-center justify-center gap-2 active:bg-primary/10 transition-colors"
          >
            <PlusCircle size={20} className="text-primary" />
            <span className="text-sm font-bold text-primary">إضافة زبون مباشر</span>
          </button>
          
          <SectionTitle title="الطابور القادم" />
          
          <div className="space-y-2.5">
            {waiting.map((ticket, index) => (
              <Card key={ticket.id} className="flex flex-row-reverse items-center gap-3 p-3.5">
                <div className={cn(
                  "w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0",
                  index === 0 ? "bg-primary/15 text-primary" : "bg-secondary text-foreground"
                )}>
                  <span className="text-base font-bold">#{ticket.number}</span>
                </div>
                <div className="flex-1 text-right">
                  <div className="text-sm font-bold text-foreground">{ticket.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{ticket.service} · {ticket.barber}</div>
                </div>
                <button 
                  onClick={() => summonClient(ticket.phone, ticket.name, ticket.id)} 
                  className="py-2.5 px-3 rounded-xl bg-primary/15 flex flex-row-reverse items-center gap-1.5 active:opacity-70"
                >
                  <ScanLine size={16} className="text-primary" />
                  <span className="text-[11px] font-bold text-primary">{ticket.reminderSent ? 'أُرسل' : 'استدعاء'}</span>
                </button>
              </Card>
            ))}
            {waiting.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">لا يوجد زبائن في الطابور</div>
            )}
          </div>
        </div>
      )}

      {tab === 'appointments' && (
        <div className="animate-fade-in" dir="rtl">
          <SectionTitle title="إدارة المواعيد" action={`${displayedAppointments.length} موعد`} />
          <div className="space-y-3">
            {appointmentsLoading ? (
              <Card className="p-6 text-center text-sm text-muted-foreground">جارٍ تحميل كل المواعيد...</Card>
            ) : displayedAppointments.length === 0 ? (
              <Card className="p-6 text-center text-sm text-muted-foreground">لا توجد مواعيد مسجلة.</Card>
            ) : null}
            {displayedAppointments.map((appointment) => (
              <Card key={appointment.id} className="p-4">
                <div className="flex flex-row-reverse items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15">
                    <CalendarIcon size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 text-right">
                    <div className="text-sm font-black text-foreground">{appointment.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{appointment.date} · {appointment.time}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">{appointment.service} · {appointment.barber} · {appointment.phone}</div>
                  </div>
                  <StatusPill positive={appointment.status === 'confirmed'}>
                    {appointment.status === 'cancelled' ? 'ملغى' : appointment.status === 'completed' ? 'مكتمل' : 'مؤكد'}
                  </StatusPill>
                </div>
                {appointment.status === 'confirmed' && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => sendAppointmentReminder(appointment, 'hour')}
                      className="flex min-h-11 flex-row-reverse items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-2 text-[11px] font-bold text-primary transition-colors hover:bg-primary/20"
                    >
                      <MessageCircle size={15} />
                      تذكير قبل ساعة
                    </button>
                    <button
                      onClick={() => sendAppointmentReminder(appointment, 'twenty')}
                      className="flex min-h-11 flex-row-reverse items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-2 text-[11px] font-bold text-primary transition-colors hover:bg-primary/20"
                    >
                      <MessageCircle size={15} />
                      تذكير 20 دقيقة
                    </button>
                    <button
                      onClick={() => { setCancelAppointmentId(appointment.id); setCancellationReason(''); }}
                      className="col-span-2 flex min-h-11 flex-row-reverse items-center justify-center gap-2 rounded-xl border border-destructive/30 text-sm font-bold text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <X size={17} />
                      إلغاء الموعد
                    </button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === 'schedule' && (
        <div className="animate-fade-in" dir="rtl">
          <div className="mt-5 mb-4 flex flex-row items-center justify-between">
            <button type="button" onClick={() => showSchedule()} className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-transform active:scale-95">
              <PlusCircle size={16} /> إضافة فترة
            </button>
            <div className="text-right">
              <h3 className="text-lg font-bold text-foreground">جدول العمل الأسبوعي</h3>
              <p className="mt-1 text-xs text-muted-foreground">فعّل أو عطّل الفترات المتاحة للحجز.</p>
            </div>
          </div>
          <div className="space-y-3">
            {dayNames.map((dayName, dayOfWeek) => {
              const daySlots = schedule.filter((slot) => slot.dayOfWeek === dayOfWeek).sort((a, b) => a.time.localeCompare(b.time));
              return (
                <Card key={dayName} className="p-4">
                  <div className="mb-3 flex flex-row-reverse items-center justify-between">
                    <h4 className="text-sm font-black text-foreground">{dayName}</h4>
                    <span className="text-[11px] text-muted-foreground">{daySlots.filter((slot) => slot.active).length} فترات فعالة</span>
                  </div>
                  <div className="flex flex-row-reverse flex-wrap gap-2">
                    {daySlots.map((slot) => (
                      <div key={slot.id} className={cn("flex items-center gap-1 rounded-xl border px-2 py-1.5", slot.active ? "border-primary/40 bg-primary/10" : "border-border bg-secondary/50 opacity-60")}>
                        <button type="button" onClick={() => { void handleScheduleToggle(slot); }} disabled={actionPending} aria-label={slot.active ? `تعطيل ${slot.time}` : `تفعيل ${slot.time}`} className="text-primary disabled:opacity-50">
                          <Power size={14} />
                        </button>
                        <button type="button" onClick={() => showSchedule(slot)} className="text-muted-foreground">
                          <Pencil size={13} />
                        </button>
                        <span className="text-xs font-bold text-foreground" dir="ltr">{slot.time}</span>
                      </div>
                    ))}
                    {daySlots.length === 0 && <span className="text-xs text-muted-foreground">لا توجد فترات.</span>}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'services' && (
        <div className="animate-fade-in">
          <div className="flex flex-row items-center justify-between mt-5 mb-4">
            <button type="button" onClick={() => showService()} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-full text-xs font-bold active:scale-95 transition-transform">
              <PlusCircle size={16} /> إضافة خدمة
            </button>
            <h3 className="text-lg font-bold text-right text-foreground">قائمة الخدمات</h3>
          </div>
          
          <div className="space-y-2.5">
            {services.map((service) => (
              <Card key={service.id} className="flex flex-row-reverse items-center gap-3 p-4">
                <div className="flex gap-4 shrink-0">
                  <button type="button" onClick={() => showService(service)} className="text-primary hover:opacity-70"><FileEdit size={20} /></button>
                  <button type="button" onClick={() => { void handleDeleteService(service.id); }} disabled={actionPending} aria-label={`حذف ${service.name}`} className="text-muted-foreground hover:text-destructive disabled:opacity-50"><Trash2 size={20} /></button>
                </div>
                <div className="flex-1 text-right ml-2">
                  <div className="text-sm font-bold text-foreground">{service.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{service.description}</div>
                  <div className="text-xs font-bold text-primary mt-2">
                    {service.price} ₪ · {service.duration} دقيقة {!service.visible && '· مخفية'}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary"><ScanLine size={20} /></span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === 'ages' && (
        <div className="animate-fade-in" dir="rtl">
          <div className="mt-5 mb-4 flex flex-row items-center justify-between">
            <button type="button" onClick={() => showAge()} className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">
              <PlusCircle size={16} /> إضافة فئة
            </button>
            <div className="text-right">
              <h3 className="text-lg font-bold text-foreground">الفئات العمرية</h3>
              <p className="mt-1 text-xs text-muted-foreground">تظهر الفئة المختارة مع كل حجز.</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {ageCategories.map((category) => (
              <Card key={category.id} className="flex flex-row-reverse items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <UsersRound size={18} className="text-primary" />
                </div>
                <div className="flex-1 text-right">
                  <div className="text-sm font-bold text-foreground">{category.name}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {category.maxAge === null ? `${category.minAge}+ سنة` : `${category.minAge}–${category.maxAge} سنة`}
                    {!category.active && ' · مخفية'}
                  </div>
                </div>
                <button type="button" onClick={() => showAge(category)} className="text-primary"><Pencil size={17} /></button>
                <button type="button" onClick={() => { void handleDeleteAge(category.id); }} className="text-muted-foreground hover:text-destructive"><Trash2 size={17} /></button>
              </Card>
            ))}
            {ageCategories.length === 0 && <Card className="p-6 text-center text-sm text-muted-foreground">لا توجد فئات عمرية.</Card>}
          </div>
        </div>
      )}

      {tab === 'products' && (
        <div className="animate-fade-in" dir="rtl">
          <div className="mt-5 mb-4 flex flex-row items-center justify-between">
            <button type="button" onClick={() => showProduct()} className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">
              <PlusCircle size={16} /> إضافة منتج
            </button>
            <div className="text-right">
              <h3 className="text-lg font-bold text-foreground">منتجات المحل</h3>
              <p className="mt-1 text-xs text-muted-foreground">إدارة الأسعار والمخزون والظهور للزبون.</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {products.map((product) => (
              <Card key={product.id} className="flex flex-row-reverse items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Package size={18} className="text-primary" />
                </div>
                <div className="flex-1 text-right">
                  <div className="text-sm font-bold text-foreground">{product.name}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{product.description || 'بدون وصف'}</div>
                  <div className="mt-1 text-xs font-bold text-primary">{product.price} ₪ · المخزون: {product.stock}{!product.active && ' · مخفي'}</div>
                </div>
                <button type="button" onClick={() => showProduct(product)} className="text-primary"><Pencil size={17} /></button>
                <button type="button" onClick={() => { void handleDeleteProduct(product.id); }} className="text-muted-foreground hover:text-destructive"><Trash2 size={17} /></button>
              </Card>
            ))}
            {products.length === 0 && <Card className="p-6 text-center text-sm text-muted-foreground">لا توجد منتجات مضافة.</Card>}
          </div>
        </div>
      )}

      {tab === 'shop' && (
        <div className="animate-fade-in" dir="rtl">
          <Card className="mt-5 p-5">
            <div className="mb-5 flex flex-row-reverse items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10"><Store size={21} className="text-primary" /></div>
              <div className="text-right">
                <h3 className="text-lg font-bold text-foreground">معلومات المحل</h3>
                <p className="mt-1 text-xs text-muted-foreground">هذه البيانات تظهر للزبائن في الصفحة الرئيسية.</p>
              </div>
            </div>
            <div className="space-y-3">
              {([
                ['shopName', 'اسم المحل'],
                ['phone', 'رقم الهاتف'],
                ['whatsapp', 'رقم WhatsApp'],
                ['address', 'العنوان'],
                ['mapsUrl', 'رابط الخرائط'],
                ['instagramUrl', 'رابط Instagram'],
                ['openingHours', 'ساعات العمل'],
              ] as const).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-right text-xs font-bold text-muted-foreground">
                    {label}
                    <input
                      value={shopDraft[key]}
                      onChange={(event) => setShopDraft({ ...shopDraft, [key]: event.target.value })}
                      className="mt-2 h-12 w-full rounded-xl border border-border bg-black/20 px-4 text-right text-sm font-normal text-foreground outline-none focus:border-primary"
                    />
                  </label>
                  {key === 'mapsUrl' && (
                    <button
                      type="button"
                      onClick={useCurrentShopLocation}
                      disabled={locationPending}
                      className="mt-2 flex min-h-11 w-full flex-row-reverse items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 text-xs font-black text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
                    >
                      <MapPin size={16} />
                      {locationPending ? 'جارٍ تحديد موقعك...' : 'استخدام موقعي الحالي كموقع المحل'}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => { void saveShop(); }} disabled={actionPending} className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-black text-primary-foreground disabled:opacity-50">
              <CheckCircle size={18} /> {actionPending ? 'جارٍ الحفظ...' : 'حفظ معلومات المحل'}
            </button>
          </Card>
        </div>
      )}

      {tab === 'clients' && (
        <div className="animate-fade-in" dir="rtl">
          <SectionTitle title="إدارة الزبائن" action={`${customers.length} حساب`} />
          <div className="relative mt-4">
            <Search size={17} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={customerSearch}
              onChange={(event) => setCustomerSearch(event.target.value)}
              placeholder="ابحث بالاسم أو رقم الهاتف"
              className="h-12 w-full rounded-2xl border border-border bg-card pr-11 pl-4 text-right text-sm text-foreground outline-none focus:border-primary"
            />
          </div>
          {customerError && <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-right text-xs text-destructive">{customerError}</div>}
          {customersQuery.isLoading && <Card className="mt-4 p-6 text-center text-sm text-muted-foreground">جارٍ تحميل الحسابات...</Card>}
          {!customersQuery.isLoading && filteredCustomers.length === 0 && (
            <Card className="mt-4 p-6 text-center text-sm text-muted-foreground">لا توجد حسابات مطابقة.</Card>
          )}
          <div className="mt-4 space-y-3">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id} className={cn("p-4", customer.banned && "border border-destructive/30")}>
                <div className="flex flex-row-reverse items-start gap-3">
                  <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg font-black", customer.banned ? "bg-destructive/10 text-destructive" : "bg-primary/15 text-primary")}>
                    {customer.name.slice(0, 1) || '؟'}
                  </div>
                  <div className="min-w-0 flex-1 text-right">
                    <div className="flex flex-row-reverse items-center gap-2">
                      <span className="truncate text-sm font-black text-foreground">{customer.name}</span>
                      {customer.banned && <StatusPill>محظور</StatusPill>}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground" dir="ltr">{customer.phone}</div>
                    {customer.note && <div className="mt-2 text-[11px] leading-5 text-muted-foreground">{customer.note}</div>}
                    {customer.banned && customer.banReason && <div className="mt-2 text-[11px] text-destructive">السبب: {customer.banReason}</div>}
                  </div>
                </div>
                <div className="mt-4 flex flex-row-reverse gap-2">
                  <button
                    onClick={() => toggleCustomerBan(customer)}
                    disabled={customerActionPending}
                    className={cn("flex h-10 flex-1 flex-row-reverse items-center justify-center gap-2 rounded-xl text-xs font-black transition-colors disabled:opacity-50", customer.banned ? "border border-primary/30 text-primary hover:bg-primary/10" : "border border-destructive/30 text-destructive hover:bg-destructive/10")}
                  >
                    <Ban size={15} />
                    {customer.banned ? 'رفع الحظر' : 'حظر الحساب'}
                  </button>
                  <button
                    onClick={() => removeCustomer(customer)}
                    disabled={customerActionPending}
                    className="flex h-10 flex-1 flex-row-reverse items-center justify-center gap-2 rounded-xl border border-border text-xs font-black text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                    حذف الحساب
                  </button>
                </div>
                 <div className="mt-3 rounded-2xl border border-border bg-secondary/30 p-3">
                   <label className="flex flex-row-reverse items-center justify-between gap-3 text-xs font-bold text-foreground">
                     <span>تقييد الحجز لهذا الحساب</span>
                     <input
                       type="checkbox"
                       checked={customer.bookingRestricted ?? false}
                       disabled={customerActionPending}
                       onChange={(event) => saveCustomerRestrictions(customer, event.target.checked)}
                       className="h-5 w-5 accent-primary"
                     />
                   </label>
                   <div className="mt-3 flex flex-row-reverse gap-2">
                     <input
                       value={noticeDrafts[customer.id] ?? customer.accountNotice ?? ''}
                       onChange={(event) => setNoticeDrafts((current) => ({ ...current, [customer.id]: event.target.value }))}
                       maxLength={500}
                       placeholder="تنبيه أو ملاحظة تظهر للزبون"
                       className="min-w-0 flex-1 rounded-xl border border-border bg-card px-3 py-2 text-right text-xs text-foreground outline-none focus:border-primary"
                     />
                     <button
                       type="button"
                       onClick={() => saveCustomerRestrictions(customer)}
                       disabled={customerActionPending}
                       className="rounded-xl border border-primary/30 px-3 text-[11px] font-black text-primary disabled:opacity-50"
                     >
                       حفظ
                     </button>
                   </div>
                   <button
                     type="button"
                     onClick={() => openPasswordReset(customer)}
                     className="mt-3 flex w-full flex-row-reverse items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                   >
                     <KeyRound size={14} />
                     تعديل كلمة المرور
                   </button>
                 </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === 'broadcast' && (
        <div className="animate-fade-in" dir="rtl">
          <Card className="mt-4 p-5">
            <div className="flex flex-row-reverse items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#25D366]/15">
                <MessageCircle size={22} className="text-[#25D366]" />
              </div>
              <div className="text-right">
                <h3 className="text-lg font-black text-foreground">إرسال رسالة جماعية (WhatsApp)</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">اكتب عرضاً أو إعلاناً لإرساله إلى جميع الزبائن المسجلين.</p>
              </div>
            </div>

            <textarea
              value={broadcastMessage}
              onChange={(event) => setBroadcastMessage(event.target.value)}
              maxLength={2000}
              rows={6}
              placeholder="مثال: عرض خاص هذا الأسبوع أو تحديث ساعات العمل..."
              className="mt-5 w-full resize-none rounded-2xl border border-border bg-black/20 p-4 text-right text-sm leading-7 text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
            />
             <div className="mt-2 flex flex-row-reverse justify-between text-[11px] text-muted-foreground">
               <span>سيتم إرسال الرسالة مباشرة من جلسة WhatsApp المتصلة</span>
              <span>{broadcastMessage.length}/2000</span>
            </div>

            {broadcastError && (
              <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-right text-xs text-destructive">{broadcastError}</div>
            )}
            {broadcastState === 'success' && (
              <div className="mt-4 rounded-xl border border-[#25D366]/30 bg-[#25D366]/10 p-4 text-right text-sm text-[#9af0b7]">
                 تم إرسال الرسالة إلى {broadcastSentCount} من أصل {broadcastRecipientCount} زبوناً عبر WhatsApp.
                 {broadcastFailedCount > 0 && ` تعذر إرسالها إلى ${broadcastFailedCount} زبوناً.`}
              </div>
            )}

            <button
              onClick={prepareBroadcast}
              disabled={broadcastState === 'counting' || broadcastState === 'sending'}
              className="mt-5 flex h-14 w-full flex-row-reverse items-center justify-center gap-2 rounded-2xl bg-[#25D366] font-black text-black transition-opacity disabled:opacity-60"
            >
              <Send size={19} />
              {broadcastState === 'counting' ? 'جارٍ حساب الزبائن...' : broadcastState === 'sending' ? 'جارٍ تجهيز الروابط...' : 'إرسال إلى جميع الزبائن'}
            </button>

             <div className="mt-5 border-t border-border pt-5">
               <div className="flex flex-row-reverse items-center justify-between gap-3">
                 <div className="text-right">
                   <h4 className="text-sm font-black text-foreground">إرسال WhatsApp بديل</h4>
                   <p className="mt-1 text-[11px] leading-5 text-muted-foreground">يرسل الرسالة مباشرة إلى جميع الزبائن المتاحين في قاعدة البيانات.</p>
                 </div>
                  <span className="rounded-full border border-border px-2 py-1 text-[10px] font-bold text-[#25D366]">WhatsApp</span>
               </div>
               <input
                 value={smsBroadcastMessage}
                 onChange={(event) => { setSmsBroadcastMessage(event.target.value); setSmsBroadcastState('idle'); }}
                 maxLength={1600}
                  placeholder="نص رسالة WhatsApp"
                 className="mt-3 h-12 w-full rounded-xl border border-border bg-black/20 px-4 text-right text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
               />
                {smsBroadcastState === 'success' && <p className="mt-2 text-right text-xs font-bold text-success">تم إرسال رسائل WhatsApp بنجاح.</p>}
                {smsBroadcastState === 'unavailable' && <p className="mt-2 text-right text-xs font-bold text-muted-foreground">جلسة WhatsApp غير متصلة حالياً، ولم يتم إرسال أي رسالة.</p>}
               {smsBroadcastState === 'error' && <p className="mt-2 text-right text-xs font-bold text-destructive">اكتب رسالة صالحة وحاول مرة أخرى.</p>}
               <button
                 type="button"
                 onClick={() => { void sendSmsBroadcast(); }}
                 disabled={smsBroadcastState === 'sending'}
                 className="mt-3 flex h-12 w-full flex-row-reverse items-center justify-center gap-2 rounded-xl border border-primary/30 text-sm font-black text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
               >
                 <Send size={16} />
                  {smsBroadcastState === 'sending' ? 'جارٍ إرسال WhatsApp...' : 'إرسال WhatsApp'}
               </button>
             </div>
          </Card>

          {broadcastLinks.length > 0 && (
            <div className="mt-5">
              <SectionTitle title="روابط الإرسال الأخيرة" />
              <div className="space-y-2.5">
                {broadcastLinks.map((link) => (
                  <Card key={link.phone} className="flex flex-row-reverse items-center gap-3 p-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/15">
                      <MessageCircle size={18} className="text-[#25D366]" />
                    </div>
                    <div className="flex-1 text-right">
                      <div className="text-sm font-bold text-foreground">{link.name}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground">{link.phone}</div>
                    </div>
                    <button onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')} className="flex items-center gap-1 rounded-xl bg-[#25D366]/15 px-3 py-2 text-[11px] font-bold text-[#9af0b7]">
                      <ExternalLink size={14} />
                      فتح
                    </button>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'templates' && (
        <div className="animate-fade-in" dir="rtl">
          <Card className="mt-4 p-5">
            <div className="flex flex-row-reverse items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15">
                <FileEdit size={22} className="text-primary" />
              </div>
              <div className="text-right">
                <h3 className="text-lg font-black text-foreground">قوالب WhatsApp</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">عدّل النصوص التي تُرسل تلقائياً للعملاء. اترك المتغيرات بين الأقواس كما هي.</p>
              </div>
            </div>
            {templatesLoading ? (
              <p className="mt-6 text-center text-sm text-muted-foreground">جارٍ تحميل القوالب...</p>
            ) : (
              <div className="mt-5 space-y-5">
                {messageTemplates.map((template) => (
                  <div key={template.key} className="rounded-2xl border border-border bg-black/15 p-4">
                    <label className="block text-right text-sm font-black text-foreground">
                      {template.label}
                      <span className="mt-1 block text-[10px] font-normal text-muted-foreground" dir="ltr">
                        {template.key === 'otp' ? '{{code}}' : '{{name}} · {{date}} · {{time}} · {{service}} · {{barber}}'}
                      </span>
                      <textarea
                        value={template.body}
                        onChange={(event) => setMessageTemplates((current) => current.map((item) => item.key === template.key ? { ...item, body: event.target.value } : item))}
                        maxLength={2000}
                        rows={5}
                        className="mt-3 w-full resize-y rounded-xl border border-border bg-black/25 p-3 text-right text-sm leading-7 text-foreground outline-none focus:border-primary"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => { void saveMessageTemplate(template); }}
                      disabled={templateSaving === template.key}
                      className="mt-3 flex h-11 w-full flex-row-reverse items-center justify-center gap-2 rounded-xl border border-primary/30 text-xs font-black text-primary hover:bg-primary/10 disabled:opacity-50"
                    >
                      <CheckCircle size={15} />
                      {templateSaving === template.key ? 'جارٍ الحفظ...' : 'حفظ هذا القالب'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === 'reviews' && (
        <div className="animate-fade-in" dir="rtl">
          <Card className="mt-4 p-5">
            <div className="flex flex-row-reverse items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15">
                <MessageSquareHeart size={22} className="text-primary" />
              </div>
              <div className="text-right">
                <h3 className="text-lg font-black text-foreground">تقييمات واقتراحات العملاء</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">راجع الملاحظات والاقتراحات لتحسين تجربة الصالون.</p>
              </div>
            </div>
            {reviewsLoading ? (
              <p className="mt-6 text-center text-sm text-muted-foreground">جارٍ تحميل التقييمات...</p>
            ) : reviews.length === 0 ? (
              <p className="mt-6 rounded-2xl border border-border p-5 text-center text-sm text-muted-foreground">لا توجد تقييمات جديدة حتى الآن.</p>
            ) : (
              <div className="mt-5 space-y-3">
                {reviews.map((review) => (
                  <div key={review.id} className="rounded-2xl border border-border bg-black/15 p-4">
                    <div className="flex flex-row-reverse items-start justify-between gap-3">
                      <div className="text-right">
                        <div className="text-sm font-black text-foreground">{review.name}</div>
                        <div className="mt-1 text-[11px] text-muted-foreground" dir="ltr">{review.phone}</div>
                      </div>
                      <div className="flex flex-row-reverse gap-0.5" aria-label={`${review.rating} نجوم`}>
                        {[1, 2, 3, 4, 5].map((value) => <Star key={value} size={15} className={value <= review.rating ? 'fill-primary text-primary' : 'text-muted-foreground'} />)}
                      </div>
                    </div>
                    {review.feedback && <p className="mt-4 text-right text-sm leading-7 text-foreground">{review.feedback}</p>}
                    {review.suggestion && <p className="mt-3 rounded-xl bg-primary/10 p-3 text-right text-xs leading-6 text-primary"><strong>اقتراح:</strong> {review.suggestion}</p>}
                    <div className="mt-4 flex flex-row-reverse items-center justify-between gap-2">
                      <span className="text-[10px] text-muted-foreground">{new Date(review.createdAt).toLocaleDateString('ar-IL')}</span>
                      <select
                        value={review.status}
                        onChange={(event) => { void updateReviewStatus(review, event.target.value); }}
                        className="rounded-lg border border-border bg-card px-2 py-1 text-[11px] font-bold text-foreground outline-none"
                      >
                        <option value="new">جديد</option>
                        <option value="reviewed">تمت المراجعة</option>
                        <option value="archived">مؤرشف</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {cancelAppointmentId && appointmentToCancel && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-4 animate-fade-in" dir="rtl">
          <div className="w-full max-w-md rounded-t-3xl border border-border bg-card p-6 pb-10 animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <IconButton icon={X} label="إغلاق" onPress={() => setCancelAppointmentId(null)} />
              <h2 className="text-xl font-black text-foreground">إلغاء الدور</h2>
            </div>
            <p className="text-sm leading-7 text-muted-foreground">
              سيتم إلغاء موعد <strong className="text-foreground">{appointmentToCancel.name}</strong> في {appointmentToCancel.date} — {appointmentToCancel.time}، ثم فتح WhatsApp برسالة اعتذار جاهزة.
            </p>
            <textarea
              value={cancellationReason}
              onChange={(event) => setCancellationReason(event.target.value)}
              maxLength={500}
              rows={4}
              placeholder="سبب الإلغاء (اختياري)"
              className="mt-5 w-full resize-none rounded-2xl border border-border bg-black/20 p-4 text-right text-sm leading-7 text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
            />
            <button onClick={confirmAppointmentCancellation} className="mt-4 flex h-14 w-full flex-row-reverse items-center justify-center gap-2 rounded-2xl bg-[#25D366] font-black text-black">
              <MessageCircle size={19} />
              تأكيد الإلغاء وفتح WhatsApp
            </button>
            <button onClick={() => setCancelAppointmentId(null)} className="mt-3 w-full rounded-xl border border-border px-4 py-3 text-sm font-bold text-muted-foreground">
              إبقاء الموعد
            </button>
          </div>
        </div>
      )}

      {passwordCustomer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-4 animate-fade-in" dir="rtl">
          <div className="w-full max-w-md rounded-t-3xl border border-border bg-card p-6 pb-10 animate-slide-up">
            <div className="mb-3 flex items-center justify-between">
              <IconButton icon={X} label="إغلاق" onPress={() => setPasswordCustomer(null)} />
              <h2 className="text-xl font-black text-foreground">تعديل كلمة المرور</h2>
            </div>
            <p className="text-sm leading-7 text-muted-foreground">تعيين كلمة مرور جديدة للحساب: <strong className="text-foreground">{passwordCustomer.name}</strong></p>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="كلمة المرور الجديدة"
              minLength={8}
              className="mt-5 h-12 w-full rounded-xl border border-border bg-black/20 px-4 text-left text-sm text-foreground outline-none focus:border-primary"
              dir="ltr"
            />
            <input
              type="password"
              value={passwordConfirmation}
              onChange={(event) => setPasswordConfirmation(event.target.value)}
              placeholder="تأكيد كلمة المرور"
              minLength={8}
              className="mt-3 h-12 w-full rounded-xl border border-border bg-black/20 px-4 text-left text-sm text-foreground outline-none focus:border-primary"
              dir="ltr"
            />
            {passwordError && <p className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-right text-xs font-bold text-destructive">{passwordError}</p>}
            <button
              type="button"
              onClick={submitPasswordReset}
              disabled={customerActionPending}
              className="mt-5 flex h-14 w-full flex-row-reverse items-center justify-center gap-2 rounded-2xl bg-primary font-black text-primary-foreground disabled:opacity-50"
            >
              <KeyRound size={18} />
              {customerActionPending ? 'جارٍ الحفظ...' : 'حفظ كلمة المرور'}
            </button>
          </div>
        </div>
      )}

      {scheduleModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-4 animate-fade-in" dir="rtl">
          <div className="w-full max-w-md rounded-t-3xl border border-border bg-card p-6 pb-10 animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <IconButton icon={X} label="إغلاق" onPress={() => setScheduleModal(false)} />
              <h2 className="text-xl font-black text-foreground">{editingSchedule ? 'تعديل الفترة' : 'إضافة فترة'}</h2>
            </div>
            <label className="mt-4 block text-right text-sm font-bold text-foreground">
              اليوم
              <select
                value={scheduleDraft.dayOfWeek}
                onChange={(event) => setScheduleDraft({ ...scheduleDraft, dayOfWeek: Number(event.target.value) })}
                className="mt-2 h-12 w-full rounded-xl border border-border bg-black/30 px-4 text-right text-sm text-foreground outline-none focus:border-primary"
              >
                {dayNames.map((dayName, dayOfWeek) => <option key={dayName} value={dayOfWeek}>{dayName}</option>)}
              </select>
            </label>
            <label className="mt-4 block text-right text-sm font-bold text-foreground">
              وقت البداية
              <input
                type="time"
                value={scheduleDraft.time}
                onChange={(event) => setScheduleDraft({ ...scheduleDraft, time: event.target.value })}
                className="mt-2 h-12 w-full rounded-xl border border-border bg-black/30 px-4 text-left text-sm text-foreground outline-none focus:border-primary"
                dir="ltr"
              />
            </label>
            <label className="mt-4 flex flex-row-reverse items-center justify-between rounded-xl border border-border p-4 text-sm font-bold text-foreground">
              <span>الفترة متاحة للحجز</span>
              <input
                type="checkbox"
                checked={scheduleDraft.active}
                onChange={(event) => setScheduleDraft({ ...scheduleDraft, active: event.target.checked })}
                className="h-5 w-5 accent-primary"
              />
            </label>
            <button type="button" onClick={() => { void saveSchedule(); }} disabled={actionPending} className="mt-5 flex h-14 w-full flex-row-reverse items-center justify-center gap-2 rounded-2xl bg-primary font-black text-primary-foreground disabled:opacity-50">
              <CheckCircle size={19} />
              {actionPending ? 'جارٍ الحفظ...' : 'حفظ الفترة'}
            </button>
          </div>
        </div>
      )}

      {ageModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-4 animate-fade-in" dir="rtl">
          <div className="w-full max-w-md rounded-t-3xl border border-border bg-card p-6 pb-10 animate-slide-up">
            <div className="mb-3 flex items-center justify-between">
              <IconButton icon={X} label="إغلاق" onPress={() => setAgeModal(false)} />
              <h2 className="text-xl font-black text-foreground">{editingAge ? 'تعديل الفئة' : 'إضافة فئة عمرية'}</h2>
            </div>
            <input value={ageDraft.name} onChange={(event) => setAgeDraft({ ...ageDraft, name: event.target.value })} placeholder="اسم الفئة، مثلاً أطفال" className="mt-4 h-12 w-full rounded-xl border border-border bg-black/20 px-4 text-right text-sm text-foreground outline-none focus:border-primary" />
            <div className="mt-3 flex flex-row-reverse gap-3">
              <input type="number" min="0" value={ageDraft.minAge} onChange={(event) => setAgeDraft({ ...ageDraft, minAge: Number(event.target.value) || 0 })} placeholder="من عمر" className="h-12 flex-1 rounded-xl border border-border bg-black/20 px-4 text-right text-sm text-foreground outline-none focus:border-primary" />
              <input type="number" min="0" value={ageDraft.maxAge ?? ''} onChange={(event) => setAgeDraft({ ...ageDraft, maxAge: event.target.value === '' ? null : Number(event.target.value) })} placeholder="إلى عمر" className="h-12 flex-1 rounded-xl border border-border bg-black/20 px-4 text-right text-sm text-foreground outline-none focus:border-primary" />
            </div>
            <label className="mt-3 flex flex-row-reverse items-center justify-between rounded-xl border border-border p-4 text-sm font-bold text-foreground">
              <span>تظهر للزبون</span>
              <input type="checkbox" checked={ageDraft.active} onChange={(event) => setAgeDraft({ ...ageDraft, active: event.target.checked })} className="h-5 w-5 accent-primary" />
            </label>
            <button type="button" onClick={() => { void saveAge(); }} disabled={actionPending} className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-black text-primary-foreground disabled:opacity-50">
              <CheckCircle size={18} /> {actionPending ? 'جارٍ الحفظ...' : 'حفظ الفئة'}
            </button>
          </div>
        </div>
      )}

      {productModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-4 animate-fade-in" dir="rtl">
          <div className="w-full max-w-md rounded-t-3xl border border-border bg-card p-6 pb-10 animate-slide-up">
            <div className="mb-3 flex items-center justify-between">
              <IconButton icon={X} label="إغلاق" onPress={() => setProductModal(false)} />
              <h2 className="text-xl font-black text-foreground">{editingProduct ? 'تعديل المنتج' : 'إضافة منتج'}</h2>
            </div>
            <input value={productDraft.name} onChange={(event) => setProductDraft({ ...productDraft, name: event.target.value })} placeholder="اسم المنتج" className="mt-4 h-12 w-full rounded-xl border border-border bg-black/20 px-4 text-right text-sm text-foreground outline-none focus:border-primary" />
            <textarea value={productDraft.description} onChange={(event) => setProductDraft({ ...productDraft, description: event.target.value })} placeholder="وصف المنتج" rows={3} className="mt-3 w-full resize-none rounded-xl border border-border bg-black/20 p-4 text-right text-sm text-foreground outline-none focus:border-primary" />
            <div className="mt-3 flex flex-row-reverse gap-3">
              <input type="number" min="0" value={productDraft.price} onChange={(event) => setProductDraft({ ...productDraft, price: Number(event.target.value) || 0 })} placeholder="السعر ₪" className="h-12 flex-1 rounded-xl border border-border bg-black/20 px-4 text-right text-sm text-foreground outline-none focus:border-primary" />
              <input type="number" min="0" value={productDraft.stock} onChange={(event) => setProductDraft({ ...productDraft, stock: Number(event.target.value) || 0 })} placeholder="المخزون" className="h-12 flex-1 rounded-xl border border-border bg-black/20 px-4 text-right text-sm text-foreground outline-none focus:border-primary" />
            </div>
            <label className="mt-3 flex flex-row-reverse items-center justify-between rounded-xl border border-border p-4 text-sm font-bold text-foreground">
              <span>يظهر للزبون</span>
              <input type="checkbox" checked={productDraft.active} onChange={(event) => setProductDraft({ ...productDraft, active: event.target.checked })} className="h-5 w-5 accent-primary" />
            </label>
            <button type="button" onClick={() => { void saveProductDraft(); }} disabled={actionPending} className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-black text-primary-foreground disabled:opacity-50">
              <CheckCircle size={18} /> {actionPending ? 'جارٍ الحفظ...' : 'حفظ المنتج'}
            </button>
          </div>
        </div>
      )}

      {/* Service Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-4 animate-fade-in">
          <div className="w-full max-w-md bg-card border border-border rounded-t-3xl p-6 flex flex-col gap-4 animate-slide-up pb-10">
            <div className="flex justify-between items-center mb-2">
              <IconButton icon={X} label="إغلاق" onPress={() => setModal(false)} />
              <h2 className="text-xl font-bold text-foreground">{editing ? 'تعديل الخدمة' : 'إضافة خدمة'}</h2>
            </div>
            
            <input 
              value={draft.name} 
              onChange={(e) => setDraft({ ...draft, name: e.target.value })} 
              placeholder="اسم الخدمة" 
              className="w-full h-12 bg-transparent border border-border rounded-[14px] px-4 text-right text-sm text-foreground focus:outline-none focus:border-primary" 
            />
            
            <input 
              value={draft.description} 
              onChange={(e) => setDraft({ ...draft, description: e.target.value })} 
              placeholder="وصف مختصر" 
              className="w-full h-12 bg-transparent border border-border rounded-[14px] px-4 text-right text-sm text-foreground focus:outline-none focus:border-primary" 
            />
            
            <div className="flex flex-row-reverse gap-3">
              <input 
                value={String(draft.duration)} 
                onChange={(e) => setDraft({ ...draft, duration: Number(e.target.value) || 0 })} 
                type="number"
                placeholder="الدقائق" 
                className="flex-1 h-12 bg-transparent border border-border rounded-[14px] px-4 text-right text-sm text-foreground focus:outline-none focus:border-primary" 
              />
              <input 
                value={String(draft.price)} 
                onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) || 0 })} 
                type="number"
                placeholder="السعر ₪" 
                className="flex-1 h-12 bg-transparent border border-border rounded-[14px] px-4 text-right text-sm text-foreground focus:outline-none focus:border-primary" 
              />
            </div>
            
            <div className="mt-2">
              <GoldButton title="حفظ الخدمة" icon={CheckCircle} onPress={save} />
            </div>
          </div>
        </div>
      )}

      {/* Walk-in Modal */}
      {walkInModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-4 animate-fade-in">
          <div className="w-full max-w-md bg-card border border-border rounded-t-3xl p-6 flex flex-col gap-4 animate-slide-up pb-10">
            <div className="flex justify-between items-center mb-2">
              <IconButton icon={X} label="إغلاق" onPress={() => setWalkInModal(false)} />
              <h2 className="text-xl font-bold text-foreground">إضافة زبون مباشر</h2>
            </div>
            
            <input 
              autoFocus
              value={walkInName} 
              onChange={(e) => setWalkInName(e.target.value)} 
              placeholder="اسم الزبون" 
              className="w-full h-12 bg-transparent border border-border rounded-[14px] px-4 text-right text-sm text-foreground focus:outline-none focus:border-primary" 
            />
            
            <div className="mt-2">
              <GoldButton 
                title="إضافة للطابور" 
                icon={PlusCircle} 
                onPress={() => { 
                  if(walkInName.trim()) {
                    addWalkIn(walkInName); 
                    setWalkInName(''); 
                    setWalkInModal(false); 
                  }
                }} 
              />
            </div>
          </div>
        </div>
      )}

      {broadcastConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" dir="rtl">
          <div className="w-full max-w-md rounded-3xl border border-primary/30 bg-card p-6 text-right shadow-2xl">
            <div className="flex flex-row-reverse items-center gap-3">
              <MessageCircle size={24} className="text-[#25D366]" />
              <h2 className="text-xl font-black text-foreground">تأكيد الرسالة الجماعية</h2>
            </div>
            <p className="mt-5 text-sm leading-7 text-muted-foreground">
              سيتم إنشاء روابط إرسال لـ <strong className="text-primary">{broadcastRecipientCount}</strong> زبوناً. هل تريد المتابعة؟
            </p>
            <div className="mt-4 rounded-2xl border border-border bg-black/20 p-4 text-sm leading-7 text-foreground">{broadcastMessage}</div>
            <div className="mt-6 flex flex-row-reverse gap-3">
              <button onClick={sendBroadcast} className="flex-1 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-black text-black">تأكيد وتجهيز الروابط</button>
              <button onClick={() => setBroadcastConfirm(false)} className="rounded-xl border border-border px-5 py-3 text-sm font-bold text-muted-foreground">إلغاء</button>
            </div>
          </div>
        </div>
      )}
      <div className="h-20 shrink-0" />
    </Screen>
    <BottomNavigation />
    </>
  );
}
