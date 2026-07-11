## سبب عدم فتح لوحة المالك

من فحص الشبكة:
- المستخدم `info@hnchat.net` سُجّل عبر **Google OAuth** (`app_metadata.provider = "google"`), لذا محاولات تسجيل الدخول بكلمة مرور تُرجع `invalid_credentials` — لا توجد كلمة مرور مضبوطة لهذا الحساب.
- بعد نجاح دخول Google، الاستعلام `GET /user_roles?user_id=eq.28beb972...` يُرجع `[]` — أي أن `handle_new_user` لم يُدرج صف `owner`، لذلك حارس `beforeLoad` في `/owner/dashboard` يعيد التوجيه إلى `/user/dashboard`.
- الجدول `profiles` أيضاً فارغ لنفس المستخدم (`[]`) — فُقد إدراج التريغر (ربما لأن الحساب أُنشئ قبل ترحيل الحماية الأخير).

## الخطة

### 1) Backfill عبر migration واحد
- إدراج صفوف `profiles` للمستخدمين المحميين (`lmodirv@gmail.com`, `info@hnchat.net`) إن لم توجد، بقراءة `id/email/full_name` من `auth.users`.
- إدراج صفوف `user_roles`:
  - `(user_id, 'HN-HUB', 'owner')`
  - `(user_id, '*', 'owner')`
  - `(user_id, '*', 'admin')`
  - مع `ON CONFLICT DO NOTHING`.
- تشغيل نفس المنطق داخل block PL/pgSQL يمر على البريدين، حتى يعمل حتى لو أحدهما فقط موجود في `auth.users`.
- لا تعديل على `handle_new_user` (يعمل بالفعل للحسابات الجديدة).

### 2) توضيح تسجيل الدخول
بعد نجاح الترحيل: يجب على المستخدم الضغط على **"Continue with Google"** في `/auth` (وليس نموذج كلمة المرور)، وسيُعاد التوجيه تلقائياً إلى `/owner/dashboard` بفضل `pickPostLoginRoute` والدور المُدرج.

### ملاحظات تقنية
- لا حاجة لأي تعديل على الكود الأمامي أو RLS.
- الترحيل قراءة/كتابة عادية، آمنة للتشغيل مرات متعددة (idempotent).
- تحذير hydration mismatch على `data-tsd-source` في `__root.tsx` أثر تجميلي غير مرتبط بمشكلة الدخول — يُترك خارج نطاق هذا الترحيل.
