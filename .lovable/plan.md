# تحليل HN-PAY + خطة الكتالوج المالي المركزي (مراجعة فقط)

## 1) الوضع الحالي في قاعدة البيانات

### الجداول الموجودة والقابلة لإعادة الاستخدام مباشرة

| الجدول | الدور | الحالة | ملاحظات |
|---|---|---|---|
| `hn_projects` (18 صف) | المشروع الجذر (HN-DB, HN-Driver…) | جاهز | يحمل `code`, `default_currency`, `default_provider_id`, `brand_color` |
| `project_domains` (152 صف) | نطاقات المشروع | جاهز | `is_primary`, `payments_enabled`, `environment`, `verification_status` |
| `products_services` (152 صف) | كتالوج المنتجات/الخدمات | جاهز | مربوط بـ `project_id` + `domain_id` + `category_id`، لكن `site_id` مُهمل عمليًا |
| `product_categories` | تصنيف هرمي داخل المشروع | جاهز | `parent_id` self-FK |
| `plans` | خطط الاشتراك | جاهز جزئيًا | مربوط بـ `site_id` **NOT NULL** ← عائق (انظر §3) |
| `payment_providers` | مزودو الدفع العامون | جاهز | Stripe / Manual / Mock |
| `project_payment_settings` | تفعيل مزود لكل مشروع | جاهز | (project_id, provider_id) |
| `sites` | مواقع HN-PAY الحالية (SDK) | **فارغ (0)** | نموذج قديم قبل `hn_projects`+`project_domains` |
| `customers`, `checkout_sessions`, `payments`, `subscriptions` | حركية الدفع | فارغة | كلها مربوطة بـ `site_id` **NOT NULL** فقط |
| `profiles`, `user_roles`, `hn_subscriptions` | هوية وصلاحيات | جاهز | RLS مبنية على `private.is_owner` / `is_hnpay_staff` |

### العلاقات الحالية (FK)

```text
hn_projects ─┬─< project_domains ─< products_services.domain_id
             ├─< product_categories ─< products_services.category_id
             ├─< products_services.project_id
             ├─< project_payment_settings >─ payment_providers
             └─(default_provider_id)→ payment_providers

sites (فارغ) ─┬─< plans ─< checkout_sessions ─< payments
              ├─< customers ─< subscriptions
              └─< site_api_keys / portal_tokens
```

الملاحظة الحرجة: **كل حركة مالية (`plans`, `customers`, `checkout_sessions`, `payments`, `subscriptions`) مرتبطة بـ `sites` وليس بـ `hn_projects` / `project_domains`.** والجدول `sites` فارغ. عمليًا الطبقة المالية غير موصولة بالكتالوج بعد.

### الناقص / التعارضات

1. لا رابط بين `sites` و`hn_projects` (لا يوجد `sites.project_id` ولا `sites.domain_id`).
2. `plans.site_id NOT NULL` → لا يمكن إنشاء خطة مركزية على مستوى `project` أو `domain` مباشرة.
3. `checkout_sessions.site_id NOT NULL` و`customers.site_id NOT NULL` و`payments.site_id NOT NULL` → نفس القيد.
4. `products_services.site_id` موجود لكنه مُهمل (كل الصفوف NULL)، ولا يوجد فهرس أو استخدام حقيقي.
5. `hn_subscriptions` (اشتراكات المستخدمين في HN-HUB) منفصلة تمامًا عن `subscriptions` (اشتراكات العملاء عبر HN-PAY) — **يُبقيان منفصلين** (نطاقان مختلفان)، لا داعي لدمجهما.
6. سياسات RLS الحالية على الطبقة المالية جميعها `is_owner فقط` → غير كافية لعزل بيانات لكل موقع عندما نفتح للطاقم لاحقًا.
7. `plans.provider` NOT NULL افتراضي `stripe` → قد يمنع خطط مركزية بدون مزود.

## 2) الفكرة المعمارية المقترحة (بدون تدمير)

نُبقي `sites` كما هو (SDK الحالي) ونضيف طبقة ربط اختيارية تجعل كل شيء يعمل عبر `hn_projects` + `project_domains` كمصدر حقيقة:

```text
hn_projects ──┬── project_domains  (site مالي = نطاق)
              │
              ├── product_categories
              ├── products_services  (+ project_id + domain_id)
              ├── plans              (+ project_id + domain_id, site_id يصبح اختياري)
              │
              └── payment_providers via project_payment_settings

checkout_sessions / customers / payments / subscriptions
        └── (site_id يبقى) + (project_id + domain_id يُضافان)
```

**قاعدة الربط الموحّدة:** كل صف مالي جديد يجب أن يحمل واحدًا على الأقل من: (`project_id` + `domain_id`)، ويبقى `site_id` مقبولًا للتوافق مع SDK الحالي.

## 3) خطة Migrations آمنة (لا حذف / لا إعادة تسمية)

### Migration 1 — ربط `sites` بالمشروع/النطاق

```sql
ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.hn_projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS domain_id  uuid REFERENCES public.project_domains(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sites_project_id ON public.sites(project_id);
CREATE INDEX IF NOT EXISTS idx_sites_domain_id  ON public.sites(domain_id);
```

لا يُغيّر NOT NULL على `sites`، ولا يمس السطور الموجودة (0 أصلًا).

### Migration 2 — تخفيف `plans.site_id` وإضافة الربط المركزي

```sql
ALTER TABLE public.plans
  ALTER COLUMN site_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS domain_id uuid REFERENCES public.project_domains(id) ON DELETE SET NULL;

-- CHECK ضامن أن الخطة مربوطة بشيء واحد على الأقل
ALTER TABLE public.plans
  ADD CONSTRAINT plans_scope_present
  CHECK (site_id IS NOT NULL OR project_id IS NOT NULL OR domain_id IS NOT NULL) NOT VALID;
ALTER TABLE public.plans VALIDATE CONSTRAINT plans_scope_present;

CREATE INDEX IF NOT EXISTS idx_plans_project_id ON public.plans(project_id);
CREATE INDEX IF NOT EXISTS idx_plans_domain_id  ON public.plans(domain_id);
```

`plans` فارغ حاليًا (0 صف) → `NOT VALID` + `VALIDATE` آمن. لن يتغير أي بيان قائم.

### Migration 3 — إضافة `project_id` + `domain_id` للحركية المالية

```sql
ALTER TABLE public.checkout_sessions
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.hn_projects(id)  ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS domain_id  uuid REFERENCES public.project_domains(id) ON DELETE SET NULL;

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.hn_projects(id)  ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS domain_id  uuid REFERENCES public.project_domains(id) ON DELETE SET NULL;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.hn_projects(id)  ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS domain_id  uuid REFERENCES public.project_domains(id) ON DELETE SET NULL;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.hn_projects(id)  ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS domain_id  uuid REFERENCES public.project_domains(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ck_sessions_project ON public.checkout_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_ck_sessions_domain  ON public.checkout_sessions(domain_id);
CREATE INDEX IF NOT EXISTS idx_customers_project   ON public.customers(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_project    ON public.payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_domain     ON public.payments(domain_id);
CREATE INDEX IF NOT EXISTS idx_subs_project        ON public.subscriptions(project_id);
CREATE INDEX IF NOT EXISTS idx_subs_domain         ON public.subscriptions(domain_id);
```

كل الأعمدة الجديدة nullable + FK بـ `ON DELETE SET NULL` → لا كسر لأي بيانات (وكلها فارغة أصلًا).

### Migration 4 — ترتيب `products_services.site_id` (بدون حذف)

نُبقي العمود، فقط نُضيف فهرسًا ونوثّق أن المصدر الأول هو `project_id + domain_id`:

```sql
CREATE INDEX IF NOT EXISTS idx_ps_site    ON public.products_services(site_id);
CREATE INDEX IF NOT EXISTS idx_ps_project ON public.products_services(project_id);
CREATE INDEX IF NOT EXISTS idx_ps_domain  ON public.products_services(domain_id);
COMMENT ON COLUMN public.products_services.site_id IS
  'legacy — الأولوية لـ project_id + domain_id. يُملأ فقط للربط مع SDK القديم';
```

### Migration 5 — تخفيف `plans.provider` (اختياري)

```sql
ALTER TABLE public.plans ALTER COLUMN provider DROP NOT NULL;
ALTER TABLE public.plans ALTER COLUMN provider DROP DEFAULT;
```

يسمح بإنشاء خطة مركزية على مستوى المشروع دون تثبيت مزود واحد (المزود يُقرر عند الـ checkout من `project_payment_settings`).

## 4) سياسات RLS لعزل بيانات كل موقع

الفكرة: نضيف **دوال مساعدة** ثم **سياسات إضافية** بجانب سياسات `is_owner` القائمة (لا نحذف أيًا منها).

### 4-أ) دوال مساعدة في السكيمة `private`

```sql
-- هل المستخدم عضو في مشروع معين (dev/admin/viewer)؟
CREATE OR REPLACE FUNCTION private.is_project_member(_uid uuid, _project_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.hn_projects p ON p.id = _project_id
    WHERE ur.user_id = _uid
      AND (ur.app_id = p.code OR ur.app_id = '*')
      AND ur.role IN ('owner','admin','staff','viewer')
  );
$$;

-- استنتاج project_id من site_id (للجداول التي لا تحمل project_id بعد)
CREATE OR REPLACE FUNCTION private.site_project(_site_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT project_id FROM public.sites WHERE id = _site_id;
$$;
```

(نُضيف قيمة `'staff'` و`'viewer'` إلى enum `app_role` عبر `ALTER TYPE ... ADD VALUE IF NOT EXISTS` قبل استخدامها.)

### 4-ب) سياسات جديدة (تُضاف بدون حذف القديمة)

```sql
-- plans: قراءة/إدارة لأعضاء المشروع
CREATE POLICY "plans project members read" ON public.plans FOR SELECT TO authenticated
  USING (private.is_owner(auth.uid())
      OR (project_id IS NOT NULL AND private.is_project_member(auth.uid(), project_id))
      OR (site_id    IS NOT NULL AND private.is_project_member(auth.uid(), private.site_project(site_id))));

CREATE POLICY "plans project members write" ON public.plans FOR ALL TO authenticated
  USING     (private.is_owner(auth.uid()) OR (project_id IS NOT NULL AND private.is_project_member(auth.uid(), project_id)))
  WITH CHECK(private.is_owner(auth.uid()) OR (project_id IS NOT NULL AND private.is_project_member(auth.uid(), project_id)));

-- نفس النمط لـ:
--   customers, checkout_sessions, payments, subscriptions
--   products_services, product_categories, project_domains
-- USING = is_owner OR is_project_member(project_id) OR is_project_member(site_project(site_id))
```

- تبقى قراءة الجمهور للـ `plans` النشطة كما هي (`Anyone reads active plans`).
- سياسات `is_hnpay_staff` القائمة للطاقم المركزي على `hn_projects/products_services/product_categories/project_domains/project_payment_settings` تُترك بدون مساس.
- كل الحركية المالية تصبح معزولة: عضو مشروع HN-Driver لا يرى مدفوعات HN-DB.

## 5) طريقة ربط كل منتج/خدمة/خطة بـ `site_id`

- **المبدأ:** الحقيقة الجديدة = `project_id` (إلزامي منطقيًا) + `domain_id` (اختياري لكن مُوصى به).
- `site_id` يُملأ فقط عند وجود إدخال مقابل في `sites` لصالح SDK الحالي (checkout embed). عند إنشاء `site` جديد نُعبّئ تلقائيًا `sites.project_id` و`sites.domain_id`.
- عند إنشاء `checkout_session`:
  1. الواجهة/الـ API ترسل `product_id` أو `plan_id`.
  2. السيرفر يقرأ `project_id` + `domain_id` من المنتج/الخطة ويحقنها في `checkout_sessions`، ويحقن `site_id` فقط لو المشروع/النطاق مربوط بـ `site`.
- **ترحيل خفيف (backfill) بدون حذف:**
  ```sql
  UPDATE public.sites s
  SET project_id = pd.project_id, domain_id = pd.id
  FROM public.project_domains pd
  WHERE s.project_id IS NULL AND lower(s.domain) = lower(pd.domain);
  ```
  ولا نلمس أي صف موجود في `products_services` (كلها مربوطة بالمشروع/النطاق أصلًا).

## 6) ما لن يتم تغييره (ضمانات السلامة)

- لن يُحذف أي عمود، ولن يُعاد تسمية أي جدول أو عمود.
- لن يُغيَّر أي FK قائم، ولا NOT NULL على البيانات الموجودة (باستثناء `plans.site_id` وهي فارغة).
- لن تُعدَّل سياسات RLS القائمة؛ فقط تُضاف سياسات إضافية.
- لن تُلمس السكيمات المحمية (`auth`, `storage`, `realtime`, `supabase_functions`, `vault`).

## 7) الخطوات التالية (بعد موافقتك)

1. تنفيذ Migrations 1→5 بالترتيب.
2. تحديث `catalog.functions.ts` و`financial-projects.functions.ts` لاستخدام `project_id + domain_id` كمصدر أساسي.
3. تحديث تدفق checkout ليحقن `project_id/domain_id` في `checkout_sessions/customers/payments/subscriptions`.
4. صفحة "المشاريع المالية" تصبح مصدرًا مباشرًا لإحصائيات المدفوعات (JOIN على `payments.domain_id`).

هل أُنفّذ الآن؟ (لن يُنفَّذ أي شيء قبل موافقتك.)
