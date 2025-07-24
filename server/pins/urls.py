from django.urls import path
from . import views

urlpatterns = [
    path('', views.PinListCreateView.as_view(), name='pin-list-create'),
    path('<int:pk>/', views.PinDetailView.as_view(), name='pin-detail'),
    path('categories/', views.CategoryListCreateView.as_view(), name='category-list-create'),
]