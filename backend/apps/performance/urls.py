from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'goals', views.PerformanceGoalViewSet, basename='performance-goal')
router.register(r'reviews', views.PerformanceReviewViewSet, basename='performance-review')

urlpatterns = [path('', include(router.urls))]
