from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),
    
    # Profile endpoints
    path('profile/', views.profile, name='profile'),
    path('update-profile/', views.update_profile, name='update_profile'),
    path('upload-avatar/', views.upload_avatar, name='upload_avatar'),
    
    # Clothing items endpoints
    path('clothing-items/', views.clothing_items, name='clothing_items'),
    path('clothing-items/<int:item_id>/', views.clothing_item_detail, name='clothing_item_detail'),
    
    # Outfit endpoints
    path('outfits/', views.outfits, name='outfits'),
    path('outfits/<int:outfit_id>/', views.outfit_detail, name='outfit_detail'),
    path('outfits/<int:outfit_id>/like/', views.like_outfit, name='like_outfit'),
    
    # Health check endpoint for debugging
    path('health/', views.health_check, name='health_check'),
]