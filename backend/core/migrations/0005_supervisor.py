from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0004_committeemember"),
    ]

    operations = [
        migrations.CreateModel(
            name="Supervisor",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120)),
                (
                    "title",
                    models.CharField(
                        blank=True,
                        help_text="الصفة العلمية / المنصب، مثل: أستاذ دكتور — المشرف العام",
                        max_length=160,
                    ),
                ),
                ("bio", models.TextField(blank=True, help_text="نبذة")),
                ("photo", models.ImageField(blank=True, null=True, upload_to="supervisors/")),
                ("link", models.CharField(blank=True, help_text="رابط تعريفي اختياري (لينكدإن مثلاً)", max_length=300)),
                ("order", models.PositiveIntegerField(default=0)),
                ("is_published", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ["order", "id"],
            },
        ),
    ]
