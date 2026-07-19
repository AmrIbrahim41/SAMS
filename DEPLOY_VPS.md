# نشر SAMS (باك إند) على نفس سيرفر الجيم — معزول تمامًا

فرونت SAMS شغّال على **Vercel**. هنا هننشر **الباك إند فقط** على الـ Hostinger VPS
(IP `187.77.111.27`) جنب سيستم الجيم، بس **معزول تمامًا**: مستخدم لينكس خاص،
قاعدة بيانات منفصلة، خدمة gunicorn منفصلة، وسابدومين مستقل.

> المستخدم `azr` هيتعمل مرة واحدة وممكن يستضيف مشاريع كتير بعدين (كل مشروع بقاعدته
> وخدمته المستقلة). فالعزل هنا **لكل مشروع** — قاعدة `sams_db` وخدمة `sams-gunicorn`
> خاصين بـ SAMS بس.

> يوم ما تخلص المشروع → روح لقسم **«التنظيف»** في آخر الملف. الجيم مايتأثرش نهائيًا،
> والمستخدم `azr` بيفضل موجود لباقي مشاريعك.

الإعدادات المستخدمة في الدليل (بدّلها لو حبيت):

| العنصر | القيمة |
|---|---|
| مستخدم لينكس | `azr` (يُعاد استخدامه لمشاريع تانية) |
| مجلد الكود | `/home/azr/SAMS` |
| قاعدة البيانات | `sams_db` |
| مستخدم DB | `sams_user` |
| خدمة gunicorn | `sams-gunicorn` على `127.0.0.1:8001` |
| سابدومين الـ API | `sams-api.duckdns.org` ← اعمله على duckdns.org |

---

## المرحلة 0 — على جهازك (مرة واحدة): ادفع التعديل على GitHub

اتعمل تعديل تحضيري بسيط على `backend/config/settings.py` (تأمين HTTPS خلف nginx).
في **PowerShell** جوه `A:\SAMS`:

```powershell
cd A:\SAMS
git add -A
git commit -m "prep: HTTPS behind nginx (SECURE_PROXY_SSL_HEADER + secure cookies)"
git push
```

---

## المرحلة 1 — سابدومين DuckDNS للـ API

1. ادخل https://www.duckdns.org بحساب GitHub (نفس حساب الجيم).
2. اعمل دومين جديد: `sams-api` → اضغط **add domain**.
3. في خانة الـ IP بتاعته حط `187.77.111.27` واضغط **update ip**.

> بعد دقيقة `sams-api.duckdns.org` هيوجّه على سيرفرك.

---

## المرحلة 2 — مستخدم لينكس ورفع الكود

افتح **Terminal** بتاع Hostinger (بيدخل كـ **root**). كل الأوامر الجاية كـ root
إلا لما أقول `sudo -u azr`.

```bash
# 1) أنشئ مستخدم azr (هتعيد استخدامه لمشاريع تانية)
adduser --disabled-password --gecos "" azr

# 2) اسمح لـ nginx (www-data) يدخل home المستخدم لاحقًا (للـ static/media)
chmod 755 /home/azr

# 3) اعمل clone للريبو باسم المستخدم sams
sudo -u azr git clone https://github.com/AmrIbrahim41/SAMS.git /home/azr/SAMS
```

> لو الريبو Private هيطلب Personal Access Token عند الـ clone.

---

## المرحلة 3 — قاعدة بيانات منفصلة (Postgres)

نفس سيرفر Postgres بتاع الجيم، بس **داتابيز ومستخدم مستقلين** (معزولين بالصلاحيات):

```bash
sudo -u postgres psql <<'SQL'
CREATE DATABASE sams_db;
CREATE USER sams_user WITH PASSWORD 'ضع-باسورد-قوي-هنا';
ALTER ROLE sams_user SET client_encoding TO 'utf8';
ALTER ROLE sams_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE sams_user SET timezone TO 'Africa/Cairo';
GRANT ALL PRIVILEGES ON DATABASE sams_db TO sams_user;
\c sams_db
GRANT ALL ON SCHEMA public TO sams_user;
SQL
```

> `sams_user` ملوش أي صلاحية على `tfg_sys_db` — عزل تام على مستوى القاعدة.

---

## المرحلة 4 — venv + `.env` + migrate

```bash
# كل ده باسم المستخدم sams
sudo -u azr bash
cd ~/SAMS/backend

python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements-prod.txt   # فيه gunicorn + psycopg2

# ملف البيئة
cp .env.example .env
nano .env
```

اضبط `.env` بالقيم دي (بدّل الباسوردات والـ SECRET_KEY):

```ini
SECRET_KEY=<سلسلة عشوائية طويلة جدًا>
DEBUG=False
ALLOWED_HOSTS=sams-api.duckdns.org,187.77.111.27

# قاعدة البيانات المنفصلة
DB_NAME=sams_db
DB_USER=sams_user
DB_PASSWORD=<نفس الباسورد اللي فوق>
DB_HOST=127.0.0.1
DB_PORT=5432

# رابط فرونت Vercel بالظبط (https ومن غير / في الآخر) — هتعرفه في المرحلة 6،
# دلوقتي حط اللي عندك وارجع عدّله بعد نشر Vercel
CORS_ORIGINS=https://your-app.vercel.app

ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@sams.local
ADMIN_PASSWORD=<باسورد أدمن قوي>
```

> لتوليد SECRET_KEY:
> `python -c "import secrets;print(secrets.token_urlsafe(64))"`

بعد الحفظ:

```bash
python manage.py migrate
python manage.py seed_admin
python manage.py collectstatic --noinput
exit    # ارجع لـ root
```

---

## المرحلة 5 — خدمة gunicorn (systemd) على البورت 8001

```bash
cat > /etc/systemd/system/sams-gunicorn.service <<'UNIT'
[Unit]
Description=SAMS gunicorn
After=network.target postgresql.service

[Service]
User=azr
Group=azr
WorkingDirectory=/home/azr/SAMS/backend
Environment=DJANGO_SETTINGS_MODULE=config.settings
ExecStart=/home/azr/SAMS/backend/venv/bin/gunicorn \
    --workers 3 \
    --bind 127.0.0.1:8001 \
    config.wsgi:application
Restart=always

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable --now sams-gunicorn
systemctl status sams-gunicorn --no-pager
```

> لازم يطلع `active (running)`. البورت **8001** (الجيم على 8000) → مفيش تعارض.

---

## المرحلة 6 — nginx (سابدومين) + HTTPS

بلوك nginx منفصل خالص عن بلوك الجيم — بيعمل reverse proxy للـ API
ويخدم `/static/` و`/media/` لصفحة أدمن Django:

```bash
cat > /etc/nginx/sites-available/sams <<'NGINX'
server {
    listen 80;
    server_name sams-api.duckdns.org;

    client_max_body_size 100M;   # رفع صور/فيديوهات

    location /static/ {
        alias /home/azr/SAMS/backend/staticfiles/;
    }
    location /media/ {
        alias /home/azr/SAMS/backend/media/;
    }
    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

ln -s /etc/nginx/sites-available/sams /etc/nginx/sites-enabled/sams
nginx -t          # لازم syntax is ok
systemctl reload nginx
```

اختبار سريع (HTTP لسه):
```bash
curl -I http://sams-api.duckdns.org/django-admin/
```

بعدها فعّل **HTTPS** (مجاني، Let's Encrypt):
```bash
certbot --nginx -d sams-api.duckdns.org
```
اختار redirect لـ HTTPS. certbot هيعدّل بلوك nginx تلقائيًا ويجدد لوحده.

تأكيد:
```bash
curl -I https://sams-api.duckdns.org/api/   # المفروض يرد
```

---

## المرحلة 7 — Vercel (الفرونت)

1. في مشروع SAMS على Vercel → **Settings → Environment Variables**:
   ```
   VITE_API_BASE = https://sams-api.duckdns.org
   ```
   (من غير `/` في الآخر ومن غير `/api` — الكود بيضيف `/api` لوحده.)
2. **Redeploy** المشروع عشان المتغير ياخد مفعوله.
3. اقفل الحلقة (CORS): على السيرفر عدّل `CORS_ORIGINS` في `.env` برابط Vercel
   الحقيقي، وأعد التشغيل:
   ```bash
   sudo -u azr nano /home/azr/SAMS/backend/.env   # ظبط CORS_ORIGINS
   systemctl restart sams-gunicorn
   ```

---

## تحديث الكود بعدين (بعد أي git push)

```bash
sudo -u azr bash
cd ~/SAMS
git pull
source backend/venv/bin/activate
cd backend
pip install -r requirements-prod.txt      # لو المتطلبات اتغيرت
python manage.py migrate                   # لو فيه migrations
python manage.py collectstatic --noinput   # لو static اتغير
exit
systemctl restart sams-gunicorn
```
(الفرونت على Vercel بيعيد النشر تلقائيًا مع كل push.)

---

## 🧹 التنظيف وقت ما تخلص المشروع (يمسح SAMS بالكامل، الجيم سليم)

```bash
# 1) وقّف وامسح الخدمة
systemctl disable --now sams-gunicorn
rm /etc/systemd/system/sams-gunicorn.service
systemctl daemon-reload

# 2) امسح قاعدة البيانات والمستخدم
sudo -u postgres psql -c "DROP DATABASE IF EXISTS sams_db;"
sudo -u postgres psql -c "DROP USER IF EXISTS sams_user;"

# 3) شيل بلوك nginx وشهادة SSL
rm -f /etc/nginx/sites-enabled/sams /etc/nginx/sites-available/sams
certbot delete --cert-name sams-api.duckdns.org
systemctl reload nginx

# 4) امسح مجلد المشروع فقط (المستخدم azr بيفضل موجود لمشاريعك التانية)
rm -rf /home/azr/SAMS
```
كمان امسح دومين `sams-api` من duckdns.org، واحذف المشروع من Vercel لو حبيت.
**سيستم الجيم (tfg / tfg_sys_db / tfg-gunicorn / azr-tfg.duckdns.org) مايتأثرش بأي خطوة،
والمستخدم `azr` سليم لباقي مشاريعك.**

---

## ملاحظات
- الجيم على البورت 8000 وقاعدة `tfg_sys_db`؛ SAMS على 8001 وقاعدة `sams_db` — **صفر تعارض**.
- `db.sqlite3` و`media/` و`.env` **مش** بيترفعوا على GitHub (متظبطين في `.gitignore`) — على السيرفر بتبدأ بقاعدة نضيفة.
- لو صفحة أدمن Django مطلعتش static بعد HTTPS، اتأكد إن `/home/azr` صلاحيته `755` وإن `collectstatic` اتعمل.
