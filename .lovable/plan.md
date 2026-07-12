خطة بناء محرك الدفع متعدد المزودين لـ HN-PAY

الهدف
تحويل HN-PAY من نظام مرتبط بمزود واحد إلى محرك دفع مرن يدعم عدة بوابات، حيث يختار مالك كل موقع/تطبيق البوابة المناسبة من لوحة التحكم. المرحلة الأولى تركّز على Stripe و Paddle (اللذين يدعمان SaaS/اشتراكات)، والمرحلة الثانية تضيف المزودين الإضافيين تدريجيًا.

المرحلة 1: الأساس والمزودان الأساسيان (Paddle + Stripe)

1. تفعيل بوابات Lovable Payments
   - تفعيل Paddle عبر `enable_paddle_payments` (الأنسب للمغرب/العالم/الاشتراكات).
   - تفعيل Stripe عبر `enable_stripe_payments` (بحساب المستخدم الخاص؛ في المغرب تُستخدم tax-calculation-only وليس managed-payments).
   - إنشاء منتجات/أسعار تجريبية في البيئة التجريبية (sandbox) لكل مزود.

2. توسيع `payment_providers` لتصبح سجل التكوين المركزي
   - إضافة حقول: `provider` (paddle/stripe/paypal/cmi/naps/payzone/apple/google/crypto…), `mode` (sandbox/live), `is_active`, `api_key`, `api_secret`, `webhook_secret`, `public_key`, `merchant_id`, `supported_countries`, `supported_currencies`, `fee_percent`, `fee_fixed`, `tax_mode`, `created_by_site_id`.
   - تمكين RLS: مالك الموقع يقرأ/يعدل إعدادات موقعه فقط، المالك العام يدير الإعدادات العالمية.

3. إنشاء واجهة إدارة المزودين `/admin/payment-providers`
   - قائمة المزودين المتاحين مع بطاقات لكل مزود (الشعار، الحالة، الوضع).
   - نموذج تفعيل/تعديل لكل مزود يطلب: وضع sandbox/live، المفاتيح، و webhook URL.
   - اختبار الاتصال السريع لكل مزود (Verify credentials) قبل الحفظ.
   - تحديد المزود الافتراضي لكل موقع (default_provider_id في `sites`).

4. تعديل جدول `checkout_sessions` و `payments` لدعم المزود
   - إضافة `provider` (enum/text) و `provider_session_id` و `provider_checkout_url`.
   - إضافة `provider_metadata` (JSON) لتخزين بيانات خاصة بكل مزود.

5. إنشاء محرك إنشاء جلسة الدفع (Checkout Engine)
   - `createCheckoutSession` server-function تأخذ: site_id, catalog_item_id, price_id, currency, customer_email, success_url, cancel_url.
   - تحدد المزود الافتراضي للموقع (أو يُمرّر صراحةً)، وتختار مسار التنفيذ:
     - Paddle: إنشاء `transaction` أو `checkout` عبر Paddle API، وإرجاع checkout URL.
     - Stripe: إنشاء `Checkout Session` مع `automatic_tax` (للمغرب/الدول غير المدعومة بـ managed) أو `managed_payments` إن كان متاحًا.
   - حفظ السجل في `checkout_sessions`.

6. معالجة Webhooks
   - إنشاء مسارات `/api/public/webhooks/paddle` و `/api/public/webhooks/stripe`.
   - التحقق من توقيع كل webhook قبل المعالجة.
   - تحديث `payments` و `subscriptions` و `provider_events` و `processed_webhook_events`.
   - منع معالجة نفس الحدث مرتين (idempotency).

7. تحديث واجهة الكتالوج والمدفوعات
   - زر "الدفع/الاشتراك" في صفحة الكتالوج يستخدم المزود الافتراضي للموقع.
   - إظهار المزود المستخدم في تفاصيل المعاملة.
   - إضافة فلتر "المزود" في `/admin/financial-projects` و `/admin/transactions`.

المرحلة 2: إضافة المزودين الإضافيين (بعد توفر API keys)

8. PayPal
   - تفعيل بواسطة مفاتيح المستخدم (client_id/secret)؛ إنشاء طلبات PayPal Orders v2.

9. CMI (Centre Monétique Interbancaire) – المغرب
   - يتطلب عقدًا تجاريًا و API keys خاصة بالبنك/بوابة CMI.
   - تكامل عبر redirect/return URL و HMAC verification.

10. NAPS / Payzone / Apple Pay / Google Pay
    - كل مزود يتطلب SDK/مفاتيح خاصة وتكامل عبر redirect أو payment tokenization.

11. العملات الرقمية (USDT)
 - يتطلب مزود crypto gateway (مثل Coinbase Commerce أو NOWPayments) وعناوين محافظ.

الملاحظات التقنية
- كل المفاتيح تُخزّن كـ secrets عبر `add_secret` أو في `payment_providers` مشفرةً (server-side فقط).
- لا نُخزّن مفاتيح في الكود أو الـ client.
- محرك الدفع يعمل داخل `createServerFn`؛ webhooks في `src/routes/api/public/webhooks/`.
- التحقق من الأدوار (owner/admin) قبل تعديل إعدادات المزود.
- المرحلة الأولى جاهزة للتنفيذ الفوري؛ المرحلة الثانية تعتمد على توفر حسابات/عقود مع البنوك/المزودين.

التسلسل المقترح للتنفيذ
1. تفعيل Paddle + Stripe (sandbox).
2. توسيع `payment_providers` + RLS.
3. إنشاء صفحة `/admin/payment-providers`.
4. بناء Checkout Engine.
5. ربط Webhooks.
6. تحديث واجهة الكتالوج والمعاملات.
7. إضافة المزودين الإضافيين لاحقًا حسب توفر المفاتيح.