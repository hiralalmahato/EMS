from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'departments', views.DepartmentViewSet, basename='department')
router.register(r'designations', views.DesignationViewSet, basename='designation')

urlpatterns = [
    path('', include(router.urls)),
]
