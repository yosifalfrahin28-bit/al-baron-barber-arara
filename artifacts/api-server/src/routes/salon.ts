 peopleAhead = 0) {
  let participantCategories = Array.from(
    { length: Math.max(1, ticket.guestCount) },
    (_, index) => index === 0 ? ticket.ageCategory : "بالغون",
  );
  try {
    const parsed = JSON.parse(ticket.participantCategories);
    if (
      Array.isArray(parsed)
      && parsed.every((item) => typeof item === "string")
      && parsed.length > 0
      && parsed.length === ticket.guestCount
    ) {
      participantCategories = parsed;
    }
  } catch {
    // Older rows fall back to their original age category.
  }
  return {
    id: ticket.id,
    number: ticket.number,
    name: ticket.name,
    phone: ticket.phone,
    barber: ticket.barber,
    service: ticket.service,
    ageCategory: ticket.ageCategory,
    guestCount: ticket.guestCount,
    participantCategories,
    paymentMethod: ticket.paymentMethod,
    status: ticket.status,
    queuePosition,
    peopleAhead,
    reminderSent: ticket.reminderSent,
    createdAt: ticket.createdAt.toISOString(),
  };
}

function mapAppointment(appointment: typeof salonAppointments.$inferSelect) {
  let participantCategories = Array.from(
    { length: Math.max(1, appointment.guestCount) },
    (_, index) => index === 0 ? appointment.ageCategory : "بالغون",
  );
  try {
    const parsed = JSON.parse(appointment.participantCategories);
    if (
      Array.isArray(parsed)
      && parsed.every((item) => typeof item === "string")
      && parsed.length > 0
      && (parsed.length === appointment.guestCount || appointment.guestCount === 1)
    ) {
      participantCategories = parsed;
    }
  } catch {
    // Older rows fall back to their original age category.
  }
  return {
    id: appointment.id,
    name: appointment.name,
    phone: appointment.phone,
    date: appointment.date,
    time: appointment.time,
    barber: appointment.barber,
    service: appointment.service,
    ageCategory: appointment.ageCategory,
    guestCount: appointment.guestCount,
    participantCategories,
    paymentMethod: appointment.paymentMethod,
    status: appointment.status,
    confirmationSent: appointment.confirmationSent,
    reminderSent: appointment.reminderSent,
    reminderOneHourSent: appointment.reminderOneHourSent,
    reminderTwentyMinuteSent: appointment.reminderTwentyMinuteSent,
    reviewRequestSent: appointment.reviewRequestSent,
    createdAt: appointment.createdAt.toISOString(),
  };
}

function parseTimeMinutes(value: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function getSalonClock() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jerusalem",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date());
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return {
    date: `${value("year")}-${String(value("month")).padStart(2, "0")}-${String(value("day")).padStart(2, "0")}`,
    minutes: value("hour") * 60 + value("minute") + value("second") / 60,
  };
}

function isAppointmentTooSoon(date: string, requestedStart: number) {
  const now = getSalonClock();
  return date === now.date && requestedStart <= now.minutes + 10;
}

function appointmentDurationMinutes(
  serviceName: string,
  participantCategories: string[],
  serviceDurations: Map<string, number>,
  categoryDurations: Map<string, number>,
) {
  const baseDuration = serviceDurations.get(serviceName) ?? 30;
  const extraDuration = participantCategories
    .slice(1)
    .reduce((total, category) => total + (categoryDurations.get(category) ?? defaultAdditionalMinutesForCategory(category)), 0);
  return Math.ceil((baseDuration + extraDuration) / 20) * 20;
}

function defaultAdditionalMinutesForCategory(category: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes("طف") || normalized.includes("child")) return 10;
  if (normalized.includes("شب") || normalized.includes("teen")) return 20;
  return 25;
}

function isTwentyMinuteGridTime(value: string) {
  const minutes = parseTimeMinutes(value);
  return minutes !== null && minutes % 20 === 0;
}

function dateDayOfWeek(date: string) {
  const parsed = new Date(`${date}T12:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getUTCDay();
}

class AppointmentTimeUnavailableError extends Error {
  readonly statusCode = 409;
  readonly code = "APPOINTMENT_TIME_UNAVAILABLE";

  constructor(message = "هذا الوقت محجوز أو يتعارض مع موعد آخر، اختر وقتاً مختلفاً") {
    super(message);
  }
}

function mapScheduleSlot(slot: typeof salonScheduleSlots.$inferSelect) {
  return {
    id: slot.id,
    dayOfWeek: slot.dayOfWeek,
    time: slot.time,
    active: slot.active,
  };
}

const defaultScheduleTimes = Array.from({ length: 31 }, (_, index) => {
  const minutes = 10 * 60 + index * 20;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});

router.get("/salon/state", async (_req, res, next) => {
  try {
    await ensureSeeded();
    const [settings] = await db.select().from(salonSettings).where(eq(salonSettings.id, 1));
    const services = await db.select().from(salonServices).orderBy(asc(salonServices.createdAt));
    const tickets = await db.select().from(salonTickets).where(and(eq(salonTickets.status, "waiting"))).orderBy(asc(salonTickets.number));
    const [current] = await db.select().from(salonTickets).where(eq(salonTickets.status, "serving")).limit(1);
    const appointments = await db.select().from(salonAppointments).orderBy(desc(salonAppointments.createdAt)).limit(100);
    const ageCategories = await db.select().from(salonAgeCategories).orderBy(asc(salonAgeCategories.sortOrder));
    const products = await db.select().from(salonProducts).orderBy(asc(salonProducts.createdAt));
    const [shopInfo] = await db.select().from(salonShopInfo).where(eq(salonShopInfo.id, 1)).limit(1);
    res.json({
      settings: { shopOpen: settings?.shopOpen ?? true },
      services: services.map(mapService),
      ageCategories: ageCategories.map(mapAgeCategory),
      products: products.map(mapProduct),
      shopInfo: shopInfo ? mapShopInfo(shopInfo) : mapShopInfo({ id: 1, shopName: "صالون البارون", phone: "", whatsapp: "", address: "", mapsUrl: "", instagramUrl: "", bitLink: "", openingHours: "", updatedAt: new Date() }),
      currentTicket: current ? mapTicket(current, 0, 0) : null,
      waitingTickets: tickets.map((ticket, index) => mapTicket(ticket, index + 1, index)),
      appointments: appointments.map(mapAppointment),
      schedule: (await db.select().from(salonScheduleSlots).orderBy(asc(salonScheduleSlots.dayOfWeek), asc(salonScheduleSlots.time))).map(mapScheduleSlot),
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/admin/whatsapp/qr", requireAuth, requireAdmin, (_req, res) => {
  const whatsapp = getWhatsAppStatus();
  res.json({
    state: whatsapp.state,
    qr: whatsapp.qr,
    updatedAt: whatsapp.qrUpdatedAt,
  });
});

router.get("/whatsapp/setup-qr", (req, res) => {
  const whatsapp = getWhatsAppStatus();
  return res.json({
    state: whatsapp.state,
    qr: whatsapp.qr,
    updatedAt: whatsapp.qrUpdatedAt,
  });
});

router.get("/auth/me", requireAuth, async (req, res) => {
  const profile = req.salonUser!;
  res.json({ id: profile.id, phone: profile.phone, name: profile.name, note: profile.note, role: profile.role, bookingRestricted: profile.bookingRestricted, accountNotice: profile.accountNotice });
});

router.get("/auth/session", async (req, res, next) => {
  try {
    const user = await getSessionUser(getSessionToken(req));
    if (!user) return res.status(401).json({ message: "authentication required" });
    if (user.isBanned) return res.status(403).json({ code: "ACCOUNT_BANNED", message: BANNED_BOOKING_MESSAGE });
    return res.json({ id: user.id, phone: user.phone, name: user.name, note: user.note, role: user.role, bookingRestricted: user.bookingRestricted, accountNotice: user.accountNotice });
  } catch (error) {
    return next(error);
  }
});

const requestPhoneCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const phone = normalizePhone(text(req.body?.phone));
    const mode = req.body?.mode === "sign-up" ? "sign-up" : "sign-in";
    const name = text(req.body?.name);
    const password = text(req.body?.password);
    if (!isValidIsraeliPhone(phone)) {
      return res.status(400).json({ code: "INVALID_PHONE", message: "أدخل رقم هاتف إسرائيلي صالح يبدأ بـ 05" });
    }
    const [existing] = await db.select().from(salonUsers).where(eq(salonUsers.phone, phone)).limit(1);
    if (existing?.isBanned) {
      return res.status(403).json({ code: "ACCOUNT_BANNED", message: BANNED_BOOKING_MESSAGE });
    }
    if (mode === "sign-in" && !existing) {
      return res.status(404).json({ code: "PHONE_NOT_REGISTERED", message: "الرقم غير مسجل، يرجى إنشاء حساب" });
    }
    if (mode === "sign-up" && existing) {
      if (existing.passwordHash) {
        return res.status(409).json({ code: "PHONE_REGISTERED", message: "الرقم مسجل مسبقاً، يرجى تسجيل الدخول" });
      }
    }
    if (mode === "sign-up" && name.length < 2) {
      return res.status(400).json({ code: "NAME_REQUIRED", message: "الاسم الكامل مطلوب" });
    }
    if (mode === "sign-up" && password.length < 8) {
      return res.status(400).json({ code: "PASSWORD_TOO_SHORT", message: "كلمة المرور يجب أن تتكون من 8 أحرف على الأقل" });
    }
    const passwordHash = mode === "sign-up" ? await hashPassword(password) : undefined;
    const challenge = await createPhoneChallenge(phone, mode === "sign-in" ? existing.name : name, passwordHash);
    const delivery = await sendPhoneCode(phone, challenge.id);
    return res.status(202).json({
      message: delivery.delivered ? "WhatsApp verification code sent" : "development verification code generated",
      devOtp: delivery.devOtp,
    });
  } catch (error) {
    return next(error);
  }
};

router.post("/auth/phone/request-code", requestPhoneCode);
router.post("/auth/send-otp", requestPhoneCode);

router.post("/auth/password-login", async (req, res, next) => {
  try {
    const phone = normalizePhone(text(req.body?.phone));
    const password = text(req.body?.password);
    if (!isValidIsraeliPhone(phone) || !password) {
      return res.status(400).json({ code: "PASSWORD_LOGIN_INPUT_REQUIRED", message: "رقم الهاتف وكلمة المرور مطلوبان" });
    }
    const [user] = await db.select().from(salonUsers).where(eq(salonUsers.phone, phone)).limit(1);
    if (user?.isBanned) {
      return res.status(403).json({ code: "ACCOUNT_BANNED", message: BANNED_BOOKING_MESSAGE });
    }
    if (!user || !user.passwordHash) {
      return res.status(401).json({ code: "INVALID_LOGIN", message: "رقم الهاتف أو كلمة المرور غير صحيحة" });
    }
    if (!(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ code: "INVALID_LOGIN", message: "رقم الهاتف أو كلمة المرور غير صحيحة" });
    }
    const challenge = await createPhoneChallenge(user.phone, user.name);
    const delivery = await sendPhoneCode(user.phone, challenge.id);
    return res.status(202).json({
      message: delivery.delivered ? "WhatsApp verification code sent" : "development verification code generated",
      devOtp: delivery.devOtp,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/auth/password-reset/request", async (req, res, next) => {
  try {
    const phone = normalizePhone(text(req.body?.phone));
    if (!isValidIsraeliPhone(phone)) {
      return res.status(400).json({ code: "INVALID_PHONE", message: "أدخل رقم هاتف إسرائيلي صالح يبدأ بـ 05" });
    }
    const [user] = await db.select().from(salonUsers).where(eq(salonUsers.phone, phone)).limit(1);
    if (user?.isBanned) {
      return res.status(403).json({ code: "ACCOUNT_BANNED", message: BANNED_BOOKING_MESSAGE });
    }
    if (!user || !user.passwordHash) {
      return res.status(404).json({ code: "PHONE_NOT_REGISTERED", message: "الرقم غير مسجل، يرجى إنشاء حساب" });
    }
    const challenge = await createPhoneChallenge(phone, user.name, undefined, "password-reset");
    let delivery;
    try {
      delivery = await sendPhoneCode(phone, challenge.id, "password-reset");
    } catch (error) {
      if (error instanceof Error && error.message.includes("WhatsApp is not connected")) {
        return res.status(503).json({
          code: "WHATSAPP_NOT_CONNECTED",
          message: "WhatsApp غير متصل حالياً. يرجى ربط WhatsApp من رمز QR أولاً ثم إعادة المحاولة.",
        });
      }
      throw error;
    }
    return res.status(202).json({
      message: delivery.delivered ? "Password reset code sent" : "development verification code generated",
      devOtp: delivery.devOtp,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/auth/password-reset/confirm", async (req, res, next) => {
  try {
    const phone = normalizePhone(text(req.body?.phone));
    const code = text(req.body?.code);
    const password = text(req.body?.password);
    if (!isValidIsraeliPhone(phone) || !/^\d{4,6}$/.test(code) || password.length < 8) {
      return res.status(400).json({ code: "PASSWORD_RESET_INPUT_REQUIRED", message: "رقم الهاتف والرمز وكلمة المرور الجديدة مطلوبة" });
    }
    const challenge = await verifyPhoneChallenge(phone, code);
    if (!challenge || challenge.provider !== "password-reset") {
      return res.status(401).json({ code: "INVALID_RESET_CODE", message: "رمز الاستعادة غير صحيح أو منتهي الصلاحية" });
    }
    const passwordHash = await hashPassword(password);
    const [user] = await db.update(salonUsers)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(salonUsers.phone, phone))
      .returning();
    if (!user) return res.status(404).json({ code: "PHONE_NOT_REGISTERED", message: "الرقم غير مسجل، يرجى إنشاء حساب" });
    const token = await createSession(user.phone);
    setSessionCookie(req, res, token);
    return res.json({
      id: user.id,
      phone: user.phone,
      name: user.name,
      note: user.note,
      role: user.role,
      bookingRestricted: user.bookingRestricted,
      accountNotice: user.accountNotice,
      sessionToken: token,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/auth/phone/verify-code", async (req, res, next) => {
  try {
    const phone = normalizePhone(text(req.body?.phone));
    const code = text(req.body?.code);
    if (!phone || !/^\d{4,6}$/.test(code)) return res.status(400).json({ message: "phone and verification code are required" });
    const challenge = await verifyPhoneChallenge(phone, code);
    if (!challenge) return res.status(401).json({ message: "invalid or expired verification code" });
    if (challenge.provider === "password-reset") {
      return res.status(400).json({ code: "PASSWORD_RESET_CONFIRM_REQUIRED", message: "استخدم تأكيد استعادة كلمة المرور" });
    }
    const [existing] = await db.select({ id: salonUsers.id, isBanned: salonUsers.isBanned }).from(salonUsers).where(eq(salonUsers.phone, challenge.phone)).limit(1);
    if (existing?.isBanned) {
      return res.status(403).json({ code: "ACCOUNT_BANNED", message: BANNED_BOOKING_MESSAGE });
    }
    const user = await upsertPhoneUser(challenge.phone, challenge.name, challenge.passwordHash ?? undefined);
    if (!existing) {
      void sendWelcomeMessage(user.phone, user.name).catch((error) => {
        logger.warn({ err: error, phone: user.phone }, "Welcome WhatsApp message deferred");
      });
    }
    const token = await createSession(user.phone);
    setSessionCookie(req, res, token);
    return res.json({ id: user.id, phone: user.phone, name: user.name, note: user.note, role: user.role, bookingRestricted: user.bookingRestricted, accountNotice: user.accountNotice, sessionToken: token });
  } catch (error) {
    return next(error);
  }
});

router.post("/auth/sign-out", async (req, res, next) => {
  try {
    const token = getSessionToken(req);
    if (token) {
      const user = await getSessionUser(token);
      if (user) {
        // Expire all active sessions for this phone only when the current cookie is valid.
        await db.delete(salonAuthSessions).where(eq(salonAuthSessions.phone, user.phone));
      }
    }
    clearSessionCookie(req, res);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

router.get("/admin/message-templates", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    await seedMessageTemplates();
    const templates = await db.select().from(salonMessageTemplates);
    return res.json((Object.keys(DEFAULT_MESSAGE_TEMPLATES) as MessageTemplateKey[]).map((templateKey) => {
      const stored = templates.find((template) => template.templateKey === templateKey);
      return {
        key: templateKey,
        label: MESSAGE_TEMPLATE_LABELS[templateKey],
        body: stored?.body ?? DEFAULT_MESSAGE_TEMPLATES[templateKey],
      };
    }));
  } catch (error) {
    return next(error);
  }
});

router.patch("/admin/message-templates/:key", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const templateKey = text(req.params.key) as MessageTemplateKey;
    if (!Object.prototype.hasOwnProperty.call(DEFAULT_MESSAGE_TEMPLATES, templateKey)) {
      return res.status(404).json({ message: "message template not found" });
    }
    const body = text(req.body?.body);
    if (!body) return res.status(400).json({ message: "message template body is required" });
    if (body.length > 2000) return res.status(400).json({ message: "message template is too long" });
    const [template] = await db.update(salonMessageTemplates)
      .set({ body, updatedAt: new Date() })
      .where(eq(salonMessageTemplates.templateKey, templateKey))
      .returning();
    return res.json({
      key: templateKey,
      label: MESSAGE_TEMPLATE_LABELS[templateKey],
      body: template?.body ?? body,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/admin/broadcast-whatsapp/recipients", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const customers = await db.select({ phone: salonUsers.phone }).from(salonUsers).where(eq(salonUsers.role, "client"));
    const phones = new Set(customers.map((customer) => normalizePhone(customer.phone)).filter((phone) => phone.length > 0));
    return res.json({ recipientCount: phones.size });
  } catch (error) {
    return next(error);
  }
});

router.get("/admin/appointments", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const appointments = await db.select().from(salonAppointments).orderBy(desc(salonAppointments.createdAt));
    return res.json(appointments.map(mapAppointment));
  } catch (error) {
    return next(error);
  }
});

router.post("/admin/broadcast-sms", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const message = text(req.body?.message);
    if (!message) return res.status(400).json({ message: "broadcast message is required" });
    if (message.length > 2000) return res.status(400).json({ message: "WhatsApp message is too long" });

    const customers = await db.select({ phone: salonUsers.phone, name: salonUsers.name })
      .from(salonUsers)
      .where(eq(salonUsers.role, "client"));
    const recipients = Array.from(new Map(
      customers
        .map((customer) => ({ ...customer, phone: normalizePhone(customer.phone) }))
        .filter((customer) => customer.phone.length > 0)
        .map((customer) => [customer.phone, customer]),
    ).values());
    const results: boolean[] = [];
    for (const [index, recipient] of recipients.entries()) {
      if (index > 0) await wait(2000 + Math.floor(Math.random() * 3001));
      try {
        results.push(await sendWhatsAppMessage(recipient.phone, message));
      } catch {
        results.push(false);
      }
    }
    const sentCount = results.filter(Boolean).length;
    return res.json({
      enabled: sentCount > 0,
      recipientCount: recipients.length,
      sentCount,
      failedCount: recipients.length - sentCount,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/admin/broadcast-whatsapp", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const message = text(req.body?.message);
    if (!message) return res.status(400).json({ message: "broadcast message is required" });
    if (message.length > 2000) return res.status(400).json({ message: "broadcast message is too long" });

    const customers = await db.select({ phone: salonUsers.phone, name: salonUsers.name }).from(salonUsers).where(eq(salonUsers.role, "client"));
    const recipients = Array.from(new Map(
      customers
        .map((customer) => ({ ...customer, phone: normalizePhone(customer.phone) }))
        .filter((customer) => customer.phone.length > 0)
        .map((customer) => [customer.phone, customer]),
    ).values());
    const broadcastId = id("broadcast");
    const [broadcast] = await db.insert(salonBroadcasts).values({
      id: broadcastId,
      message,
      recipientCount: recipients.length,
      status: "sending",
      createdByPhone: req.salonUser!.phone,
    }).returning();
    const rows = recipients.map((customer) => ({
      id: id("broadcast_recipient"),
      broadcastId,
      phone: customer.phone,
      name: customer.name,
      status: "pending",
      clickToChatUrl: `https://wa.me/${customer.phone.replace(/^0/, "972")}?text=${encodeURIComponent(message)}`,
    }));
    if (rows.length > 0) await db.insert(salonBroadcastRecipients).values(rows);
    const { sendWhatsAppMessage } = await import("../integrations/whatsapp");
    let sentCount = 0;
    for (const [index, row] of rows.entries()) {
      if (index > 0) await wait(2000 + Math.floor(Math.random() * 3001));
      try {
        const sent = await sendWhatsAppMessage(row.phone, message);
        await db.update(salonBroadcastRecipients)
          .set({ status: sent ? "sent" : "failed" })
          .where(eq(salonBroadcastRecipients.id, row.id));
        if (sent) sentCount += 1;
      } catch (error) {
        logger.warn({ err: error, recipient: row.phone }, "WhatsApp broadcast recipient failed");
        await db.update(salonBroadcastRecipients)
          .set({ status: "failed" })
          .where(eq(salonBroadcastRecipients.id, row.id));
      }
    }
    const status = sentCount === rows.length && rows.length > 0
      ? "completed"
      : sentCount > 0
        ? "partial"
        : "failed";
    await db.update(salonBroadcasts).set({ status }).where(eq(salonBroadcasts.id, broadcastId));
    return res.status(201).json({
      id: broadcast.id,
      status,
      recipientCount: broadcast.recipientCount,
      sentCount,
      failedCount: rows.length - sentCount,
      links: rows.map((row) => ({ name: row.name, phone: row.phone, url: row.clickToChatUrl })),
      createdAt: broadcast.createdAt.toISOString(),
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/admin/customers", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const customers = await db.select({
      id: salonUsers.id,
      phone: salonUsers.phone,
      name: salonUsers.name,
      note: salonUsers.note,
      role: salonUsers.role,
      banned: salonUsers.isBanned,
      banReason: salonUsers.banReason,
      bookingRestricted: salonUsers.bookingRestricted,
      accountNotice: salonUsers.accountNotice,
      createdAt: salonUsers.createdAt,
    }).from(salonUsers).orderBy(desc(salonUsers.createdAt));
    return res.json(customers.map((customer) => ({
      ...customer,
      createdAt: customer.createdAt.toISOString(),
    })));
  } catch (error) {
    return next(error);
  }
});

router.patch("/admin/customers/:id/role", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const customerId = text(req.params.id);
    const role = text(req.body?.role);
    if (role !== "admin" && role !== "client") {
      return res.status(400).json({ message: "role must be admin or client" });
    }
    const [customer] = await db.select().from(salonUsers).where(eq(salonUsers.id, customerId)).limit(1);
    if (!customer) return res.status(404).json({ message: "customer not found" });
    if (customer.id === req.salonUser!.id && role !== "admin") {
      return res.status(400).json({ message: "لا يمكنك إزالة صلاحية الإدارة من حسابك" });
    }
    if (customer.role === "admin" && role === "client") {
      const [{ adminCount }] = await db.select({ adminCount: count() }).from(salonUsers).where(eq(salonUsers.role, "admin"));
      if (adminCount <= 1) {
        return res.status(400).json({ message: "يجب أن يبقى حساب أدمن واحد على الأقل" });
      }
    }
    const [updated] = await db.update(salonUsers)
      .set({ role, updatedAt: new Date() })
      .where(eq(salonUsers.id, customerId))
      .returning();
    return res.json({
      id: updated.id,
      phone: updated.phone,
      name: updated.name,
      note: updated.note,
      role: updated.role,
      banned: updated.isBanned,
      banReason: updated.banReason,
      bookingRestricted: updated.bookingRestricted,
      accountNotice: updated.accountNotice,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/admin/customers/:id/ban", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const customerId = text(req.params.id);
    const banned = bool(req.body?.banned, false);
    const banReason = text(req.body?.reason);
    const [customer] = await db.select().from(salonUsers).where(eq(salonUsers.id, customerId)).limit(1);
    if (!customer) return res.status(404).json({ message: "customer not found" });
    if (customer.role === "admin") return res.status(400).json({ message: "admin accounts cannot be banned" });

    const [updated] = await db.update(salonUsers)
      .set({ isBanned: banned, banReason: banned ? banReason : "", updatedAt: new Date() })
      .where(eq(salonUsers.id, customerId))
      .returning();
    if (banned) {
      await db.delete(salonAuthSessions).where(eq(salonAuthSessions.phone, customer.phone));
      await db.delete(salonAuthChallenges).where(eq(salonAuthChallenges.phone, customer.phone));
    }
    return res.json({
      id: updated.id,
      phone: updated.phone,
      name: updated.name,
      note: updated.note,
      role: updated.role,
      banned: updated.isBanned,
      banReason: updated.banReason,
      bookingRestricted: updated.bookingRestricted,
      accountNotice: updated.accountNotice,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/admin/customers/:id/restrictions", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const customerId = text(req.params.id);
    const customer = await db.select().from(salonUsers).where(eq(salonUsers.id, customerId)).limit(1);
    if (!customer[0]) return res.status(404).json({ message: "customer not found" });
    if (customer[0].role === "admin") return res.status(400).json({ message: "admin accounts cannot be restricted" });
    const [updated] = await db.update(salonUsers)
      .set({
        bookingRestricted: bool(req.body?.bookingRestricted, false),
        accountNotice: text(req.body?.accountNotice).slice(0, 500),
        updatedAt: new Date(),
      })
      .where(eq(salonUsers.id, customerId))
      .returning();
    return res.json({
      id: updated.id,
      phone: updated.phone,
      name: updated.name,
      note: updated.note,
      role: updated.role,
      banned: updated.isBanned,
      banReason: updated.banReason,
      bookingRestricted: updated.bookingRestricted,
      accountNotice: updated.accountNotice,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/admin/customers/:id/password", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const customerId = text(req.params.id);
    const password = text(req.body?.password);
    if (password.length < 8) return res.status(400).json({ message: "كلمة المرور يجب أن تتكون من 8 أحرف على الأقل" });
    const [customer] = await db.select().from(salonUsers).where(eq(salonUsers.id, customerId)).limit(1);
    if (!customer) return res.status(404).json({ message: "customer not found" });
    if (customer.role === "admin") return res.status(400).json({ message: "admin passwords must be changed through a protected admin flow" });
    await db.update(salonUsers).set({ passwordHash: await hashPassword(password), updatedAt: new Date() }).where(eq(salonUsers.id, customerId));
    await db.delete(salonAuthSessions).where(eq(salonAuthSessions.phone, customer.phone));
    await db.delete(salonAuthChallenges).where(eq(salonAuthChallenges.phone, customer.phone));
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

router.delete("/admin/customers/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const customerId = text(req.params.id);
    const [customer] = await db.select().from(salonUsers).where(eq(salonUsers.id, customerId)).limit(1);
    if (!customer) return res.status(404).json({ message: "customer not found" });
    if (customer.role === "admin") return res.status(400).json({ message: "admin accounts cannot be deleted" });
    await db.delete(salonAuthSessions).where(eq(salonAuthSessions.phone, customer.phone));
    await db.delete(salonAuthChallenges).where(eq(salonAuthChallenges.phone, customer.phone));
    await db.delete(salonUsers).where(eq(salonUsers.id, customerId));
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

router.post("/auth/phone/profile", requireAuth, async (req, res, next) => {
  try {
    const name = text(req.body?.name);
    if (!name) return res.status(400).json({ message: "name is required" });
    const [profile] = await db.update(salonUsers).set({ name, note: text(req.body?.note), updatedAt: new Date() }).where(eq(salonUsers.id, req.salonUser!.id)).returning();
    res.json({ id: profile.id, phone: profile.phone, name: profile.name, note: profile.note, role: profile.role, bookingRestricted: profile.bookingRestricted, accountNotice: profile.accountNotice });
  } catch (error) {
    return next(error);
  }
});

router.get("/auth/phone/profile/:phone", requireAuth, async (req, res, next) => {
  try {
    const phone = normalizePhone(text(req.params.phone));
    if (phone !== req.salonUser!.phone) return res.status(403).json({ message: "profile access denied" });
    const [profile] = await db.select().from(salonUsers).where(eq(salonUsers.phone, phone)).limit(1);
    if (!profile) return res.status(404).json({ message: "profile not found" });
    res.json({ id: profile.id, phone: profile.phone, name: profile.name, note: profile.note, role: profile.role, bookingRestricted: profile.bookingRestricted, accountNotice: profile.accountNotice });
  } catch (error) {
    return next(error);
  }
});

router.post("/tickets", requireAuth, requireBookingAccess, async (req, res, next) => {
  try {
    const phone = req.salonUser!.phone;
    const name = req.salonUser!.name;
    const barber = text(req.body?.barber, "أول حلاق متاح");
    const service = text(req.body?.service, "قص شعر مودرن");
    const ageCategory = text(req.body?.ageCategory, "بالغون");
    const rawParticipantCategories = req.body?.participantCategories;
    if (rawParticipantCategories !== undefined && (
      !Array.isArray(rawParticipantCategories)
      || rawParticipantCategories.length < 1
      || rawParticipantCategories.length > 8
      || rawParticipantCategories.some((category: unknown) => typeof category !== "string" || !category.trim())
    )) {
      return res.status(400).json({ message: "قائمة الأشخاص غير صالحة" });
    }
    const participantCategories = Array.isArray(rawParticipantCategories)
      ? rawParticipantCategories.map((category: string) => category.trim())
      : Array.from({ length: Math.min(8, Math.max(1, number(req.body?.guestCount, 1))) }, (_, index) => index === 0 ? ageCategory : "بالغون");
    const paymentMethod = text(req.body?.paymentMethod, "bit");
    if (paymentMethod !== "bit" && paymentMethod !== "cash_at_shop") {
      return res.status(400).json({ message: "طريقة الدفع غير صالحة" });
    }
    if (!phone || !name) return res.status(400).json({ message: "phone and name are required" });
    const [highest] = await db.select({ value: max(salonTickets.number) }).from(salonTickets);
    const [ticket] = await db.insert(salonTickets).values({
      id: id("ticket"),
      number: (highest?.value ?? 0) + 1,
      userId: req.salonUser!.id,
      name,
      phone,
      barber,
      service,
      ageCategory,
      guestCount: participantCategories.length,
      participantCategories: JSON.stringify(participantCategories),
      paymentMethod,
      status: "waiting",
    }).returning();
    res.status(201).json(mapTicket(ticket));
  } catch (error) {
    return next(error);
  }
});

router.post("/tickets/:id/cancel", requireAuth, async (req, res, next) => {
  try {
    const [existing] = await db.select().from(salonTickets).where(eq(salonTickets.id, text(req.params.id))).limit(1);
    if (!existing) return res.status(404).json({ message: "ticket not found" });
    if (req.salonUser!.role !== "admin" && existing.userId !== req.salonUser!.id) return res.status(403).json({ message: "ticket access denied" });
    const [ticket] = await db.update(salonTickets).set({ status: "cancelled", updatedAt: new Date() }).where(eq(salonTickets.id, text(req.params.id))).returning();
    if (!ticket) return res.status(404).json({ message: "ticket not found" });
    res.json(mapTicket(ticket));
  } catch (error) {
    return next(error);
  }
});

router.post("/queue/advance", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const current = await db.select().from(salonTickets).where(eq(salonTickets.status, "serving")).limit(1);
    const waiting = await db.select().from(salonTickets).where(eq(salonTickets.status, "waiting")).orderBy(asc(salonTickets.number)).limit(1);
    await db.transaction(async (tx) => {
      if (current[0]) await tx.update(salonTickets).set({ status: "completed", updatedAt: new Date() }).where(eq(salonTickets.id, current[0].id));
      if (waiting[0]) await tx.update(salonTickets).set({ status: "serving", updatedAt: new Date() }).where(eq(salonTickets.id, waiting[0].id));
    });
    const next = waiting[0] ? { ...waiting[0], status: "serving" } : null;
    res.json(next ? mapTicket(next, 0, 0) : { id: "", number: 0, name: "", phone: "", barber: "", service: "", ageCategory: "بالغون", guestCount: 1, participantCategories: ["بالغون"], paymentMethod: "cash_at_shop", status: "completed", queuePosition: 0, peopleAhead: 0, reminderSent: false, createdAt: new Date().toISOString() });
  } catch (error) {
    return next(error);
  }
});

router.post("/walk-ins", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const name = text(req.body?.name, "زبون مباشر");
    const phone = text(req.body?.phone);
    const barber = text(req.body?.barber, "أول حلاق متاح");
    const service = text(req.body?.service, "قص شعر مودرن");
    const ageCategory = text(req.body?.ageCategory, "بالغون");
    const [highest] = await db.select({ value: max(salonTickets.number) }).from(salonTickets);
    const [ticket] = await db.insert(salonTickets).values({ id: id("ticket"), number: (highest?.value ?? 0) + 1, name, phone, barber, service, ageCategory, status: "waiting" }).returning();
    res.status(201).json(mapTicket(ticket));
  } catch (error) {
    return next(error);
  }
});

router.post("/tickets/:id/summon", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const [ticket] = await db.update(salonTickets).set({ reminderSent: true, updatedAt: new Date() }).where(eq(salonTickets.id, text(req.params.id))).returning();
    if (!ticket) return res.status(404).json({ message: "ticket not found" });
    const message = `مرحباً ${ticket.name}، تذكير بموعدك في صالون البارون! باقي على دورك 20 دقيقة، يرجى التوجه للصالون الآن لتنفيذ خدمتك في الوقت المحدد.`;
    let sent = false;
    if (ticket.phone) {
      try {
        sent = await sendWhatsAppMessage(ticket.phone, message);
      } catch (error) {
        logger.warn({ err: error, ticketId: ticket.id }, "Queue summon WhatsApp message failed");
      }
    }
    const whatsappUrl = ticket.phone ? `https://wa.me/${ticket.phone.replace(/^0/, "972")}?text=${encodeURIComponent(message)}` : "";
    res.json({ sent, providerConnected: sent, whatsappUrl });
  } catch (error) {
    return next(error);
  }
});

router.get("/appointments", requireAuth, async (req, res, next) => {
  try {
    const requestedPhone = text(req.query.phone);
    if (requestedPhone && normalizePhone(requestedPhone) !== req.salonUser!.phone && req.salonUser!.role !== "admin") {
      return res.status(403).json({ message: "appointment access denied" });
    }
    const phone = req.salonUser!.role === "admin" && requestedPhone ? normalizePhone(requestedPhone) : req.salonUser!.phone;
    const rows = await db.select().from(salonAppointments).where(eq(salonAppointments.phone, phone)).orderBy(desc(salonAppointments.createdAt));
    res.json(rows.map(mapAppointment));
  } catch (error) {
    return next(error);
  }
});

router.post("/appointments", requireAuth, requireBookingAccess, async (req, res, next) => {
  try {
    const phone = req.salonUser!.phone;
    const name = req.salonUser!.name;
    const date = text(req.body?.date, "اليوم");
    const time = text(req.body?.time, "18:30");
    const barber = text(req.body?.barber, "أول حلاق متاح");
    const service = text(req.body?.service, "قص شعر مودرن");
    const ageCategory = text(req.body?.ageCategory, "بالغون");
    const rawParticipantCategories = req.body?.participantCategories;
    if (rawParticipantCategories !== undefined && (
      !Array.isArray(rawParticipantCategories)
      || rawParticipantCategories.length < 1
      || rawParticipantCategories.length > 8
      || rawParticipantCategories.some((category: unknown) => typeof category !== "string" || !category.trim())
    )) {
      return res.status(400).json({ message: "قائمة الأشخاص غير صالحة" });
    }
    const participantCategories = Array.isArray(rawParticipantCategories)
      ? rawParticipantCategories.map((category: string) => category.trim())
      : Array.from({ length: Math.min(8, Math.max(1, number(req.body?.guestCount, 1))) }, (_, index) => index === 0 ? ageCategory : "بالغون");
    const guestCount = participantCategories.length;
    const paymentMethod = text(req.body?.paymentMethod, "bit");
    if (!["bit", "cash_at_shop"].includes(paymentMethod)) {
      return res.status(400).json({ message: "طريقة الدفع غير صالحة" });
    }
    const requestedStart = parseTimeMinutes(time);
    if (requestedStart === null || date === "اليوم") {
      return res.status(400).json({ message: "تاريخ ووقت الحجز غير صالحين" });
    }
    if (isAppointmentTooSoon(date, requestedStart)) {
      return res.status(400).json({
        code: "APPOINTMENT_CUTOFF",
        message: "لا يمكن حجز هذا الوقت لأنه بدأ أو بقي عليه أقل من 10 دقائق، اختر وقتاً لاحقاً",
      });
    }

    const [appointment] = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`salon-appointments:${date}`}))`);
       const [services, categories, existingAppointments, scheduleSlots] = await Promise.all([
        tx.select({ name: salonServices.name, duration: salonServices.duration }).from(salonServices),
         tx.select({ name: salonAgeCategories.name, additionalMinutes: salonAgeCategories.additionalMinutes }).from(salonAgeCategories).where(eq(salonAgeCategories.active, true)),
        tx.select().from(salonAppointments).where(eq(salonAppointments.date, date)),
         tx.select().from(salonScheduleSlots).where(and(eq(salonScheduleSlots.dayOfWeek, dateDayOfWeek(date) ?? -1), eq(salonScheduleSlots.active, true))),
      ]);
      const serviceDurations = new Map(services.map((item) => [item.name, item.duration]));
       const categoryDurations = new Map(categories.map((item) => [item.name, item.additionalMinutes ?? defaultAdditionalMinutesForCategory(item.name)]));
       if (!isTwentyMinuteGridTime(time)) {
         throw new AppointmentTimeUnavailableError("اختر وقتاً متوافقاً مع شبكة المواعيد كل 20 دقيقة");
       }
       const requestedDuration = appointmentDurationMinutes(service, participantCategories, serviceDurations, categoryDurations);
       const requestedUnits = requestedDuration / 20;
       const activeScheduleTimes = new Set(scheduleSlots.map((slot) => slot.time));
       const requestedSlots = Array.from({ length: requestedUnits }, (_, index) => requestedStart + index * 20);
       if (requestedSlots.some((slot) => !activeScheduleTimes.has(`${String(Math.floor(slot / 60)).padStart(2, "0")}:${String(slot % 60).padStart(2, "0")}`))) {
         throw new AppointmentTimeUnavailableError("لا توجد أوقات متتالية كافية لهذا الحجز، اختر وقتاً مختلفاً");
       }
       const requestedEnd = requestedStart + requestedDuration;
      const overlaps = existingAppointments.some((existing) => {
        if (existing.status === "cancelled") return false;
        const existingStart = parseTimeMinutes(existing.time);
        if (existingStart === null) return false;
        let existingParticipants = Array.from(
          { length: Math.max(1, existing.guestCount) },
          (_, index) => index === 0 ? existing.ageCategory : "بالغون",
        );
        try {
          const parsed = JSON.parse(existing.participantCategories);
          if (
            Array.isArray(parsed)
            && parsed.every((item) => typeof item === "string")
            && parsed.length > 0
            && (parsed.length === existing.guestCount || existing.guestCount === 1)
          ) {
            existingParticipants = parsed;
          }
        } catch {
          // Older rows use the original single-person duration.
        }
         const existingEnd = existingStart + appointmentDurationMinutes(existing.service, existingParticipants, serviceDurations, categoryDurations);
        return requestedStart < existingEnd && existingStart < requestedEnd;
      });
      if (overlaps) throw new AppointmentTimeUnavailableError();

      return tx.insert(salonAppointments).values({
        id: id("appointment"),
        userId: req.salonUser!.id,
        date,
        time,
        name,
        phone,
        barber,
        service,
        ageCategory,
        guestCount,
        participantCategories: JSON.stringify(participantCategories),
        paymentMethod,
        status: "confirmed",
      }).returning();
    }).catch((error) => {
      if (error instanceof AppointmentTimeUnavailableError) throw error;
      throw error;
    });
    await db.update(salonUsers).set({ lastRebookingReminderAt: null, updatedAt: new Date() }).where(eq(salonUsers.id, req.salonUser!.id));
    let confirmationSent = false;
    const confirmationTemplate = await getMessageTemplate("booking_confirmation");
    const confirmationMessage = renderMessage(confirmationTemplate, {
      name: appointment.name,
      date: appointment.date,
      time: appointment.time,
      service: appointment.service,
      barber: appointment.barber,
    });
    try {
      confirmationSent = await sendWhatsAppMessage(appointment.phone, confirmationMessage);
      if (confirmationSent) {
        await db.update(salonAppointments)
          .set({ confirmationSent: true, updatedAt: new Date() })
          .where(and(eq(salonAppointments.id, appointment.id), eq(salonAppointments.confirmationSent, false)));
      }
    } catch (error) {
      logger.warn({ err: error, appointmentId: appointment.id }, "Appointment confirmation WhatsApp message deferred");
    }
    const [savedAppointment] = await db.select().from(salonAppointments).where(eq(salonAppointments.id, appointment.id)).limit(1);
    res.status(201).json(mapAppointment(savedAppointment ?? { ...appointment, confirmationSent }));
  } catch (error) {
    if (error instanceof AppointmentTimeUnavailableError) {
      return res.status(error.statusCode).json({ code: error.code, message: error.message });
    }
    return next(error);
  }
});

router.post("/reviews", requireAuth, async (req, res, next) => {
  try {
    const rating = number(req.body?.rating);
    const feedback = text(req.body?.feedback).slice(0, 2000);
    const suggestion = text(req.body?.suggestion).slice(0, 2000);
    const appointmentId = text(req.body?.appointmentId) || null;
    if (rating < 1 || rating > 5) return res.status(400).json({ message: "rating must be between 1 and 5" });
    if (!feedback && !suggestion) return res.status(400).json({ message: "feedback or suggestion is required" });
    if (appointmentId) {
      const [appointment] = await db.select({ id: salonAppointments.id, phone: salonAppointments.phone })
        .from(salonAppointments)
        .where(eq(salonAppointments.id, appointmentId))
        .limit(1);
      if (!appointment || appointment.phone !== req.salonUser!.phone) {
        return res.status(403).json({ message: "review appointment access denied" });
      }
    }
    const [review] = await db.insert(salonReviews).values({
      id: id("review"),
      userId: req.salonUser!.id,
      appointmentId,
      phone: req.salonUser!.phone,
      name: req.salonUser!.name,
      rating,
      feedback,
      suggestion,
    }).returning();
    return res.status(201).json({
      id: review.id,
      name: review.name,
      rating: review.rating,
      feedback: review.feedback,
      suggestion: review.suggestion,
      status: review.status,
      createdAt: review.createdAt.toISOString(),
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/admin/reviews", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const reviews = await db.select().from(salonReviews).orderBy(desc(salonReviews.createdAt));
    return res.json(reviews.map((review) => ({
      id: review.id,
      name: review.name,
      phone: review.phone,
      appointmentId: review.appointmentId,
      rating: review.rating,
      feedback: review.feedback,
      suggestion: review.suggestion,
      status: review.status,
      createdAt: review.createdAt.toISOString(),
    })));
  } catch (error) {
    return next(error);
  }
});

router.patch("/admin/reviews/:id/status", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const status = text(req.body?.status);
    if (!["new", "reviewed", "archived"].includes(status)) {
      return res.status(400).json({ message: "invalid review status" });
    }
    const [review] = await db.update(salonReviews)
      .set({ status, updatedAt: new Date() })
      .where(eq(salonReviews.id, text(req.params.id)))
      .returning();
    if (!review) return res.status(404).json({ message: "review not found" });
    return res.json({
      id: review.id,
      name: review.name,
      phone: review.phone,
      appointmentId: review.appointmentId,
      rating: review.rating,
      feedback: review.feedback,
      suggestion: review.suggestion,
      status: review.status,
      createdAt: review.createdAt.toISOString(),
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/appointments/:id/cancel", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const appointmentId = text(req.params.id);
    const reason = text(req.body?.reason);
    const [existing] = await db.select().from(salonAppointments).where(eq(salonAppointments.id, appointmentId)).limit(1);
    if (!existing) return res.status(404).json({ message: "appointment not found" });
    if (existing.status === "cancelled") return res.status(400).json({ message: "appointment is already cancelled" });

    const [appointment] = await db.update(salonAppointments)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(salonAppointments.id, appointmentId))
      .returning();
    const normalizedPhone = normalizePhone(appointment.phone);
    const cancellationReason = reason || "ظرف طارئ في جدول الصالون";
    const message = `أهلاً ${appointment.name}، نعتذر منك، تم إلغاء موعدك المحدد بتاريخ ${appointment.date} الساعة ${appointment.time} في صالون البارون. السبب: ${cancellationReason}.`;
    let sent = false;
    try {
      sent = await sendWhatsAppMessage(normalizedPhone, message);
    } catch (error) {
      logger.warn({ err: error, appointmentId }, "Appointment cancellation WhatsApp message failed");
    }
    const whatsappUrl = normalizedPhone
      ? `https://wa.me/${normalizedPhone.replace(/^0/, "972")}?text=${encodeURIComponent(message)}`
      : "";
    return res.json({ appointment: mapAppointment(appointment), whatsappUrl, sent });
  } catch (error) {
    return next(error);
  }
});

router.get("/services", async (_req, res, next) => {
  try {
    await ensureSeeded();
    const services = await db.select().from(salonServices).orderBy(asc(salonServices.createdAt));
    res.json(services.map(mapService));
  } catch (error) {
    return next(error);
  }
});

router.post("/services", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const [service] = await db.insert(salonServices).values({ id: text(req.body?.id, id("service")), name: text(req.body?.name), description: text(req.body?.description), price: number(req.body?.price), duration: number(req.body?.duration, 30), visible: bool(req.body?.visible) }).returning();
    res.status(201).json(mapService(service));
  } catch (error) {
    return next(error);
  }
});

router.patch("/services/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const [service] = await db.update(salonServices).set({ name: text(req.body?.name), description: text(req.body?.description), price: number(req.body?.price), duration: number(req.body?.duration, 30), visible: bool(req.body?.visible), updatedAt: new Date() }).where(eq(salonServices.id, text(req.params.id))).returning();
    if (!service) return res.status(404).json({ message: "service not found" });
    res.json(mapService(service));
  } catch (error) {
    return next(error);
  }
});

router.delete("/services/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await db.delete(salonServices).where(eq(salonServices.id, text(req.params.id)));
    res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

router.get("/age-categories", async (_req, res, next) => {
  try {
    await ensureSeeded();
    const categories = await db.select().from(salonAgeCategories)
      .where(eq(salonAgeCategories.active, true))
      .orderBy(asc(salonAgeCategories.sortOrder));
    return res.json(categories.map(mapAgeCategory));
  } catch (error) {
    return next(error);
  }
});

router.post("/age-categories", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const name = text(req.body?.name);
    if (!name) return res.status(400).json({ message: "age category name is required" });
    const minAge = Math.max(0, number(req.body?.minAge));
    const maxAge = req.body?.maxAge === null || req.body?.maxAge === "" ? null : Math.max(minAge, number(req.body?.maxAge, minAge));
    const additionalMinutes = Math.max(0, number(req.body?.additionalMinutes, 25));
    const [category] = await db.insert(salonAgeCategories).values({
      id: text(req.body?.id, id("age")),
      name,
      minAge,
      maxAge,
      additionalMinutes,
      active: bool(req.body?.active),
      sortOrder: number(req.body?.sortOrder),
    }).returning();
    return res.status(201).json(mapAgeCategory(category));
  } catch (error) {
    return next(error);
  }
});

router.patch("/age-categories/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const categoryId = text(req.params.id);
    const [existing] = await db.select().from(salonAgeCategories).where(eq(salonAgeCategories.id, categoryId)).limit(1);
    if (!existing) return res.status(404).json({ message: "age category not found" });
    const minAge = req.body?.minAge === undefined ? existing.minAge : Math.max(0, number(req.body.minAge));
    const maxAge = req.body?.maxAge === undefined
      ? existing.maxAge
      : req.body.maxAge === null || req.body.maxAge === ""
        ? null
        : Math.max(minAge, number(req.body.maxAge, minAge));
    const additionalMinutes = req.body?.additionalMinutes === undefined
      ? existing.additionalMinutes ?? 25
      : Math.max(0, number(req.body.additionalMinutes, 25));
    const [category] = await db.update(salonAgeCategories).set({
      name: req.body?.name === undefined ? existing.name : text(req.body.name),
      minAge,
      maxAge,
      additionalMinutes,
      active: req.body?.active === undefined ? existing.active : bool(req.body.active),
      sortOrder: req.body?.sortOrder === undefined ? existing.sortOrder : number(req.body.sortOrder),
      updatedAt: new Date(),
    }).where(eq(salonAgeCategories.id, categoryId)).returning();
    return res.json(mapAgeCategory(category));
  } catch (error) {
    return next(error);
  }
});

router.delete("/age-categories/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await db.delete(salonAgeCategories).where(eq(salonAgeCategories.id, text(req.params.id)));
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

router.get("/products", async (_req, res, next) => {
  try {
    const products = await db.select().from(salonProducts)
      .where(eq(salonProducts.active, true))
      .orderBy(asc(salonProducts.createdAt));
    return res.json(products.map(mapProduct));
  } catch (error) {
    return next(error);
  }
});

router.post("/products", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const name = text(req.body?.name);
    if (!name) return res.status(400).json({ message: "product name is required" });
    const [product] = await db.insert(salonProducts).values({
      id: text(req.body?.id, id("product")),
      name,
      description: text(req.body?.description),
      price: Math.max(0, number(req.body?.price)),
      stock: Math.max(0, number(req.body?.stock)),
      active: bool(req.body?.active),
    }).returning();
    return res.status(201).json(mapProduct(product));
  } catch (error) {
    return next(error);
  }
});

router.patch("/products/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const productId = text(req.params.id);
    const [existing] = await db.select().from(salonProducts).where(eq(salonProducts.id, productId)).limit(1);
    if (!existing) return res.status(404).json({ message: "product not found" });
    const [product] = await db.update(salonProducts).set({
      name: req.body?.name === undefined ? existing.name : text(req.body.name),
      description: req.body?.description === undefined ? existing.description : text(req.body.description),
      price: req.body?.price === undefined ? existing.price : Math.max(0, number(req.body.price)),
      stock: req.body?.stock === undefined ? existing.stock : Math.max(0, number(req.body.stock)),
      active: req.body?.active === undefined ? existing.active : bool(req.body.active),
      updatedAt: new Date(),
    }).where(eq(salonProducts.id, productId)).returning();
    return res.json(mapProduct(product));
  } catch (error) {
    return next(error);
  }
});

router.delete("/products/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await db.delete(salonProducts).where(eq(salonProducts.id, text(req.params.id)));
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

router.get("/shop-info", async (_req, res, next) => {
  try {
    await ensureSeeded();
    const [info] = await db.select().from(salonShopInfo).where(eq(salonShopInfo.id, 1)).limit(1);
    return res.json(info ? mapShopInfo(info) : {});
  } catch (error) {
    return next(error);
  }
});

router.patch("/shop-info", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await ensureSeeded();
    const bitLink = req.body?.bitLink === undefined ? undefined : text(req.body.bitLink);
    if (bitLink) {
      try {
        const parsed = new URL(bitLink);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("unsupported protocol");
      } catch {
        return res.status(400).json({ message: "رابط Bit يجب أن يبدأ بـ http أو https" });
      }
    }
    const [info] = await db.update(salonShopInfo).set({
      shopName: req.body?.shopName === undefined ? undefined : text(req.body.shopName),
      phone: req.body?.phone === undefined ? undefined : text(req.body.phone),
      whatsapp: req.body?.whatsapp === undefined ? undefined : text(req.body.whatsapp),
      address: req.body?.address === undefined ? undefined : text(req.body.address),
      mapsUrl: req.body?.mapsUrl === undefined ? undefined : text(req.body.mapsUrl),
      instagramUrl: req.body?.instagramUrl === undefined ? undefined : text(req.body.instagramUrl),
      bitLink,
      openingHours: req.body?.openingHours === undefined ? undefined : text(req.body.openingHours),
      updatedAt: new Date(),
    }).where(eq(salonShopInfo.id, 1)).returning();
    return res.json(info ? mapShopInfo(info) : {});
  } catch (error) {
    return next(error);
  }
});

router.post("/schedule-slots", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const dayOfWeek = number(req.body?.dayOfWeek, -1);
    const time = text(req.body?.time);
    if (dayOfWeek < 0 || dayOfWeek > 6 || !isTwentyMinuteGridTime(time)) {
      return res.status(400).json({ message: "اليوم والوقت يجب أن يكونا صحيحين وعلى شبكة 20 دقيقة" });
    }
    const [slot] = await db.insert(salonScheduleSlots).values({
      id: id("schedule"),
      dayOfWeek,
      time,
      active: bool(req.body?.active),
    }).returning();
    return res.status(201).json(mapScheduleSlot(slot));
  } catch (error) {
    return next(error);
  }
});

router.patch("/schedule-slots/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const slotId = text(req.params.id);
    const [existing] = await db.select().from(salonScheduleSlots).where(eq(salonScheduleSlots.id, slotId)).limit(1);
    if (!existing) return res.status(404).json({ message: "schedule slot not found" });
    const dayOfWeek = req.body?.dayOfWeek === undefined ? existing.dayOfWeek : number(req.body.dayOfWeek, -1);
    const time = req.body?.time === undefined ? existing.time : text(req.body.time);
    const active = req.body?.active === undefined ? existing.active : bool(req.body.active);
     if (dayOfWeek < 0 || dayOfWeek > 6 || !isTwentyMinuteGridTime(time)) {
       return res.status(400).json({ message: "اليوم والوقت يجب أن يكونا صحيحين وعلى شبكة 20 دقيقة" });
    }
    const [slot] = await db.update(salonScheduleSlots).set({ dayOfWeek, time, active, updatedAt: new Date() }).where(eq(salonScheduleSlots.id, slotId)).returning();
    return res.json(mapScheduleSlot(slot));
  } catch (error) {
    return next(error);
  }
});

router.patch("/settings", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await ensureSeeded();
    const [settings] = await db.update(salonSettings).set({ shopOpen: bool(req.body?.shopOpen), updatedAt: new Date() }).where(eq(salonSettings.id, 1)).returning();
    res.json({ shopOpen: settings?.shopOpen ?? true });
  } catch (error) {
    next(error);
  }
});

router.get("/settings", async (_req, res, next) => {
  try {
    const [settings] = await db.select().from(salonSettings).where(eq(salonSettings.id, 1)).limit(1);
    return res.json({ shopOpen: settings?.shopOpen ?? true });
  } catch (error) {
    return next(error);
  }
});

export default router;