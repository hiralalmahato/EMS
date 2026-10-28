from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from apps.accounts.permissions import IsAdminOrHR
from apps.employees.models import Employee
from .models import Task, TaskComment
from .serializers import TaskSerializer, TaskCommentSerializer


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['assigned_to', 'priority', 'status']
    search_fields = ['title', 'description']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        qs = Task.objects.select_related('assigned_to__user', 'assigned_by').annotate(
            comments_count=Count('comments')
        )
        if user.role == 'employee':
            try:
                emp = Employee.objects.get(user=user)
                return qs.filter(assigned_to=emp)
            except Employee.DoesNotExist:
                return qs.none()
        return qs

    def get_permissions(self):
        if self.action in ('create', 'destroy'):
            return [IsAdminOrHR()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(assigned_by=self.request.user)

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.status == 'completed' and not instance.completed_at:
            instance.completed_at = timezone.now()
            instance.save(update_fields=['completed_at'])


class TaskCommentViewSet(viewsets.ModelViewSet):
    serializer_class = TaskCommentSerializer

    def get_queryset(self):
        task_pk = self.kwargs.get('task_pk')
        return TaskComment.objects.filter(task_id=task_pk).select_related('author')

    def perform_create(self, serializer):
        serializer.save(author=self.request.user, task_id=self.kwargs['task_pk'])
