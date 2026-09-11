import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const salonUsers = pgTable(
  "salon_users",
  {
    id: text("id").primaryKey(),
    phone: text("phone").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash"),
    note: text("note").notNull().default(""),
    role: text("role").notNull().default("client"),
    /** Legacy compatibility column; isBanned is the application source of truth. */
    banned: boolean("banned").notNull().default(false),
    isBanned: boolean("is_banned").notNull().default(false),
    banReason: text("ban_reason").notNull().default(""),
    bookingRestricted: boolean("booking_restricted").notNull().default(false),
    accountNotice: text("account_notice").notNull().default(""),
    lastRebookingReminderAt: timestamp("last_rebooking_reminder_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    phoneIndex: uniqueIndex("salon_users_phone_idx").on(table.phone),
  }),
);

export const salonAuthChallenges = pgTable("salon_auth_challenges", {
  id: text("id").primaryKey(),
  phone: text("phone").notNull(),
  name: text("name").notNull(),
  passwordHash: text("password_hash"),
  provider: text("provider").notNull().default("whatsapp"),
  devCodeHash: text("dev_code_hash"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  attempts: integer("attempts").notNull().default(0),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const salonWhatsappAuthFiles = pgTable("salon_whatsapp_auth_files", {
  path: text("path").primaryKey(),
  content: text("content").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const salonAuthSessions = pgTable("salon_auth_sessions", {
  id: text("id").primaryKey(),
  phone: text("phone").notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tokenHashIndex: uniqueIndex("salon_auth_sessions_token_hash_idx").on(table.tokenHash),
}));

export const salonBroadcasts = pgTable("salon_broadcasts", {
  id: text("id").primaryKey(),
  message: text("message").notNull(),
  recipientCount: integer("recipient_count").notNull(),
  status: text("status").notNull().default("links_ready"),
  createdByPhone: text("created_by_phone").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const salonBroadcastRecipients = pgTable("salon_broadcast_recipients", {
  id: text("id").primaryKey(),
  broadcastId: text("broadcast_id").notNull(),
  phone: text("phone").notNull(),
  name: text("name").notNull(),
  status: text("status").notNull().default("link_ready"),
  clickToChatUrl: text("click_to_chat_url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const salonMessageTemplates = pgTable("salon_message_templates", {
  id: text("id").primaryKey(),
  templateKey: text("template_key").notNull(),
  body: text("body").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  templateKeyIndex: uniqueIndex("salon_message_templates_key_idx").on(table.templateKey),
}));

export const salonReviews = pgTable("salon_reviews", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  appointmentId: text("appointment_id"),
  phone: text("phone").notNull(),
  name: text("name").notNull(),
  rating: integer("rating").notNull(),
  feedback: text("feedback").notNull().default(""),
  suggestion: text("suggestion").notNull().default(""),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const salonServices = pgTable("salon_services", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  price: integer("price").notNull(),
  duration: integer("duration").notNull(),
  visible: boolean("visible").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const salonAgeCategories = pgTable("salon_age_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  minAge: integer("min_age").notNull().default(0),
  maxAge: integer("max_age"),
  additionalMinutes: integer("additional_minutes"),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const salonProducts = pgTable("salon_products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  price: integer("price").notNull().default(0),
  stock: integer("stock").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const salonShopInfo = pgTable("salon_shop_info", {
  id: integer("id").primaryKey(),
  shopName: text("shop_name").notNull().default("صالون البارون"),
  phone: text("phone").notNull().default(""),
  whatsapp: text("whatsapp").notNull().default(""),
  address: text("address").notNull().default(""),
  mapsUrl: text("maps_url").notNull().default(""),
  instagramUrl: text("instagram_url").notNull().default(""),
  bitLink: text("bit_link").notNull().default(""),
  openingHours: text("opening_hours").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const salonBarbers = pgTable("salon_barbers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  photoPath: text("photo_path"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const salonTickets = pgTable("salon_tickets", {
  id: text("id").primaryKey(),
  number: integer("number").notNull(),
  userId: text("user_id"),
  name: text("name").notNull(),
  phone: text("phone").notNull().default(""),
  barber: text("barber").notNull(),
  service: text("service").notNull(),
  ageCategory: text("age_category").notNull().default("بالغ"),
  guestCount: integer("guest_count").notNull().default(1),
  participantCategories: text("participant_categories").notNull().default("[\"بالغون\"]"),
  paymentMethod: text("payment_method").notNull().default("bit"),
  status: text("status").notNull().default("waiting"),
  reminderSent: boolean("reminder_sent").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const salonAppointments = pgTable("salon_appointments", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  date: text("date").notNull(),
  time: text("time").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull().default(""),
  barber: text("barber").notNull(),
  service: text("service").notNull(),
  ageCategory: text("age_category").notNull().default("بالغ"),
  guestCount: integer("guest_count").notNull().default(1),
  participantCategories: text("participant_categories").notNull().default("[\"بالغون\"]"),
  paymentMethod: text("payment_method").notNull().default("bit"),
  status: text("status").notNull().default("confirmed"),
  confirmationSent: boolean("confirmation_sent").notNull().default(false),
  reminderSent: boolean("reminder_sent").notNull().default(false),
  reminderOneHourSent: boolean("reminder_one_hour_sent").notNull().default(false),
  reminderTwentyMinuteSent: boolean("reminder_twenty_minute_sent").notNull().default(false),
  reviewRequestSent: boolean("review_request_sent").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const salonScheduleSlots = pgTable("salon_schedule_slots", {
  id: text("id").primaryKey(),
  dayOfWeek: integer("day_of_week").notNull(),
  time: text("time").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  dayTimeIndex: uniqueIndex("salon_schedule_slots_day_time_idx").on(table.dayOfWeek, table.time),
}));

export const salonSettings = pgTable("salon_settings", {
  id: integer("id").primaryKey(),
  shopOpen: boolean("shop_open").notNull().default(true),
  firstAdminClaimed: boolean("first_admin_claimed").notNull().default(false),
  servicesSeeded: boolean("services_seeded").notNull().default(false),
  showDurationToCustomers: boolean("show_duration_to_customers").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});