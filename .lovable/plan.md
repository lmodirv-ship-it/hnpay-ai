# خطة إكمال HN-PAY

## الوضع الحالي (ما تم بناؤه فعلاً)

| المكوّن | الحالة |
|---|---|
| Checkout API (`POST /api/public/v1/checkout-sessions`) | ✅ موجود |
| Developer API Keys (`sk_live_*` + hashing + إدارة UI) | ✅ موجود |
| صفحة الدفع `/checkout/:sessionId` | ✅ موجودة لكن **وهمية** — تحاكي النجاح بدون معالج بطاقات حقيقي |
| Webhooks صادرة موقّعة (HMAC) | ✅ موجودة لكنها لا تُطلق إلا من الوضع الوهمي |
| جداول Subscriptions + Payments + Customers | ✅ موجودة |
| Subscription API | ❌ غير موجود |
| Customer Portal | ❌ غير موجود |
| معالج دفعات حقيقي (Stripe/Paddle) | ❌ غير موجود — **السبب الرئيسي لعدم استلامك أي سنت** |

## المرحلة 1 — تفعيل معالج دفعات حقيقي (الأهم)

بدون هذا الجزء تبقى كل الطبقات مجرد واجهات. سأشغّل `recommend_payment_provider` لاختيار Paddle أو Stripe المناسب لطبيعة HN-PAY (SaaS B2B متعدد المستأجرين لـ 149 تطبيقاً). التوصية غالباً ستكون **Stripe مع Managed Payments** لأنه يدعم subscription infrastructure عميقاً ويسمح بـ multi-tenant حيث أنت (المالك) تستقبل الأموال ثم توزّعها.

بعد التفعيل:
- استبدال نموذج البطاقة الوهمي في `/checkout/:sessionId` بـ **Stripe Elements** آمن (PCI-compliant).
- إنشاء منتجات وأسعار Stripe مطابقة لجدول `plans`.

## المرحلة 2 — Inbound Webhook (Stripe → HN-PAY)

مسار جديد: `POST /api/public/webhooks/stripe`
- التحقق من `Stripe-Signature` (HMAC).
- معالجة أحداث: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`.
- تحديث `payments` + `subscriptions` + تصفير Idempotency عبر `processed_webhook_events`.
- إطلاق **outbound webhook** الموقّع إلى موقع العميل (`payment.succeeded`, `subscription.activated`, `subscription.canceled`).

## المرحلة 3 — Subscription API (للمواقع الخارجية)

نقاط نهاية جديدة تحت `/api/public/v1/`:

| Method | Path | الوظيفة |
|---|---|---|
| GET | `/subscriptions/:id` | جلب حالة اشتراك |
| GET | `/customers/:external_id/subscriptions` | كل اشتراكات عميل |
| POST | `/subscriptions/:id/cancel` | إلغاء (فوري أو نهاية الفترة) |
| POST | `/subscriptions/:id/resume` | استئناف قبل انتهاء الفترة |
| POST | `/customer-portal-sessions` | إنشاء رابط بوابة العميل |

كلها تتحقق من `sk_live_*` وتقيّد الوصول لبيانات نفس الـ `site_id` فقط.

## المرحلة 4 — Customer Portal (واجهة نهائية للعميل)

مسار عام مؤقت: `/portal/:token` (توكن قصير الأمد صالح 30 دقيقة، يُنشأ عبر Subscription API).

يعرض للعميل:
- اشتراكاته النشطة عبر جميع مواقعك (خيار: عرض فقط اشتراكات الموقع الذي أنشأ الرابط).
- تغيير خطة / ترقية / تخفيض.
- تحديث وسيلة الدفع (عبر Stripe Billing Portal مدمج).
- تنزيل الفواتير.
- إلغاء الاشتراك.

بتصميم Obsidian/Gold المطابق للمشروع + دعم AR/EN.

## المرحلة 5 — تحسينات Owner Console

- **صفحة Revenue**: MRR/ARR فعلي من `subscriptions` + `payments`، مقسّم لكل موقع.
- **Payout Splits** (اختياري): تحديد نسبة عمولة HN لكل موقع، وإنشاء تقارير تحويل شهرية.
- **Webhook Retry Console**: إعادة إرسال يدوي لأي حدث فاشل.

## القسم التقني

**الأمان**
- كل API عام تحت `/api/public/*` (يتجاوز auth wall).
- المفاتيح تُخزن SHA-256 hash فقط + عرض prefix.
- HMAC-SHA256 على كل الـ webhooks الواردة والصادرة.
- Idempotency-Key header اختياري على `POST /checkout-sessions` لمنع التكرار.
- Rate limit مبني على `site_id` (اختياري في phase لاحق).

**قاعدة البيانات — تعديلات مطلوبة**
- إضافة `stripe_customer_id`, `stripe_subscription_id`, `stripe_price_id` لجداول `customers`, `subscriptions`, `plans`.
- جدول جديد `portal_tokens (token, subscription_id, expires_at)`.
- عمود `stripe_event_id` في `processed_webhook_events` للـ idempotency.

**البنية**
- Server functions مصادَق عليها للـ Owner UI.
- Server routes عامة (`api/public/*`) للـ APIs الخارجية.
- التوقيع/التشفير في `src/lib/hn-pay/crypto.server.ts` (موجود).
- منطق Stripe في `src/lib/hn-pay/stripe.server.ts` (جديد).

## ترتيب التنفيذ

1. اختيار المعالج (Stripe/Paddle) → التفعيل.
2. Inbound webhook + استبدال checkout الوهمي.
3. Subscription API.
4. Customer Portal.
5. تحسينات Owner Console.

**سؤال قبل البدء**: هل تريد **Stripe** (الأنسب لـ SaaS متعدد المستأجرين وتخصيص كامل) أم **Paddle** (Merchant of Record — يتكفّل بالضرائب والامتثال العالمي مقابل عمولة أعلى)؟ إذا لم تحدد، سأشغّل أداة التوصية وأختار الأنسب تلقائياً.
