# Register your models here.
from django.contrib import admin
from .models import UserProfile, ClothingItem

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'bio', 'followers_count', 'following_count', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'user__email', 'bio')
    readonly_fields = ('created_at',)

@admin.register(ClothingItem)
class ClothingItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'category', 'brand', 'size', 'color', 'is_favorite', 'is_worn', 'created_at')
    list_filter = ('category', 'is_favorite', 'created_at', 'brand')
    search_fields = ('name', 'brand', 'user__username', 'tags')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('user', 'name', 'category', 'image')
        }),
        ('Details', {
            'fields': ('brand', 'size', 'color', 'tags')
        }),
        ('Usage', {
            'fields': ('is_favorite', 'is_worn', 'last_worn')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )