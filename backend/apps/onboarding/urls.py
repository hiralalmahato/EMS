from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'templates', views.OnboardingTemplateViewSet, basename='onboarding-template')
router.register(r'tasks', views.OnboardingTaskViewSet, basename='onboarding-task')
router.register(r'offboarding', views.OffboardingRecordViewSet, basename='offboarding')

urlpatterns = [path('', include(router.urls))]
