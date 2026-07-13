from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0005_supervisor"),
    ]

    operations = [
        migrations.CreateModel(
            name="SeminarItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("kind", models.CharField(choices=[("image", "صورة"), ("video", "فيديو")], default="image", max_length=10)),
                ("title", models.CharField(blank=True, max_length=200)),
                (
                    "image",
                    models.ImageField(blank=True, null=True, help_text="الصورة، أو صورة الغلاف لفيديو الرابط", upload_to="seminar/"),
                ),
                (
                    "video",
                    models.FileField(blank=True, null=True, help_text="ملف فيديو مرفوع (mp4)", upload_to="seminar/"),
                ),
                ("url", models.CharField(blank=True, help_text="رابط فيديو خارجي (يوتيوب مثلاً)", max_length=400)),
                ("order", models.PositiveIntegerField(default=0)),
                ("is_published", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ["order", "-created_at"],
            },
        ),
    ]
