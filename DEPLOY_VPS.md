# SAMS — دليل النشر الكامل على الـ VPS (مرجع)

> الباك إند لمشروع SAMS منشور على الـ Hostinger VPS **جنب سيستم الجيم بس معزول تمامًا**.
> الفرونت على **Vercel**. النشر اتعمل يوم 2026-07-19.
> الملف ده مرجعك لأي تحديث أو صيانة أو **حذف** المشروع لاحقًا.

---

## 1) نظرة عامة والمعمار

| العنصر | القيمة الفعلية |
|---|---|
| السيرفر | Hostinger KVM2، Ubuntu 24.04، IP `187.77.111.27` |
| مستخدم لينكس | **`azr`** (UID 1001) — قابل لإعادة الاستخدام لمشاريع تانية، **مايتحذفش** عند حذف SAMS |
| مجلد الكود | `/home/azr/SAMS` |
| الريبو | `github.com/AmrIbrahim41/SAMS` (Public) |
| قاعدة البيانات | Postgres — قاعدة **`sams_db`** ومستخدم **`sams_user`** (منفصلين تمامًا عن الجيم) |
| الخدمة (backend) | systemd **`sams-gunicorn`** على `127.0.0.1:8001` |
| ملف الخدمة | `/etc/nginx/sites-available/sams` (nginx) + `/etc/systemd/system/sams-gunicorn.service` |
| دومين الـ API | **`https://sams-api.duckdns.org`** (DuckDNS، نفس الـ IP) |
| شهادة SSL | Let's Encrypt (تنتهي 2026-10-17، تتجدد تلقائيًا) |
| الفرونت (Vercel) | **`https://sams-sigma-six.vercel.app`** |

**العزل عن الجيم:** الجيم على مستخدم `tfg` / قاعدة `tfg_sys_db` / خدمة `tfg-gunicorn` بورت 8000 / دومين `azr-tfg.duckdns.org`. SAMS كله منفصل (مستخدم azr، قاعدة sams_db، بورت 8001، دومين sams-api). **صفر تداخل** — حذف SAMS مايأثّرش على الجيم إطلاقًا.

---

## 2) المستخدمون والصلاحيات (مهم تفهمه)

- **root** = مدير السيرفر، أعلى صلاحية، بيعمل أي حاجة. (Terminal بتاع Hostinger بيفتح كـ root.)
- **tfg** و **azr** = مستخدمان عاديان **متساويان** في الصلاحية؛ كل واحد بيتحكم في ملفاته بس ومايلمسش ملفات التاني. ده أساس العزل.
- فرق مهم: **tfg عنده `sudo`** (يقدر يعمل حاجات root بباسورده)، لكن **azr معندوش `sudo`** — عشان كده أوامر النظام لـ SAMS (زي `systemctl restart`) بنعملها كـ **root مباشرة**، مش من جوه azr.

**الفرق بين طريقتي الدخول لمستخدم:**

| | `su - tfg` | `sudo -u azr bash` | `sudo -iu azr` |
|---|---|---|---|
| بيطلب باسورد؟ | آه (باسورد tfg) | لأ (لأنك root) | لأ |
| البيئة | كاملة (login) | ناقصة (non-login) | كاملة (login) |
| المجلد الابتدائي | `/home/tfg` | مكانك الحالي | `/home/azr` |

خلاصة: `su -` = دخول كامل رسمي بباسورد. `sudo -u ... bash` = دخول سريع ناقص من غير باسورد. `sudo -iu ...` = دخول كامل من غير باسورد (متاح لأنك root).

---

## 3) خطوات النشر اللي اتعملت (للمرجع)

### أ) تجهيز على الجهاز
تعديل تحضيري في `backend/config/settings.py` (تأمين HTTPS خلف nginx):
```python
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
```
ثم `git push`.

### ب) سابدومين DuckDNS
على duckdns.org (حساب GitHub): أضف دومين **`sams-api`** ووجّهه على IP `187.77.111.27`.

### ج) مستخدم لينكس + رفع الكود (كـ root)
```bash
adduser --disabled-password --gecos "" azr
chmod 755 /home/azr                 # عشان nginx يقدر يخدم static/media
sudo -u azr git clone https://github.com/AmrIbrahim41/SAMS.git /home/azr/SAMS
```

### د) البيئة الافتراضية + المتطلبات (كـ azr)
```bash
sudo -u azr bash
cd ~/SAMS/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements-prod.txt   # Django + gunicorn + psycopg2 + Pillow
```

### هـ) قاعدة بيانات منفصلة (كـ root)
```bash
sudo -u postgres psql <<'SQL'
CREATE DATABASE sams_db;
CREATE USER sams_user WITH PASSWORD 'الباسورد-القوي-اللي-اخترته';
ALTER ROLE sams_user SET client_encoding TO 'utf8';
ALTER ROLE sams_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE sams_user SET timezone TO 'Africa/Cairo';
GRANT ALL PRIVILEGES ON DATABASE sams_db TO sams_user;
\c sams_db
GRANT ALL ON SCHEMA public TO sams_user;
SQL
```
> باسورد القاعدة لازم يطابق `DB_PASSWORD` في ملف `.env`. لو غيّرته في مكان، غيّره في التاني.

### و) ملف `.env` (كـ azr، في `~/SAMS/backend/.env`)
```ini
SECRET_KEY=<سلسلة عشوائية طويلة — python -c "import secrets;print(secrets.token_urlsafe(64))">
DEBUG=False
ALLOWED_HOSTS=sams-api.duckdns.org,187.77.111.27
DB_NAME=sams_db
DB_USER=sams_user
DB_PASSWORD=<نفس باسورد القاعدة>
DB_HOST=127.0.0.1
DB_PORT=5432
CORS_ORIGINS=https://sams-sigma-six.vercel.app
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@sams.local
ADMIN_PASSWORD=<باسورد لوحة الأدمن>
```
> ملاحظة: `settings.py` بيبدّل لـ Postgres تلقائيًا لما `DB_NAME` يكون متعبّى؛ لو فاضي بيستخدم SQLite.

### ز) بناء قاعدة البيانات + الأدمن + الملفات الثابتة (كـ azr، venv مفعّل)
```bash
python manage.py migrate
python manage.py seed_admin
python manage.py collectstatic --noinput
exit    # رجوع لـ root
```

### ح) خدمة gunicorn (كـ root)
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
ExecStart=/home/azr/SAMS/backend/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:8001 config.wsgi:application
Restart=always

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable --now sams-gunicorn
systemctl status sams-gunicorn --no-pager   # المتوقع: active (running)
```

### ط) nginx + HTTPS (كـ root)
```bash
cat > /etc/nginx/sites-available/sams <<'NGINX'
server {
    listen 80;
    server_name sams-api.duckdns.org;
    client_max_body_size 100M;

    location /static/ { alias /home/azr/SAMS/backend/staticfiles/; }
    location /media/  { alias /home/azr/SAMS/backend/media/; }
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
nginx -t
systemctl reload nginx

certbot --nginx -d sams-api.duckdns.org     # يفعّل HTTPS + auto-renew
```

### ي) Vercel (الفرونت)
- **Settings → Environment Variables**: `VITE_API_BASE = https://sams-api.duckdns.org` (Production) ثم **Redeploy**.
- الـ `CORS_ORIGINS` في `.env` على السيرفر = رابط Vercel (اتظبط فوق).

---

## 4) تحديث الموقع بعد أي تعديل (الطريقة اليومية)

بعد `git push` من الجهاز، على Terminal السيرفر (كـ **root**) سطر واحد:
```bash
/home/azr/SAMS/deploy.sh
```
السكربت بيعمل: `git pull` + `pip install` + `migrate` + `collectstatic` (كـ azr) ثم `systemctl restart sams-gunicorn` (كـ root).

**إعداد السكربت لمرة واحدة** (لو لسه):
```bash
sudo -u azr git -C /home/azr/SAMS pull
chmod +x /home/azr/SAMS/deploy.sh
```

**الطريقة اليدوية (بديل السكربت):**
```bash
sudo -u azr git -C /home/azr/SAMS pull
sudo -u azr /home/azr/SAMS/backend/venv/bin/pip install -r /home/azr/SAMS/backend/requirements-prod.txt
sudo -u azr /home/azr/SAMS/backend/venv/bin/python /home/azr/SAMS/backend/manage.py migrate --noinput
sudo -u azr /home/azr/SAMS/backend/venv/bin/python /home/azr/SAMS/backend/manage.py collectstatic --noinput
systemctl restart sams-gunicorn
```
> الفرونت على Vercel بيعيد النشر تلقائيًا مع كل push للـ `main`.

---

## 5) أوامر صيانة سريعة (كـ root)

```bash
systemctl status sams-gunicorn --no-pager     # حالة الخدمة
systemctl restart sams-gunicorn                # إعادة تشغيل
journalctl -u sams-gunicorn -n 50 --no-pager   # آخر 50 سطر لوج (للأخطاء)
nginx -t && systemctl reload nginx             # بعد تعديل بلوك nginx
curl -I https://sams-api.duckdns.org/django-admin/   # فحص إن الـ API حي (المتوقع 302)
```

**دخول قاعدة بيانات SAMS بس:**
```bash
sudo -u postgres psql sams_db
```

---

## 6) 🧹 حذف المشروع بالكامل (وقت ما تخلص)

كل الأوامر كـ **root**. ده بيمسح SAMS كله، والجيم + المستخدم azr يفضلوا سليمين.

```bash
# 1) وقّف وامسح الخدمة
systemctl disable --now sams-gunicorn
rm /etc/systemd/system/sams-gunicorn.service
systemctl daemon-reload

# 2) امسح قاعدة البيانات والمستخدم (ده بيمسح كل بيانات الموقع نهائيًا)
sudo -u postgres psql -c "DROP DATABASE IF EXISTS sams_db;"
sudo -u postgres psql -c "DROP USER IF EXISTS sams_user;"

# 3) شيل بلوك nginx وشهادة SSL
rm -f /etc/nginx/sites-enabled/sams /etc/nginx/sites-available/sams
certbot delete --cert-name sams-api.duckdns.org
systemctl reload nginx

# 4) امسح مجلد المشروع فقط (المستخدم azr يفضل موجود لمشاريعك التانية)
rm -rf /home/azr/SAMS
```

بعدها (اختياري): امسح دومين `sams-api` من duckdns.org، واحذف مشروع SAMS من Vercel.

> **ضمان:** الجيم (tfg / tfg_sys_db / tfg-gunicorn / azr-tfg.duckdns.org) مايتأثرش بأي خطوة، والمستخدم `azr` سليم لباقي مشاريعك.

**لو عايز تمسح بيانات القاعدة بس وتسيب الموقع شغّال** (تبدأ من نضيف): امسح القاعدة وأعِد إنشاءها ثم `migrate` + `seed_admin`:
```bash
sudo -u postgres psql -c "DROP DATABASE sams_db;"
sudo -u postgres psql -c "CREATE DATABASE sams_db; GRANT ALL PRIVILEGES ON DATABASE sams_db TO sams_user;"
sudo -u postgres psql -d sams_db -c "GRANT ALL ON SCHEMA public TO sams_user;"
sudo -u azr /home/azr/SAMS/backend/venv/bin/python /home/azr/SAMS/backend/manage.py migrate
sudo -u azr /home/azr/SAMS/backend/venv/bin/python /home/azr/SAMS/backend/manage.py seed_admin
systemctl restart sams-gunicorn
```

---

## 7) ملاحظات
- المساحة على القرص مشتركة مع الجيم — لو هترفع فيديوهات كبيرة استخدم روابط يوتيوب/درايف بدل رفع ملفات ثقيلة.
- `db.sqlite3` و`media/` و`.env` **مش** بيترفعوا على GitHub (متظبطين في `.gitignore`).
- بيانات دخول الأدمن هي `ADMIN_USERNAME` / `ADMIN_PASSWORD` من `.env`.
- لو صفحة أدمن Django مطلعتش تنسيق (static)، اتأكد إن `/home/azr` صلاحيته `755` وإن `collectstatic` اتعمل.
