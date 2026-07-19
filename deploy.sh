#!/usr/bin/env bash
# نشر تحديثات SAMS على السيرفر.
# شغّله كـ root:   /home/azr/SAMS/deploy.sh
# (بيعمل خطوات التطبيق باسم المستخدم azr، ويعيد تشغيل الخدمة كـ root.)
set -e

APP=/home/azr/SAMS
VENV=$APP/backend/venv/bin

echo "== 1/4 git pull =="
sudo -u azr git -C "$APP" pull

echo "== 2/4 pip install =="
sudo -u azr "$VENV/pip" install -r "$APP/backend/requirements-prod.txt"

echo "== 3/4 migrate =="
sudo -u azr "$VENV/python" "$APP/backend/manage.py" migrate --noinput

echo "== 4/4 collectstatic =="
sudo -u azr "$VENV/python" "$APP/backend/manage.py" collectstatic --noinput

echo "== restart service =="
systemctl restart sams-gunicorn

echo "✅ SAMS updated"
