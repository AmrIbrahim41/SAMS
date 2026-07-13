from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0003_alter_section_key"),
    ]

    operations = [
        migrations.CreateModel(
            name="CommitteeMember",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "committee",
                    models.CharField(
                        choices=[
                            ("assembly", "لجنة الجمعية العمومية"),
                            ("design", "لجنة التصميم"),
                            ("central-bank", "لجنة البنك المركزي"),
                            ("social", "لجنة السوشيال ميديا والتسويق"),
                            ("board", "لجنة مجلس الإدارة"),
                            ("audit", "لجنة مراقبة الحسابات"),
                            ("shareholders", "لجنة المساهمين (الرعاة)"),
                            ("photography", "لجنة التصوير"),
                        ],
                        max_length=40,
                    ),
                ),
                (
                    "role",
                    models.CharField(
                        choices=[
                            ("head", "Head"),
                            ("co_head", "Co-Head"),
                            ("coordinator", "Coordinator"),
                            ("member", "Member"),
                            ("organizer", "Organizer"),
                        ],
                        max_length=20,
                    ),
                ),
                ("name", models.CharField(max_length=120)),
                ("photo", models.ImageField(blank=True, null=True, upload_to="members/")),
                ("branch", models.CharField(blank=True, help_text="الفرع + الفرقة", max_length=120)),
                ("major", models.CharField(blank=True, help_text="التخصص", max_length=120)),
                ("bio", models.TextField(blank=True, help_text="نبذة (للقيادة أساسًا)")),
                ("order", models.PositiveIntegerField(default=0)),
                ("is_published", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ["committee", "role", "order", "id"],
            },
        ),
    ]
