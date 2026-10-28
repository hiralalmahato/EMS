from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.EmployeeViewSet, basename='employee')

urlpatterns = [
    path('', include(router.urls)),
    path('<int:employee_pk>/documents/',
         views.EmployeeDocumentViewSet.as_view({'get': 'list', 'post': 'create'}),
         name='employee-documents'),
    path('<int:employee_pk>/documents/<int:pk>/',
         views.EmployeeDocumentViewSet.as_view({'get': 'retrieve', 'delete': 'destroy'}),
         name='employee-document-detail'),
]
