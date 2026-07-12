
## تشخيص الوضع الحالي

بعد فحص القاعدة (29 جدولًا) واستعراض الكود، هذه هي الحقائق الحرجة:

| المجال | الحالة | الملاحظة |
|---|---|---|
| `hn_projects` | 18 صف | المصدر الفعلي "للمواقع" حاليًا |
| `products_services` | 152 صف | كتالوج قديم مستخدَم فعليًا |
| `sites` | **0** | البنية الجديدة (RLS + api keys + domains) لكنها فارغة |
| `catalog_items / catalog_prices / plans` | **0** | البنية الاحترافية الجديدة — غير مستخدمة |
| `customers / subscriptions / payments / checkout_sessions` | **0** | لا حركة تجارية |
| `payment_providers` | **0** | لم يُفعَّل أي مزوّد |
| `profiles / user_roles` | 1 / 3 | مالك واحد فقط |

### المشكلة الجوهرية
يوجد **نظامان متوازيان للكتالوج** (القديم `products_services` المرتبط بـ`hn_projects`، والجديد `catalog_items → catalog_prices → plans` المرتبط بـ`sites`). الواجهة تعرض القديم، والـRLS الجديدة والـEdge/Server Functions تعتمد على الجديد. النتيجة: أزرار كثيرة لا تكتب في المكان الصحيح، والمشتريات مستحيلة لأن `payment_providers` و`sites` فارغتان.

---

## خطة تطوير جادة — 6 مراحل

### المرحلة 1 — توحيد نموذج البيانات (Foundation)
**الهدف:** مصدر حقيقة واحد للكتالوج.
- ترحيل (migration) يملأ `sites` من `hn_projects` (صف لكل مشروع) مع ربط `hn_projects.site_id`.
- ترحيل يحوّل `products_services` (152) إلى `catalog_items` + سعر افتراضي في `catalog_prices` مع الحفاظ على `legacy_id`.
- إبقاء `products_services` كـView للقراءة فقط للتوافق العكسي لأسبوع، ثم حذفه.
- إضافة `owner_user_id` و`site_id` واضحة في كل جدول تجاري.

### المرحلة 2 — الأدوار والصلاحيات الفعلية (RBAC)
**الهدف:** تفعيل الأدوار المذكورة سابقًا فعليًا في القاعدة والواجهة.
- توسيع `app_role` enum: `owner, group_owner, hn_pay_admin, site_owner, site_manager, accountant, viewer, subscriber`.
- جدول `site_members(site_id, user_id, role, permissions jsonb)` + دالة `has_site_role(user_id, site_id, role)` security-definer.
- إعادة كتابة RLS لكل جدول (`catalog_items, catalog_prices, plans, subscriptions, payments, invoices, checkout_sessions, customers`) وفق `site_id` والدور.
- Endpoint عام آمن (`/api/public/v1/catalog/:siteSlug`) يقرأ فقط `status='active' AND is_public=true`.

### المرحلة 3 — مزوّدو الدفع والدورة الكاملة
**الهدف:** أول دفعة حقيقية تعمل من A→Z.
- شاشة إعداد `payment_providers` (Stripe + Manual + Mock) لكل موقع.
- Checkout الحالي (`/checkout/$sessionId`) يستخدم `catalog_prices` مباشرة.
- Webhook Stripe (`/api/public/webhooks/stripe`) يكتب في `payments` + `subscriptions` + `webhook_events` + `processed_webhook_events` (idempotency).
- Cron للتجديدات (`renewals`) وللتسويات (`settlements`).
- بوابة العميل (`/customer/portal` عبر `portal_tokens`) لإدارة الاشتراك.

### المرحلة 4 — تفعيل أزرار لوحة الإدارة (30+ صفحة)
**الهدف:** كل زر يعمل ويكتب/يقرأ بيانات حقيقية.
- قائمة تدقيق لكل صفحة `/admin/*`: (Orders, Payments, Refunds, Subscriptions, Renewals, Settlements, Invoices, Customers, Team, Roles, Api-keys, Webhooks, Providers, Notifications, Reports, Security, Activity, Support, Settings).
- كل صفحة: server function للقراءة + للتعديل + toast + optimistic update + إدخال في `activity_log` جديد.
- توحيد `AdminShell` وإضافة فلاتر/بحث/تصدير CSV.

### المرحلة 5 — واجهة المالك (Owner Experience)
- `/owner/sites` : CRUD كامل + تفعيل integration_mode (internal / external_api / hybrid) + إدارة `allowed_origins` + توليد وتدوير `site_api_keys`.
- `/owner/hn-pay/catalog` : بديل صفحة `/admin/products` كواجهة أساسية للكتالوج، مع تحرير سعر/مزايا/فئات/صور.
- `/owner/portfolios` : ربط عدة مواقع تحت محفظة واحدة مع تقارير مجمّعة.
- `/owner/users` و`/owner/roles` : دعوة، تعيين دور لكل موقع، سجل صلاحيات.

### المرحلة 6 — الجودة والمراقبة
- Zod schemas مشتركة، اختبارات vitest للـserver functions الحرجة (checkout, webhook, RLS).
- Playwright E2E: تسجيل → إنشاء موقع → إضافة منتج → checkout Stripe test → استلام webhook.
- لوحة `/admin/security` تعرض تحذيرات linter مباشرة.
- Logging مركزي (`activity_log`) + `analytics_events` + رسوم بيانية حقيقية بدلًا من المؤشرات الوهمية.
- سياسة نسخ احتياطية + توثيق `AGENTS.md` محدَّث.

---

## تسلسل تنفيذي مقترح (بالأولوية)
1. **[أساس]** ترحيل `sites` من `hn_projects` + توحيد الكتالوج (يفتح كل ما بعده).
2. **[أمان]** RBAC + RLS كاملة + endpoint عام.
3. **[إيراد]** تفعيل Stripe end-to-end مع موقع تجريبي.
4. **[منتَج]** أزرار لوحة الإدارة + شاشات المالك.
5. **[جودة]** اختبارات + مراقبة + توثيق.

## ما لن يتغيّر
- شكل `/admin/products` الحالي يبقى للعرض التحليلي، لكن التحرير ينتقل إلى `/owner/hn-pay/catalog`.
- `hn_apps` يبقى سجل تطبيقات مرجعي فقط (ليس كتالوج بيع).

---

**قبل البدء أحتاج تأكيدًا على نقطتين:**
1. هل أبدأ فورًا من المرحلة 1 (ترحيل البيانات من `products_services` و`hn_projects` إلى `sites`/`catalog_items`) أم تفضّل مراجعة تصميم الترحيل أولًا؟
2. مزوّد الدفع الأول: Stripe فقط، أم Stripe + Manual (تحويل بنكي) في نفس الدفعة؟
