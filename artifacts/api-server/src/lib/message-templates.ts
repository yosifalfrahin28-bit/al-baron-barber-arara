import { eq, inArray } from "drizzle-orm";
import { db } from "@workspace/db";
import { salonMessageTemplates } from "@workspace/db/schema";

export type MessageTemplateKey =
  | "welcome"
  | "otp"
  | "booking_confirmation"
  | "one_hour_reminder"
  | "review_request"
  | "rebooking_reminder";

export const MESSAGE_TEMPLATE_LABELS: Record<MessageTemplateKey, string> = {
  welcome: "رسالة الترحيب",
  otp: "رسالة رمز التحقق",
  booking_confirmation: "رسالة تأكيد الحجز",
  one_hour_reminder: "تذكير قبل ساعة",
  review_request: "طلب التقييم بعد الخدمة",
  rebooking_reminder: "تذكير إعادة الحجز الذكي",
};

export const DEFAULT_MESSAGE_TEMPLATES: Record<MessageTemplateKey, string> = {
  welcome: "أهلاً {{name}}، أهلاً بك في صالون البارون. تم إنشاء حسابك بنجاح ويمكنك الآن حجز دورك أو موعدك من التطبيق.",
  otp: "رمز التحقق الخاص بمتجر البارون هو: {{code}}\nصالح لمدة 5 دقائق.",
  booking_confirmation: "أهلاً {{name}}، تم تأكيد حجزك في صالون البارون.\nالتاريخ: {{date}}\nالوقت: {{time}}\nالخدمة: {{service}}\nالحلاق: {{barber}}",
  one_hour_reminder: "أهلاً {{name}}، نذكّرك بأن موعدك في صالون البارون سيكون بعد ساعة تقريباً.\nالتاريخ: {{date}}\nالوقت: {{time}}\nالخدمة: {{service}}\nإذا لم تتمكن من الحضور، يرجى إلغاء موعدك عبر التطبيق لتجنب تلقي مخالفة أو تحذير.\nIf you cannot attend, please cancel your appointment via the app to avoid receiving a strike/warning.",
  review_request: "أهلاً {{name}}، نأمل أن تكون استمتعت بخدمتك في صالون البارون.\nنرجو فتح التطبيق وتقييم تجربتك، فملاحظتك تهمنا وتساعدنا على تقديم خدمة أفضل.",
  rebooking_reminder: "أهلاً {{name}}، يبدو أن موعد زيارتك القادمة لصالون البارون قد اقترب.\nمرّ تقريباً {{intervalWeeks}} أسبوعاً منذ زيارتك الأخيرة. احجز موعدك القادم من التطبيق الآن.",
};

export async function seedMessageTemplates() {
  const keys = Object.keys(DEFAULT_MESSAGE_TEMPLATES) as MessageTemplateKey[];
  const existing = await db.select({ templateKey: salonMessageTemplates.templateKey })
    .from(salonMessageTemplates)
    .where(inArray(salonMessageTemplates.templateKey, keys));
  const existingKeys = new Set(existing.map((item) => item.templateKey));
  const missing = keys
    .filter((templateKey) => !existingKeys.has(templateKey))
    .map((templateKey) => ({
      id: `template_${templateKey}`,
      templateKey,
      body: DEFAULT_MESSAGE_TEMPLATES[templateKey],
    }));
  if (missing.length > 0) await db.insert(salonMessageTemplates).values(missing);
}

export async function getMessageTemplate(templateKey: MessageTemplateKey) {
  try {
    const [template] = await db.select({ body: salonMessageTemplates.body })
      .from(salonMessageTemplates)
      .where(eq(salonMessageTemplates.templateKey, templateKey))
      .limit(1);
    return template?.body ?? DEFAULT_MESSAGE_TEMPLATES[templateKey];
  } catch {
    return DEFAULT_MESSAGE_TEMPLATES[templateKey];
  }
}

export function renderMessage(template: string, values: Record<string, string | number | undefined>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => String(values[key] ?? ""));
}