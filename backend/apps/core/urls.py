from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'holidays', views.HolidayViewSet)
router.register(r'work-schedules', views.WorkScheduleViewSet)

urlpatterns = [
    path('settings/', views.CompanySettingsView.as_view(), name='company-settings'),
    path('', include(router.urls)),
]
