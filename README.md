# استبيان زوار واجهة أبحر الجديدة · MSAU 611

صفحتان مربوطتان بقاعدة بيانات Firebase (Firestore):

| الصفحة | الملف | لمن |
|---|---|---|
| الاستبيان | `index.html` | للمشاركين (الرابط الذي تنشره أو QR) |
| التجميع (لوحة النتائج) | `results.html` | لك ولفريق المادة |

كل من يعبّي الاستبيان يُحفظ ردّه في مجموعة `responses` ويظهر فوراً في صفحة التجميع بدون تحديث.

صفحة التجميع فيها: إجمالي الردود، متوسط التقييم، الإحساس الحراري، نسبة من سيبقون أطول مع الظل، رسم لكل سؤال، تقييم البنود الـ14 مع تعليم أضعف 3، الإحساس الحراري حسب المكان (شمس / شجرة / مظلة)، الملاحظات، فلاتر (العمر، الجنس، السكن، عدد الزيارات)، تصدير CSV يفتح في Excel و SPSS، ورمز QR للاستبيان.

---

## 1) إعداد Firebase (مرة واحدة)

1. ادخل https://console.firebase.google.com ← **Add project** (مثلاً `obhur-survey`).
2. من القائمة: **Build ← Firestore Database ← Create database** ← اختر **Production mode** والموقع الأقرب (مثلاً `europe-west` أو `me-central`).
3. تبويب **Rules**: امسح الموجود والصق محتوى ملف `firestore.rules` ← **Publish**.
4. **Project settings (⚙️) ← Your apps ← أيقونة `</>`** ← سجّل تطبيق ويب ← انسخ كائن `firebaseConfig`.
5. افتح `js/firebase-config.js` وضع القيم مكان `PASTE_...`.

> قبل هذه الخطوة تعمل الصفحتان في **وضع تجريبي** (بيانات وهمية للمعاينة)، وتظهر رسالة صفراء أسفل الصفحة.

## 2) النشر على GitHub Pages

1. أنشئ مستودع جديد على GitHub (مثلاً `obhur-survey`)، **Public**.
2. ارفع كل الملفات كما هي (مع مجلدي `css` و `js`):
   - من الموقع: **Add file ← Upload files** واسحب محتوى المجلد، أو
   - من الطرفية:
     ```bash
     git remote add origin https://github.com/9jm8nyskny-netizen/engsurvey.git
     git push -u origin main
     ```
3. **Settings ← Pages ← Source: Deploy from a branch ← main / (root) ← Save**.
4. بعد دقيقة تقريباً:
   - الاستبيان: `https://9jm8nyskny-netizen.github.io/engsurvey/`
   - التجميع: `https://9jm8nyskny-netizen.github.io/engsurvey/results.html`

## 3) ملاحظات

- **الخصوصية**: لا يُجمع أي اسم أو بريد. صفحة التجميع غير مرتبطة من صفحة الاستبيان، لكن أي شخص يعرف رابطها يقدر يشوف النتائج (البيانات مجهولة). إذا تبيها مقفلة بكلمة مرور نضيف Firebase Authentication.
- **حذف ردود تجريبية**: من Firebase Console ← Firestore ← `responses` (الحذف ممنوع من الموقع نفسه).
- **إظهار النتائج للمشارك بعد الإرسال**: في `js/schema.js` غيّر `showResultsAfterSubmit` إلى `true`.
- **تعديل الأسئلة**: كل الأسئلة في `js/schema.js`. عند إضافة سؤال جديد أضف رقمه أيضاً في قائمة `hasOnly` داخل `firestore.rules`.
- **جهاز واحد لعدة مشاركين** (استبيان ميداني): بعد الإرسال يظهر زر "إجابة جديدة" يبدأ من الصفر.

## هيكل الملفات

```
index.html            صفحة الاستبيان
results.html          صفحة التجميع
css/style.css         التصميم المشترك
js/schema.js          تعريف الأسئلة (مصدر واحد للصفحتين)
js/firebase-config.js إعدادات Firebase  ← عدّل هذا
js/data.js            الحفظ والقراءة من Firestore
js/survey.js          منطق الاستبيان
js/results.js         منطق التجميع والرسوم والتصدير
firestore.rules       قواعد الأمان
```
