from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0009_alter_participant_branch"),
    ]

    operations = [
        migrations.CreateModel(
            name="SocialLinks",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("facebook", models.URLField(blank=True, default="", max_length=400)),
                ("instagram", models.URLField(blank=True, default="", max_length=400)),
                ("tiktok", models.URLField(blank=True, default="", max_length=400)),
                ("linkedin", models.URLField(blank=True, default="", max_length=400)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "روابط السوشيال ميديا",
                "verbose_name_plural": "روابط السوشيال ميديا",
            },
        ),
    ]
