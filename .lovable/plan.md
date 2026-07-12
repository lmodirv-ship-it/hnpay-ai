
# خطة تطوير HN-PAY كمحرك مالي مركزي

هذه المرحلة **تحليلية فقط** كما طلبت. لا Migration ولا تعديل كود قبل موافقتك الصريحة على كل مرحلة.

---

## 1) نتائج فحص قاعدة البيانات الحالية

29 جدولاً في `public`. المصادر الرسمية المقترحة (single source of truth) والتعارضات:

| الكيان المطلوب | الجدول المرشح كمصدر رسمي | جداول متعارضة/مكررة | القرار المقترح |
|---|---|---|---|
| المشاريع | `hn_projects` | `sites`, `hn_apps`, `portfolios` | إبقاء `hn_projects` كمشروع، و`sites` كطبقة "موقع/tenant" داخل المشروع، ودمج `hn_apps` كنطاقات |
| النطاقات | `project_domains` | `sites.domain` | `project_domains` هو المصدر؛ ربطه بـ `site_id` أيضاً |
| المنتجات/الخدمات | `catalog_items` + `catalog_prices` | `products_services`, `plans`, `product_categories` | **`catalog_items/prices` هو المصدر الرسمي**؛ `products_services` legacy → deprecate بعد ترحيل البيانات؛ `plans` يبقى كـ view معين على `catalog_prices` أو يُطوى |
| الفئات | `catalog_categories` | `product_categories` | `catalog_categories` هو المصدر |
| العملاء الماليون | — (ناقص) | `customers` (خفيف) | إضافة `billing_accounts` جديد + ربط `customers` كسجل لكل site |
| الاشتراكات | `subscriptions` | `hn_subscriptions` | `subscriptions` هو المصدر، `hn_subscriptions` legacy |
| المدفوعات | `payments` | — | جيد، يحتاج حقول (tax, fee, net) |
| الفواتير | — (ناقص) | — | جدولان جديدان: `billing_invoices` + `invoice_items` |
| الاسترجاعات | — (ناقص) | — | جدول جديد `refunds` |
| مزودو الدفع | `payment_providers` | — | جيد، مكتمل تقريباً |
| مفاتيح API | `site_api_keys`, `project_api_keys` | متكرران | توحيد في `api_keys` مربوط بـ project_id + site_id اختياري |
| Webhooks | `webhook_events`, `processed_webhook_events`, `provider_events` | — | إبقاء الثلاثة + إضافة `outbound_webhooks` للأحداث الصادرة |
| ميزات الخطط | `catalog_features` | — | جيد |
| سجل النشاط | — (ناقص) | — | جدول جديد `audit_logs` |
| تسويات | — (ناقص) | — | جدول جديد `settlements` |

**تعارضات حرجة يجب حلها قبل أي شيء:**
1. ازدواج `catalog_items` ↔ `products_services` → مصدران للمنتج.
2. ازدواج `site_api_keys` ↔ `project_api_keys`.
3. ازدواج `subscriptions` ↔ `hn_subscriptions`.
4. `plans` أصبح شبه مكرر لـ `catalog_prices` بعد إضافة `catalog_price_id`.

**قرار المعمار:** طبقتان — `hn_projects` (مشروع) فوق `sites` (وحدة عزل مالية داخل المشروع، اختياريّة). كل جدول مالي يحمل `project_id` + `site_id` nullable. RLS يعتمد `project_id` أولاً.

---

## 2) نموذج التكامل الثلاثي

| النوع | الوصول | RLS | استخدام |
|---|---|---|---|
| `internal_database` | Supabase client + auth | RLS على project_id/site_id | مشاريع HN الداخلية |
| `external_api` | API keys فقط | rate-limit + scopes | مواقع خارجية |
| `hybrid` | كلاهما | كلاهما | تطبيقات موبايل HN |

يُخزَّن `integration_mode` في `hn_projects`.

---

## 3) خارطة التنفيذ على مراحل (بموافقة منفصلة لكل مرحلة)

### المرحلة 0 — التحضير (هذه المرحلة الحالية)
- ✅ تحليل المخطط.
- ✅ تحديد التعارضات.
- ⏸ في انتظار موافقتك للانتقال.

### المرحلة 1 — توحيد الأساس (Foundation Consolidation)
**Migration A:** إضافة الحقول المفقودة إلى `hn_projects` (integration_mode, environment, logo_url, mrr/arr cached, subscriptions_enabled, api_enabled, webhooks_enabled, last_seen_at).
**Migration B:** إضافة `project_id` NOT NULL إلى كل جدول مالي يفتقده، مع backfill من `site_id → sites.project_id` (بعد إضافة `sites.project_id` إن لزم).
**Migration C:** RLS موحدة تعتمد `project_id` + عضوية `user_roles`.
**Rollback:** حذف الأعمدة المُضافة + استعادة السياسات القديمة (نص SQL معدّ مسبقاً).
**بدون حذف جداول.**

### المرحلة 2 — الفواتير والاسترجاعات
- جداول جديدة: `billing_invoices`, `invoice_items`, `refunds`, `audit_logs`.
- Triggers لتحديث الفاتورة من الدفعة، وتحديث `payments.status` عند الاسترجاع.
- صفحات UI: `/admin/invoices` (استبدال العرض الحالي)، `/admin/refunds`.

### المرحلة 3 — العملاء الماليون والاشتراكات المتقدمة
- جدول `billing_accounts` (منفصل عن `customers` الذي يبقى per-site).
- تحديث `subscriptions` بحقول: trial, renewal_attempts, cancel_reason, next_billing_at.
- Cron job (pg_cron) للتذكيرات (7/3/1 يوم) والتجديد التلقائي وretry policy.
- Deprecate `hn_subscriptions` بعد ترحيل بياناته.

### المرحلة 4 — التسويات والتقارير
- جدول `settlements`.
- Views مادية للتقارير: MRR/ARR/LTV/Churn/Cohort.
- صفحة `/admin/reports` بفلاتر project+date + CSV/JSON export.
- Cron أسبوعي/شهري.

### المرحلة 5 — API v1 وWebhooks الصادرة
- توحيد `api_keys` (استبدال `site_api_keys` + `project_api_keys` بـ view للتوافق).
- Routes تحت `/api/public/v1/*` (موجود جزئياً — توسيع).
- جدول `outbound_webhooks` + HMAC + retry backoff + سجل كامل.
- Rate limiting via edge middleware.

### المرحلة 6 — طبقة الأمان والذكاء الاصطناعي
- MFA للعمليات الحساسة (refund, key rotation).
- `audit_logs` triggers على كل الجداول المالية.
- AI Services Registry + أعمدة `ai_enabled/ai_actions` على `catalog_items` و`hn_projects`.
- تعزيز أدوار: `finance_manager`, `accountant`, `security_auditor`, `viewer`, `support_agent`.

### المرحلة 7 — إعادة تنظيم لوحة التحكم
تنظيم `/admin/*` وفق القائمة التي طلبتها:
```
الرئيسية → /admin
المشاريع → /admin/projects
النطاقات → /admin/domains
الكتالوج → /admin/catalog
الأسعار → /admin/plans
العملاء → /admin/billing-accounts
الاشتراكات → /admin/subscriptions
جلسات الدفع → /admin/checkouts
المدفوعات → /admin/payments
الفواتير → /admin/invoices
الاسترجاعات → /admin/refunds
مزودو الدفع → /admin/providers
التسويات → /admin/settlements
التقارير → /admin/reports
API → /admin/api-keys
Webhooks → /admin/webhooks
الأدوار → /admin/team
الأمان → /admin/security
النشاط → /admin/activity
```
كل صفحة: server pagination + filters + real data + empty/loading/error states.

### المرحلة 8 — Deprecation المتحكم به
بعد استقرار كل ما سبق ومرور فترة قراءة مزدوجة:
- إفراغ `products_services` بعد ترحيل نهائي إلى `catalog_items`.
- إفراغ `hn_subscriptions`.
- إفراغ `plans` أو تحويله إلى `VIEW` فوق `catalog_prices`.
- توحيد `api_keys`.

---

## 4) قواعد التنفيذ الملزَمة

- كل Migration تُعرض **نصاً كاملاً** مع Rollback SQL قبل التنفيذ.
- لا `DROP TABLE` قبل مرحلة 8، ولا بدون فترة قراءة مزدوجة.
- لا استخدام `service_role` في الواجهة (تم فحصه — الاستخدامات الحالية في `.server.ts` فقط، جيد).
- كل جدول جديد يحصل على: `GRANT` → `ENABLE RLS` → `POLICIES` → `updated_at trigger`.
- بادئة `hnpay_` **لن** تُستخدم لأن الجداول الحالية غير متعارضة داخل نفس الـ schema؛ نحافظ على الأسماء الحالية لتجنّب كسر الكود. الجداول الجديدة تأخذ أسماء واضحة (`billing_invoices`, `refunds`, `settlements`, `audit_logs`, `outbound_webhooks`, `billing_accounts`).

---

## 5) ما أحتاج موافقتك عليه الآن

1. **الموافقة على المصادر الرسمية** في الجدول أعلاه (خصوصاً: `catalog_items` بدل `products_services`، و`subscriptions` بدل `hn_subscriptions`).
2. **الموافقة على معمار طبقتين**: `hn_projects` (مشروع) + `sites` (وحدة داخلية اختيارية).
3. **الموافقة على البدء بالمرحلة 1 فقط** (Foundation Consolidation) — سأعود لك بنص Migration كامل + Rollback قبل التنفيذ.

عند موافقتك، أنتقل لصياغة Migration المرحلة 1 كاملاً وأعرضه عليك قبل أي تنفيذ.
