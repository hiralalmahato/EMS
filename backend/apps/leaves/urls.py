from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'types', views.LeaveTypeViewSet, basename='leave-type')
router.register(r'balances', views.LeaveBalanceViewSet, basename='leave-balance')
router.register(r'requests', views.LeaveRequestViewSet, basename='leave-request')

urlpatterns = [
    path('', include(router.urls)),
]
