# SAMS Banking Simulation — Full-Stack (React + Django)

موقع فعالية محاكاة البنوك بأكاديمية السادات، اتحوّل من صفحة HTML ثابتة لتطبيق كامل:
**Django REST API + قاعدة بيانات + رفع فيديوهات + داش بورد React للتحكم**.

## بنية المشروع

```
SAMS/
├── backend/          ← Django + DRF (الـ API والداتا بيز)
│   ├── config/       ← إعدادات المشروع
│   ├── core/         ← الموديلز (Section, Video) والـ API
│   ├── media/        ← الفيديوهات والصور المرفوعة (يتولد تلقائيًا)
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example  ← انسخه لـ .env
├── frontend/         ← React + Vite
│   └── src/
│       ├── pages/    ← Landing, Videos, Login, Dashboard
│       ├── components/
│       └── lib/api.js
└── legacy/           ← الملفات الثابتة القديمة (للرجوع لها)
```

## المتطلبات (تثبّتها على جهازك مرة واحدة)

- **Python 3.11+** — من python.org
- **Node.js 20+** — من nodejs.org
- **Git** (موجود عندك بالفعل)

---

## 1) تشغيل الباك اند (Django) محليًا

```bash
cd backend
python -m venv venv
# ويندوز:
venv\Scripts\activate
# لينكس/ماك:
source venv/bin/activate

pip install -r requirements.txt
copy .env.example .env          # ويندوز (أو cp على لينكس)
python manage.py migrate
python manage.py seed_admin        # ينشئ الأدمن من .env (admin / SamsAdmin#2026)
python manage.py runserver
```

الـ API هيشتغل على `http://localhost:8000`
لوحة أدمن Django الجاهزة (احتياطي): `http://localhost:8000/django-admin`

## 2) تشغيل الفرونت اند (React) محليًا

في نافذة تيرمنال تانية:

```bash
cd frontend
npm install
npm run dev
```

الموقع هيفتح على `http://localhost:5173`
(الـ Vite بيوجّه طلبات `/api` و `/media` تلقائيًا للـ Django — مفيش إعداد مطلوب).

الصفحات:
- `/` — الصفحة الرئيسية (بتسحب المحتوى من الـ API)
- `/videos` — الفيديوهات
- `/admin` — بوابة الداش بورد: تطلب تسجيل دخول، وبعدها لوحة التحكم (إضافة/تعديل/حذف). مخفية من المنيو، تدخلها بالرابط بس.
- `/django-admin` — لوحة Django الجاهزة كاحتياطي.

---

## 3) إزاي تضيف محتوى

افتح `/admin` وسجّل دخول (admin / SamsAdmin#2026 — غيّرها):
- **تبويب الفيديوهات**: ارفع ملف فيديو + عنوان + وصف + صورة مصغّرة اختيارية.
- **تبويب المحتوى**: أضف أقسام مرنة. لكل قسم: معرّف، عنوان، نص، إيموجي/أيقونة، وزر برابط اختياري. القسم بمعرّف `hero` بيظهر في عنوان الصفحة الرئيسية؛ الباقي بيظهر ككروت تحتها. تقدر تعدّل، تنشر/تخفي، وتحذف أي قسم.

---

## 4) النشر على الـ VPS (Hostinger)

الفكرة: **Nginx** قدّام، بيقدّم ملفات React الجاهزة وبيمرّر طلبات `/api` و `/media` لـ **Gunicorn** اللي بيشغّل Django، والداتا بيز **PostgreSQL**.

### أ) تجهيز السيرفر
```bash
sudo apt update && sudo apt install -y python3-venv python3-pip nginx postgresql
# انشئ داتا بيز
sudo -u postgres psql -c "CREATE DATABASE sams;"
sudo -u postgres psql -c "CREATE USER sams WITH PASSWORD 'اختَر-باسورد-قوي';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sams TO sams;"
```

### ب) الباك اند على السيرفر
```bash
cd /var/www/sams/backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements-prod.txt   # يشمل PostgreSQL + Gunicorn
cp .env.example .env      # وعدّل القيم (تحت)
python manage.py migrate
python manage.py seed_admin
python manage.py collectstatic --noinput
```

في `.env` على السيرفر:
```
SECRET_KEY=مفتاح-طويل-عشوائي
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com
CORS_ORIGINS=https://your-domain.com
DB_NAME=sams
DB_USER=sams
DB_PASSWORD=الباسورد-اللي-اخترته
DB_HOST=127.0.0.1
DB_PORT=5432
```

### ج) Gunicorn كخدمة systemd
`/etc/systemd/system/sams.service`:
```ini
[Unit]
Description=SAMS Gunicorn
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/sams/backend
ExecStart=/var/www/sams/backend/venv/bin/gunicorn config.wsgi:application --bind 127.0.0.1:8000
Restart=always

[Install]
WantedBy=multi-user.target
```
```bash
sudo systemctl enable --now sams
```

### د) الفرونت اند (بناء الملفات الثابتة)
على جهازك أو السيرفر:
```bash
cd frontend
npm install && npm run build
# الناتج في frontend/dist — ارفعه للسيرفر مثلًا /var/www/sams/frontend/dist
```

### هـ) إعداد Nginx
`/etc/nginx/sites-available/sams`:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    client_max_body_size 1024M;   # يسمح برفع فيديوهات كبيرة

    root /var/www/sams/frontend/dist;
    index index.html;

    location / {
        try_files $uri /index.html;   # مهم لراوتر React
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /django-admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }

    location /media/ { alias /var/www/sams/backend/media/; }
    location /static/ { alias /var/www/sams/backend/staticfiles/; }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/sams /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
# HTTPS مجاني:
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## ملاحظات

- **الفيديوهات** بتتخزّن كملفات في `backend/media/videos/` على الـ VPS — تأكد فيه مساحة كافية على القرص.
- كل ما تضيف موديل جديد: `makemigrations` ثم `migrate`.
- الأمان: `DEBUG=False` و`SECRET_KEY` قوي على الإنتاج، ومتحطّش الـ `.env` في Git (متجاهَل بالفعل).

© 2026 SAMS Bank Simulation — أكاديمية السادات لإدارة العلوم
