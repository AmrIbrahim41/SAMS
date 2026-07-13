from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_section_icon_section_link_label_section_link_url'),
    ]

    operations = [
        migrations.AlterField(
            model_name='section',
            name='key',
            field=models.CharField(
                help_text='أي اسم مميّز للقسم (مثل: hero للصفحة الرئيسية). يقبل عربي ومسافات.',
                max_length=60, unique=True),
        ),
    ]
