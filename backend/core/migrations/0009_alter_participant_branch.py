from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0008_participant_delete_members"),
    ]

    operations = [
        migrations.AlterField(
            model_name="participant",
            name="branch",
            field=models.CharField(
                max_length=20,
                blank=True,
                choices=[
                    ("cairo", "القاهرة"),
                    ("alex", "الإسكندرية"),
                    ("portsaid", "بورسعيد"),
                    ("minya", "المنيا"),
                    ("assiut", "أسيوط"),
                    ("gharbia", "الغربية (طنطا)"),
                    ("dakahlia", "الدقهلية"),
                ],
            ),
        ),
    ]
