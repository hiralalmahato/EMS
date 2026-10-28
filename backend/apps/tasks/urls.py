from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.TaskViewSet, basename='task')

urlpatterns = [
    path('', include(router.urls)),
    path('<int:task_pk>/comments/',
         views.TaskCommentViewSet.as_view({'get': 'list', 'post': 'create'}),
         name='task-comments'),
    path('<int:task_pk>/comments/<int:pk>/',
         views.TaskCommentViewSet.as_view({'delete': 'destroy'}),
         name='task-comment-detail'),
]
