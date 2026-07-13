import os
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = "ينشئ (أو يحدّث) سوبر يوزر من متغيرات البيئة. آمن لإعادة التشغيل."

    def handle(self, *args, **options):
        username = os.getenv("ADMIN_USERNAME", "admin")
        email = os.getenv("ADMIN_EMAIL", "admin@sams.local")
        password = os.getenv("ADMIN_PASSWORD", "SamsAdmin#2026")

        user, created = User.objects.get_or_create(username=username)
        user.email = email
        user.is_staff = True
        user.is_superuser = True
        user.set_password(password)
        user.save()

        if created:
            self.stdout.write(self.style.SUCCESS(f"تم إنشاء السوبر يوزر: {username}"))
        else:
            self.stdout.write(self.style.WARNING(f"تم تحديث السوبر يوزر: {username}"))
        self.stdout.write("غيّر الباسورد من .env (ADMIN_PASSWORD) على الإنتاج.")
