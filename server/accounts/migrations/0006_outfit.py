# Generated by Django 5.2.4 on 2025-07-22 19:44

import accounts.models
import accounts.storage
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_clothingitem'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Outfit',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True)),
                ('category', models.CharField(choices=[('Casual', 'Casual'), ('Work', 'Work'), ('Date Night', 'Date Night'), ('Formal', 'Formal'), ('Party', 'Party'), ('Weekend', 'Weekend'), ('Travel', 'Travel'), ('Sport', 'Sport')], default='Casual', max_length=50)),
                ('occasion', models.CharField(blank=True, max_length=100)),
                ('image', models.ImageField(blank=True, null=True, storage=accounts.storage.MediaStorage(), upload_to=accounts.models.outfit_image_path)),
                ('tags', models.JSONField(blank=True, default=list)),
                ('liked', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='outfits', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
