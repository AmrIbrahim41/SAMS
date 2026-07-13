from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0006_seminaritem"),
    ]

    operations = [
        migrations.AddField(
            model_name="committeemember",
            name="focus",
            field=models.CharField(blank=True, default="50% 30%", help_text="نقطة تركيز الصورة (object-position)", max_length=16),
        ),
        migrations.AddField(
            model_name="supervisor",
            name="focus",
            field=models.CharField(blank=True, default="50% 30%", help_text="نقطة تركيز الصورة (object-position)", max_length=16),
        ),
    ]
