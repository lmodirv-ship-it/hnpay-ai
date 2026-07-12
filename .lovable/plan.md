# حزمة مراجعة المرحلة الأولى — Foundation Consolidation

> ⚠️ ملاحظة صريحة قبل المراجعة
> بناءً على تفويض سابق ("نفّذ تلقائيًا")، تم تشغيل مهاجرتين قبل رسالتك الأخيرة:
> 1. توسيع enum `app_role` بإضافة: `finance_manager`, `hn_pay_admin`, `group_owner`, `project_owner`, `project_manager`, `support_agent`, `security_auditor`.
> 2. توسيع `hn_projects` بأعمدة تشغيلية + إضافة `project_id` إلى 8 جداول مالية + Backfill + إنشاء `user_can_access_project(uuid)` + إنشاء الجداول: `billing_invoices`, `invoice_items`, `refunds`, `audit_logs`, `settlements`.
>
> جميع العمليات كانت **مضافة (Additive) فقط** ولا يوجد DROP ولا فقد بيانات ولا تعديل أعمدة قائمة. الفقرة **10 (Rollback)** في هذا التقرير تسرد SQL كامل للتراجع إن رغبت. ما لم يُنفَّذ بعد: توحيد سياسات RLS، NOT NULL على project_id، توحيد api_keys، ترحيل products_services و hn_subscriptions.

---

## 1) تقرير حالة `hn_projects`

18 سجلًا. الأعمدة الحالية (بعد المرحلة السابقة):
| العمود | النوع | Nullable | افتراضي |
|---|---|---|---|
| id, name, code, category, primary_domain, status, owner_id, default_currency, default_provider_id, brand_color, description, created_by, created_at, updated_at | (كما هو) | — | — |
| integration_mode | text | NO | `'internal_database'` (CHECK: internal_database/external_api/hybrid) |
| environment | text | NO | `'live'` (CHECK: test/live) |
| project_type | text | YES | — |
| logo_url | text | YES | — |
| payments_enabled | bool | NO | true |
| subscriptions_enabled | bool | NO | true |
| invoices_enabled | bool | NO | true |
| api_enabled | bool | NO | false |
| webhooks_enabled | bool | NO | false |
| mrr_cached | numeric | NO | 0 |
| arr_cached | numeric | NO | 0 |
| connection_status | text | NO | `'unknown'` (CHECK: unknown/connected/degraded/offline) |
| last_seen_at | timestamptz | YES | — |

**ملاحظة على مخاوفك:** `mrr_cached` / `arr_cached` أُضيفت كـ **Cache صريحة** (اسمها يوضح ذلك). المصدر المالي الرسمي لاحقًا سيكون Views محسوبة من `payments` و `subscriptions`. أقترح إضافة عمود `financial_metrics_updated_at` وإزالة كون `mrr/arr_cached` NOT NULL. سأقترح ذلك في مرحلة تصحيحية 1B (فقرة 9).

`status` الحالي `text NOT NULL DEFAULT 'active'` بلا CHECK. **مقترح:** إضافة CHECK `IN ('draft','active','suspended','archived')` في 1B مع Backfill: أي قيمة غير مطابقة → `'active'`.

---

## 2) تقرير حالة `sites` وعلاقته بالمشاريع

- `sites.project_id` **موجود بالفعل** ومملوء 100% (18/18).
- 0 مواقع بلا مشروع → لا حاجة لربط يدوي.
- `sites` يحمل: slug, name, domain, portfolio_id, environment, integration_mode, api_enabled, webhook_enabled, database_access, allowed_origins, last_connection_at, integration_status, default_provider_id, is_internal.
- العلاقة المؤكدة: `hn_projects (1) → sites (N) → بيانات مالية (N) عبر site_id + project_id`.

**لا حاجة لتغيير في `sites`** في المرحلة الأولى.

---

## 3) الجداول المالية وحاجتها لـ project_id

| الجدول | project_id قبل | project_id بعد Backfill | ملاحظة |
|---|---|---|---|
| catalog_categories | مفقود | ✅ مُضاف + مملوء 18/18 | آمن |
| catalog_items | مفقود | ✅ مُضاف + مملوء 100/100 | آمن |
| catalog_prices | مفقود | ✅ مُضاف + مملوء 100/100 | آمن |
| catalog_item_providers | مفقود | ✅ مُضاف (0 سجلات) | آمن |
| payment_providers | مفقود | ✅ مُضاف (0 سجلات) | آمن |
| webhook_events | مفقود | ✅ مُضاف (0 سجلات) | آمن |
| site_api_keys | مفقود | ✅ مُضاف (0 سجلات) | آمن |
| portal_tokens | مفقود | ✅ مُضاف (0 سجلات) | آمن |
| customers | موجود سابقًا | 0/0 | — |
| checkout_sessions | موجود سابقًا | 0/0 | — |
| payments | موجود سابقًا | 0/0 | — |
| subscriptions | موجود سابقًا | 0/0 | — |
| plans | موجود سابقًا | 0/0 | — |
| product_categories | موجود سابقًا | 0/0 | Legacy |
| products_services | موجود سابقًا | 0/0 | Legacy |

**السجلات غير القابلة للربط تلقائيًا: صفر.**

`NOT NULL` على `project_id` لم يُطبَّق. مقترح لمرحلة 1B بعد موافقتك:
```sql
-- بعد التأكد أن missing = 0 لكل جدول
ALTER TABLE public.catalog_items      ALTER COLUMN project_id SET NOT NULL;
ALTER TABLE public.catalog_prices     ALTER COLUMN project_id SET NOT NULL;
ALTER TABLE public.catalog_categories ALTER COLUMN project_id SET NOT NULL;
-- الباقي (بيانات مستقبلية فقط) نتركه nullable حتى يُملأ أول سجل فعلي
```

---

## 4) عدد السجلات الحالية (لقطة)

```
hn_projects            18   sites                 18   project_domains       100
catalog_categories     18   catalog_items        100   catalog_prices        100
catalog_features        0   catalog_item_providers 0   plans                   0
products_services       0   product_categories     0   customers               0
checkout_sessions       0   payments               0   subscriptions           0
hn_subscriptions        0   payment_providers      0   site_api_keys           0
project_api_keys        0   webhook_events         0   portal_tokens           0
billing_invoices        0   invoice_items          0   refunds                 0
audit_logs              0   settlements            0
```

كل الجداول المُنشأة حديثًا فارغة. أي DROP لها = صفر خطر على البيانات.

---

## 5) خطة Backfill (اكتملت بالفعل)

كل جدول أُضيف له `project_id` تلقائيًا:
```sql
UPDATE public.<table> t
SET project_id = s.project_id
FROM public.sites s
WHERE t.site_id = s.id AND t.project_id IS NULL;
```
النتيجة: 0 سجلات متبقية بلا مشروع في كل جدول.

---

## 6) `subscriptions` vs `hn_subscriptions` — تقرير مقارنة

| # | subscriptions (18 عمود) | hn_subscriptions (9 عمود) |
|---|---|---|
| مفتاح | id | id |
| ربط المستخدم | customer_id → customers | user_id → auth.users |
| ربط الخطة | plan_id | plan (text) |
| ربط التطبيق | site_id / project_id / domain_id | app_id (text) |
| الحالة | status | status |
| الفترة | current_period_start/end, cancel_at_period_end, canceled_at | renews_at |
| Cache | metadata, provider_*, public_id | quota, used |

- عدد السجلات: 0 و 0 → **لا سجلات مكررة**، ولا حاجة لمفتاح مطابقة الآن.
- عند وجود بيانات لاحقًا، المطابقة المقترحة: `(user_id → customers.external_id) × (app_id → hn_projects.code) × (plan → catalog_prices.price_code)`.
- **قرار المرحلة الأولى: لا ترحيل، لا Deprecation.** `hn_subscriptions` يبقى كما هو حتى مرحلة لاحقة مع Migration Idempotent.

---

## 7) `site_api_keys` vs `project_api_keys` — تقرير

| العمود | site_api_keys | project_api_keys |
|---|---|---|
| مفتاح الملكية | site_id | project_id |
| النموذج | مفتاح رمزي (key_hash + prefix) بوضع sandbox/live | زوج publishable+secret hash |
| الأعمدة | id, site_id, project_id, label, key_prefix, key_hash, mode, last_used_at, revoked_at, created_at | id, project_id, public_key, secret_key_hash, environment, status, label, last_used_at, created_at, updated_at |
| السجلات النشطة | 0 | 0 |
| الاستخدام في الكود | كثيف (checkout API, admin/api-keys, admin/security, sites.functions, admin-actions) | لا استخدام فعلي في src/ |

**الاستخدام الفعلي:**
- `site_api_keys`: يُستخدم في مصادقة API العامة `/api/public/v1/checkout-sessions*` وواجهة `/admin/api-keys` و `sites.functions.ts` (create/revoke/list).
- `project_api_keys`: لا مراجع فعلية في الكود (تم إنشاؤه سابقًا ولم يُوصَل).

**نموذج موحد مقترح (لاحقًا فقط):**
```
api_keys(id, project_id NOT NULL, site_id NULL, label, key_prefix, key_hash,
         mode/environment, scopes text[], rate_limit_per_min int,
         allowed_origins text[], allowed_ips inet[], last_used_at, revoked_at,
         created_by, created_at, updated_at)
```
+ View باسم `site_api_keys_v` للتوافق العكسي بنفس أعمدة القديم.

**قرار المرحلة الأولى: لا توحيد، لا حذف. فقط توثيق.**

---

## 8) خريطة استخدام الكود مقابل المصادر الرسمية

| الملف | جدول قديم/رسمي | نوع العمليات | المصدر الرسمي المستقبلي | يتكسر بعد التغيير؟ |
|---|---|---|---|---|
| `src/lib/hn-pay/catalog-central.functions.ts` | catalog_items, catalog_prices, catalog_categories, plans, subscriptions | SELECT/INSERT/UPDATE/DELETE | نفسها (رسمية) | لا |
| `src/lib/hn-pay/catalog.functions.ts` | **products_services**, product_categories | SELECT/INSERT/UPDATE/DELETE | catalog_items/prices | نعم — يحتاج ترحيل قبل الإيقاف |
| `src/routes/_authenticated/admin/products.tsx` | **products_services** | SELECT | catalog_items | نعم |
| `src/routes/_authenticated/admin/plans.tsx` | plans | SELECT | catalog_prices (VIEW لاحق) | لا (باستخدام VIEW توافق) |
| `src/lib/hn-pay/offers.functions.ts` | plans | SELECT/INSERT/UPDATE | catalog_prices | لا (VIEW توافق) |
| `src/lib/hn-pay/sites.functions.ts` | plans, site_api_keys | RW | catalog_prices, api_keys | لا |
| `src/lib/hn-pay/categories.functions.ts` | products_services, product_categories, plans | SELECT | catalog_items, catalog_categories | نعم |
| `src/lib/hn-pay/financial-projects.functions.ts` | products_services | SELECT | catalog_items | نعم |
| `src/lib/hn-pay/settlement.server.ts` | plans, subscriptions | SELECT/UPDATE | catalog_prices, subscriptions | لا |
| `src/routes/checkout.$sessionId.tsx` | plans | SELECT | catalog_prices/plans view | لا |
| `src/routes/pay/embed.$sessionId.tsx` | plans | SELECT | نفس | لا |
| `src/routes/api/public/v1/checkout-sessions.ts` | plans, site_api_keys | SELECT | catalog_prices, api_keys | لا |
| `src/routes/api/public/v1/checkout-sessions.$sessionId.ts` | site_api_keys, subscriptions | RW | api_keys, subscriptions | لا |
| `src/routes/_authenticated/admin/api-keys.tsx` | site_api_keys | SELECT/DELETE | api_keys | لا |
| `src/routes/_authenticated/admin/security.tsx` | site_api_keys | SELECT | api_keys | لا |
| `src/lib/hn-pay/admin-actions.functions.ts` | site_api_keys, subscriptions | RW | api_keys, subscriptions | لا |
| `src/routes/_authenticated/owner/dashboard.tsx` | hn_subscriptions | SELECT | subscriptions | نعم (مستقبلًا) |
| `src/routes/_authenticated/user.dashboard.tsx` | hn_subscriptions | SELECT | subscriptions | نعم (مستقبلًا) |
| `src/routes/_authenticated/admin/index.tsx` | plans, subscriptions | SELECT | catalog_prices/subscriptions | لا |
| `src/routes/_authenticated/admin/renewals.tsx`, `notifications.tsx`, `subscriptions.tsx` | subscriptions | SELECT | subscriptions | لا |

**الاستنتاج:**
- الكتابة على `products_services` و `hn_subscriptions` **تُترك مفعّلة** خلال الفترة الانتقالية.
- عند تفعيل قراءة مزدوجة لاحقًا سنضيف Trigger لمزامنة `products_services → catalog_items` (ليس الآن).

---

## 9) السياسات الحالية vs المقترحة (RLS)

**السياسات على `catalog_items` حاليًا** (نموذج ممثِّل):
- `cat_items_public_read` (SELECT, anon+authenticated) — `is_active AND is_public`
- `cat_items_staff_all` (ALL, authenticated) — `is_owner OR is_hnpay_staff OR site_is_project_member(site_id)`
- `catalog_items_lock_site_change` (via trigger)
- `catalog_items_select/insert/update/delete` — site-based
- `catalog_items_delete_block_when_used` (via trigger)

**السياسات المقترحة لاحقًا (مرحلة منفصلة):** إضافة **بجانب** القائمة، لا استبدال:
```sql
CREATE POLICY "cat_items_project_managers" ON public.catalog_items
  FOR ALL TO authenticated
  USING (
    public.user_can_access_project(project_id) AND
    EXISTS (SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role::text IN ('owner','admin','finance_manager','hn_pay_admin','group_owner','project_owner','project_manager'))
  )
  WITH CHECK (same);
```
**لن نُدرج هذا الآن.** الاستبدال الحقيقي للسياسات القديمة يتم في مرحلة RLS منفصلة، بعد اختبار كل دور.

**الأدوار وسلوكها المتوقع:**
| الدور | المشاريع المتاحة | الكتابة | القراءة الحساسة |
|---|---|---|---|
| owner / group_owner | كل المشاريع | نعم | نعم |
| admin / hn_pay_admin | كل المشاريع | نعم | نعم |
| finance_manager | مشاريع مخصصة | مالي فقط | مالي |
| accountant | مشاريع مخصصة | لا (READ+INSERT فواتير) | مالي |
| project_owner | مشروعه فقط | نعم داخله | نعم داخله |
| project_manager | مشروعه فقط | نعم داخله (بلا مفاتيح) | جزئي |
| support_agent | مشروعه | لا | العملاء/الطلبات |
| security_auditor | كل شيء | لا | audit_logs |
| viewer | مخصص | لا | مخصص |

**ملاحظة أمان:** جميع سياسات `write_managers` الجديدة تعتمد على `user_roles.role` بدون قيد `project_id`. **مقترح لاحقًا** إضافة جدول `project_members(user_id, project_id, role)` لتحقيق حصر `finance_manager` و `project_manager` بالمشاريع المصرح بها فعليًا (بدلًا من دور عام).

---

## 10) Rollback SQL كامل

إن رغبت بالتراجع عن **كل ما نُفِّذ**، نفذ التالي بالترتيب:

```sql
-- (A) إسقاط الجداول التي أُنشئت حديثًا (كلها فارغة → لا فقد بيانات)
DROP TABLE IF EXISTS public.invoice_items CASCADE;
DROP TABLE IF EXISTS public.refunds CASCADE;
DROP TABLE IF EXISTS public.billing_invoices CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.settlements CASCADE;
DROP SEQUENCE IF EXISTS public.invoice_number_seq;
DROP FUNCTION IF EXISTS public.generate_invoice_number();

-- (B) إسقاط الدالة المساعدة
DROP FUNCTION IF EXISTS public.user_can_access_project(uuid);

-- (C) إسقاط الفهارس
DROP INDEX IF EXISTS public.idx_catalog_items_project;
DROP INDEX IF EXISTS public.idx_catalog_prices_project;
DROP INDEX IF EXISTS public.idx_catalog_categories_project;
DROP INDEX IF EXISTS public.idx_payment_providers_project;
DROP INDEX IF EXISTS public.idx_payments_project;
DROP INDEX IF EXISTS public.idx_checkout_sessions_project;
DROP INDEX IF EXISTS public.idx_subscriptions_project;
DROP INDEX IF EXISTS public.idx_customers_project;
DROP INDEX IF EXISTS public.idx_webhook_events_project;
DROP INDEX IF EXISTS public.idx_site_api_keys_project;
DROP INDEX IF EXISTS public.idx_plans_project;

-- (D) حذف project_id من الجداول المالية (Backfill يُلغى تلقائيًا)
ALTER TABLE public.catalog_categories      DROP COLUMN IF EXISTS project_id;
ALTER TABLE public.catalog_items           DROP COLUMN IF EXISTS project_id;
ALTER TABLE public.catalog_prices          DROP COLUMN IF EXISTS project_id;
ALTER TABLE public.catalog_item_providers  DROP COLUMN IF EXISTS project_id;
ALTER TABLE public.payment_providers       DROP COLUMN IF EXISTS project_id;
ALTER TABLE public.webhook_events          DROP COLUMN IF EXISTS project_id;
ALTER TABLE public.site_api_keys           DROP COLUMN IF EXISTS project_id;
ALTER TABLE public.portal_tokens           DROP COLUMN IF EXISTS project_id;

-- (E) حذف الأعمدة الجديدة من hn_projects
ALTER TABLE public.hn_projects
  DROP COLUMN IF EXISTS integration_mode,
  DROP COLUMN IF EXISTS environment,
  DROP COLUMN IF EXISTS project_type,
  DROP COLUMN IF EXISTS logo_url,
  DROP COLUMN IF EXISTS payments_enabled,
  DROP COLUMN IF EXISTS subscriptions_enabled,
  DROP COLUMN IF EXISTS invoices_enabled,
  DROP COLUMN IF EXISTS api_enabled,
  DROP COLUMN IF EXISTS webhooks_enabled,
  DROP COLUMN IF EXISTS mrr_cached,
  DROP COLUMN IF EXISTS arr_cached,
  DROP COLUMN IF EXISTS connection_status,
  DROP COLUMN IF EXISTS last_seen_at;

-- (F) قيم enum الجديدة لا يمكن إسقاطها في Postgres بدون إعادة إنشاء النوع.
-- الترك آمن لأنها لم تُستخدم بعد في أي RLS أو trigger أو row.
```

**تحذير:** قيم `enum` لا تُحذف بدون إعادة بناء النوع + تحديث كل الأعمدة المرتبطة. أنصح بتركها كما هي حتى لو تراجعت.

---

## 11) الفهارس والقيود المقترحة (تم/مقترح)

**نُفِّذ:**
- 11 فهرس على `project_id` عبر الجداول المالية (BTree).
- CHECK constraints على `integration_mode`, `environment`, `connection_status` في `hn_projects`.
- CHECK على `status` في `billing_invoices`, `refunds`, `settlements`.

**مقترح لاحقًا (مرحلة 1B):**
```sql
ALTER TABLE public.hn_projects
  ADD CONSTRAINT hn_projects_status_check
  CHECK (status IN ('draft','active','suspended','archived'));
CREATE UNIQUE INDEX ux_hn_projects_code ON public.hn_projects(lower(code));
```

---

## 12) الملفات التي قد تتأثر مستقبلًا

انظر جدول الفقرة 8. جميع الملفات **تعمل حاليًا كما هي** (المرحلة الأولى Additive بحتة). أول ملفات ستحتاج تحديث عند نقل مصدر البيانات:
1. `src/lib/hn-pay/catalog.functions.ts` (products_services → catalog_items)
2. `src/routes/_authenticated/admin/products.tsx` (نفس)
3. `src/lib/hn-pay/categories.functions.ts` (product_categories → catalog_categories)
4. `src/lib/hn-pay/financial-projects.functions.ts` (نفس)
5. `src/routes/_authenticated/owner/dashboard.tsx` و `user.dashboard.tsx` (hn_subscriptions → subscriptions)

---

## 13) اختبارات ما قبل وما بعد التنفيذ

### قبل التنفيذ (Pre-flight)
```sql
-- P1: تأكيد عدم فقدان أي سجل عند إضافة project_id
SELECT tbl, count(*) FROM (
  SELECT 'catalog_items' tbl FROM catalog_items WHERE site_id IS NOT NULL UNION ALL
  SELECT 'catalog_prices' FROM catalog_prices WHERE site_id IS NOT NULL UNION ALL
  SELECT 'catalog_categories' FROM catalog_categories WHERE site_id IS NOT NULL
) x GROUP BY tbl;

-- P2: أي site بلا project؟
SELECT count(*) FROM sites WHERE project_id IS NULL;  -- يجب = 0

-- P3: أي جدول مالي به FK إلى site_id غير موجود؟
SELECT count(*) FROM catalog_items c LEFT JOIN sites s ON s.id=c.site_id WHERE c.site_id IS NOT NULL AND s.id IS NULL;
```

### بعد التنفيذ (Post-checks)
```sql
-- Q1: تغطية project_id كاملة على 100% لكل الجداول المالية المملوءة
SELECT 'catalog_items' t, count(*) FILTER (WHERE project_id IS NULL) AS missing FROM catalog_items UNION ALL
SELECT 'catalog_prices', count(*) FILTER (WHERE project_id IS NULL) FROM catalog_prices UNION ALL
SELECT 'catalog_categories', count(*) FILTER (WHERE project_id IS NULL) FROM catalog_categories;

-- Q2: دالة الصلاحية تعمل بأمان
SELECT public.user_can_access_project('<some-project-uuid>');

-- Q3: RLS القديمة لا تزال تعمل (يجب أن يقرأ owner كل catalog_items)
SET LOCAL role authenticated; SELECT count(*) FROM catalog_items;

-- Q4: الجداول الجديدة فارغة + RLS مفعّلة
SELECT relname, relrowsecurity FROM pg_class WHERE relname IN
 ('billing_invoices','invoice_items','refunds','audit_logs','settlements');
```

---

## 14) ترتيب التنفيذ داخل Transaction

⚠️ قيود Postgres المهمة:
- `ALTER TYPE ... ADD VALUE` **لا يمكن** تنفيذها في نفس transaction مع استعمال القيمة الجديدة → لذا نُفِّذت في **transaction منفصلة** أولًا.
- بقية العمليات (ADD COLUMN, UPDATE, CREATE INDEX, CREATE FUNCTION, CREATE TABLE, CREATE POLICY) قابلة للتنفيذ داخل transaction واحدة.

**الترتيب الموصى به لأي مرحلة قادمة:**
1. Transaction A: `ALTER TYPE ADD VALUE` فقط.
2. Transaction B: ADD COLUMN (nullable) + FK.
3. Transaction C: UPDATE (backfill).
4. Transaction D: CREATE INDEX.
5. Transaction E: CREATE FUNCTION / CREATE TABLE / GRANT / ENABLE RLS / CREATE POLICY.
6. (اختياري لاحقًا) Transaction F: ALTER COLUMN SET NOT NULL بعد التحقق من `missing = 0`.

---

## 15) المخاطر المحتملة والكشف المبكر

| الخطر | كيفية الكشف المبكر | التخفيف |
|---|---|---|
| Backfill يترك سجلات NULL | `SELECT count(*) WHERE project_id IS NULL` بعد كل UPDATE | لا نطبّق NOT NULL قبل تحقق `missing=0` |
| RLS جديدة تحجب صلاحيات موجودة | تنفيذ اختبار Q3 لكل دور قبل استبدال أي سياسة قديمة | نضيف السياسات بجانب القديمة أولًا، ثم نُسقطها |
| `user_can_access_project` تستخدم دورًا عامًا وتتجاوز حصر project_id | تدقيق يدوي على منح `finance_manager` عبر project_members | تأجيل إلى مرحلة project_members |
| DROP سلاسل التسمية `_project` | كلها فهارس مضافة → آمن التراجع | Rollback في §10 |
| Enum قيم إضافية غير قابلة للحذف | تجربة على staging | تركها إن تراجعنا |
| تعارض مع Triggers القائمة (`tg_catalog_items_lock_site`, `tg_catalog_items_block_delete_when_used`) | تنفيذ اختبار DELETE/UPDATE على catalog_items | لم نلمس تلك Triggers |
| ازدواج بين `catalog_prices` و `plans` قبل توحيدهما | مراقبة `plans` count > 0 مقابل `catalog_prices` | فترة قراءة مزدوجة قبل أي VIEW |

---

## 16) قرارك المطلوب

1. هل توافق على **إبقاء ما نُفِّذ** (كل التغييرات Additive، صفر فقد بيانات، قابلة للتراجع بسكربت §10)؟
2. أم تفضّل **التراجع الكامل** الآن ثم تنفيذ الحزمة في دفعات مصغّرة (transaction لكل خطوة كما في §14)؟
3. أي بند تريد تعديله (مثال: إزالة `mrr_cached/arr_cached`، إضافة CHECK على `status`، إسقاط جداول `refunds/audit_logs/settlements` وإرجاؤها لمرحلة 2 مستقلة)؟

لن أنفّذ أي SQL أو تعديل كود قبل موافقتك الصريحة على هذا التقرير.
