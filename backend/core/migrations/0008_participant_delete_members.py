from django.db import migrations, models


def delete_members(apps, schema_editor):
    """حذف كل من دوره 'عضو' نهائيًا (اتفقنا نستبدل الأعضاء بالمنظمين)."""
    CommitteeMember = apps.get_model("core", "CommitteeMember")
    CommitteeMember.objects.filter(role="member").delete()


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0007_focus"),
    ]

    operations = [
        migrations.CreateModel(
            name="Participant",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120)),
                (
                    "committee",
                    models.CharField(
                        max_length=40,
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
                    ),
                ),
                (
                    "branch",
                    models.CharField(
                        max_length=10, blank=True,
                        choices=[("boys", "بنين"), ("girls", "بنات")],
                    ),
                ),
                (
                    "year",
                    models.CharField(
                        max_length=2, blank=True,
                        choices=[
                            ("1", "الفرقة الأولى"),
                            ("2", "الفرقة الثانية"),
                            ("3", "الفرقة الثالثة"),
                            ("4", "الفرقة الرابعة"),
                        ],
                    ),
                ),
                ("points", models.IntegerField(default=0)),
                ("is_published", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ["committee", "-points", "name"],
            },
        ),
        migrations.RunPython(delete_members, noop),
    ]
