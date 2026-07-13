# نشر مشروع SAMS مجانًا — الباك على PythonAnywhere والفرونت على Vercel

الترتيب المهم: **انشر الباك إند الأول** (عشان تعرف رابط الـ API)، وبعدين الفرونت.

---

## أولًا: الباك إند على PythonAnywhere

### 1) إنشاء الحساب
- اعمل حساب مجاني (Beginner) على https://www.pythonanywhere.com
- الرابط بتاعك هيكون: `https://USERNAME.pythonanywhere.com`

### 2) رفع الكود
افتح **Consoles → Bash** واكتب (استبدل الرابط برابط الريبو بتاعك على GitHub):
```bash
git clone https://github.com/USERNAME/SAMS.git
```
> لو الكود مش على GitHub، ارفعه الأول، أو استخدم Files لرفع مجلد `backend`.

### 3) عمل virtualenv وتثبيت المتطلبات
```bash
cd SAMS/backend
python3.10 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4) ملف البيئة `.env`
انسخ المثال وعدّله بقيم الإنتاج:
```bash
cp .env.example .env
nano .env
```
اضبط القيم دي (استبدل USERNAME واسم تطبيق Vercel):
```
SECRET_KEY=<حط سلسلة عشوائية طويلة جدًا>
DEBUG=False
ALLOWED_HOSTS=USERNAME.pythonanywhere.com
CORS_ORIGINS=https://your-app.vercel.app
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<باسورد قوي>
```
> ملاحظة: سيب `DB_NAME` فاضي عشان يستخدم SQLite (مناسب للمجاني).
> لتوليد SECRET_KEY: `python -c "import secrets;print(secrets.token_urlsafe(64))"`

### 5) الهجرات + السوبر يوزر + الملفات الثابتة
```bash
python manage.py migrate
python manage.py seed_admin
python manage.py collectstatic --noinput
```

### 6) إنشاء الـ Web App
- روح تبويب **Web → Add a new web app → Manual configuration → Python 3.10**
- **Virtualenv**: حط المسار `/home/USERNAME/SAMS/backend/venv`
- **WSGI configuration file**: اضغط عليه وامسح محتواه وحط ده:
```python
import os, sys
path = "/home/USERNAME/SAMS/backend"
if path not in sys.path:
    sys.path.insert(0, path)
os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings"
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

### 7) ربط الملفات الثابتة والميديا (مهم جدًا)
في تبويب **Web → Static files** أضف صفّين:

| URL | Directory |
|-----|-----------|
| `/static/` | `/home/USERNAME/SAMS/backend/staticfiles` |
| `/media/`  | `/home/USERNAME/SAMS/backend/media` |

> بدون سطر `/media/` مش هتظهر صور المشرفين والأعضاء بعد النشر (لأن DEBUG=False).

### 8) شغّل
اضغط **Reload** الأخضر. افتح:
- `https://USERNAME.pythonanywhere.com/django-admin/` للتأكد إن كله شغّال.
- `https://USERNAME.pythonanywhere.com/api/supervisors/` المفروض ترجع `[]` أو بيانات.

---

## ثانيًا: الفرونت إند على Vercel

### 1) اربط الريبو
- ادخل https://vercel.com → **Add New → Project** واختر ريبو SAMS.

### 2) إعدادات المشروع
- **Root Directory**: `frontend`  ← مهم جدًا
- **Framework Preset**: Vite (بيتظبط تلقائيًا)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 3) متغير البيئة
أضف Environment Variable:
```
VITE_API_BASE = https://USERNAME.pythonanywhere.com
```
> من غير `/` في الآخر ومن غير `/api` (الكود بيضيف `/api` لوحده).

### 4) Deploy
اضغط **Deploy**. بعد ما يخلّص هيديك رابط زي `https://your-app.vercel.app`.

### 5) اقفل الحلقة (CORS)
ارجع لملف `.env` في PythonAnywhere وتأكد إن `CORS_ORIGINS` فيه رابط Vercel **بالظبط** (بـ https ومن غير `/` في الآخر)، وبعدها اعمل **Reload** للـ web app تاني.

`ملف frontend/vercel.json` موجود أصلًا وبيظبط راوتنج React (عشان /admin و /videos يشتغلوا).

---

## ملاحظات مهمة على الباقة المجانية
- **مساحة القرص محدودة (~512MB)** على PythonAnywhere. رفع فيديوهات كبيرة هيملاها بسرعة — الأفضل تستخدم **روابط يوتيوب/درايف** لفيديوهات الندوة بدل رفع ملفات ثقيلة.
- تطبيق PythonAnywhere المجاني محتاج تضغط زر تجديد كل ~3 شهور (بينبهك بإيميل).
- لو غيّرت كود بعدين: `git pull` في الـ Bash، وبعدها `migrate`/`collectstatic` لو لزم، ثم **Reload**. Vercel بيعيد النشر تلقائيًا مع كل push.
- بيانات دخول الأدمن هي اللي في `ADMIN_USERNAME` / `ADMIN_PASSWORD`.
