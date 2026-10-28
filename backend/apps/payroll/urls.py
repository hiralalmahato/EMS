from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'records', views.PayrollViewSet, basename='payroll')
router.register(r'revisions', views.SalaryRevisionViewSet, basename='salary-revision')

urlpatterns = [
    path('', include(router.urls)),
]
