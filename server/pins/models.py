
from django.db import models
from django.contrib.auth.models import User

class Pin(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    image_url = models.URLField(max_length=500)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pins', null=True, blank=True)
    width = models.IntegerField(default=200)
    height = models.IntegerField(default=300)
    likes = models.IntegerField(default=0)
    saves = models.IntegerField(default=0)
    tags = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def get_tags_list(self):
        return [tag.strip() for tag in self.tags.split(',') if tag.strip()]

class Category(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name