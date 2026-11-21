from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('adm', '0005_userrole'),
    ]

    operations = [
        migrations.AddField(
            model_name='category',
            name='display_order',
            field=models.IntegerField(default=1),
        ),
    ]
