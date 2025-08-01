from django.db import models
from django.contrib.auth.models import User
from .storage import MediaStorage
import uuid


def user_avatar_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f'{uuid.uuid4()}.{ext}'
    return f'avatars/{instance.user.id}/{filename}'


def clothing_item_image_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f'{uuid.uuid4()}.{ext}'
    return f'clothing/{instance.user.id}/{filename}'


def outfit_image_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f'{uuid.uuid4()}.{ext}'
    return f'outfits/{instance.user.id}/{filename}'


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(max_length=500, blank=True)
    avatar = models.ImageField(
        upload_to=user_avatar_path,
        null=True,
        blank=True,
        storage=MediaStorage  
    )
    followers_count = models.IntegerField(default=0)
    following_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}'s profile"


class ClothingItem(models.Model):
    CATEGORY_CHOICES = [
        ('Tops', 'Tops'),
        ('Bottoms', 'Bottoms'),
        ('Dresses', 'Dresses'),
        ('Outerwear', 'Outerwear'),
        ('Shoes', 'Shoes'),
        ('Accessories', 'Accessories'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='clothing_items')
    name = models.CharField(max_length=200)
    brand = models.CharField(max_length=100, blank=True, default='')
    size = models.CharField(max_length=50, blank=True, default='')
    color = models.CharField(max_length=100, blank=True, default='')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    image = models.ImageField(
        upload_to=clothing_item_image_path,
        null=True,
        blank=True,
        storage=MediaStorage 
    )
    image_url = models.URLField(blank=True, null=True, help_text="URL reference for external images")
    tags = models.JSONField(default=list, blank=True)
    is_favorite = models.BooleanField(default=False)
    is_worn = models.BooleanField(default=False)
    last_worn = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username}'s {self.name}"

    def get_display_image(self):
        if self.image:
            return self.image.url
        elif self.image_url:
            return self.image_url
        return None

    @property
    def is_external_image(self):
        return bool(self.image_url and not self.image)


class Outfit(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='outfits')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=50, default='Casual')
    occasion = models.CharField(max_length=100, blank=True)
    image = models.ImageField(
        upload_to=outfit_image_path,
        null=True,
        blank=True,
        storage=MediaStorage 
    )
    tags = models.JSONField(default=list, blank=True)
    liked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.title}"