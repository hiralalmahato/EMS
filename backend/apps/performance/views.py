from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from apps.accounts.permissions import IsAdminOrHR
from apps.employees.models import Employee
from .models import PerformanceGoal, PerformanceReview
from .serializers import PerformanceGoalSerializer, PerformanceReviewSerializer


class PerformanceGoalViewSet(viewsets.ModelViewSet):
    serializer_class = PerformanceGoalSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['employee', 'status']
    search_fields = ['title']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        qs = PerformanceGoal.objects.select_related('employee__user')
        if user.role == 'employee':
            try:
                emp = Employee.objects.get(user=user)
                return qs.filter(employee=emp)
            except Employee.DoesNotExist:
                return qs.none()
        return qs

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdminOrHR()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class PerformanceReviewViewSet(viewsets.ModelViewSet):
    serializer_class = PerformanceReviewSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['employee', 'is_finalized']

    def get_queryset(self):
        user = self.request.user
        qs = PerformanceReview.objects.select_related('employee__user', 'reviewer')
        if user.role == 'employee':
            try:
                emp = Employee.objects.get(user=user)
                return qs.filter(employee=emp, is_finalized=True)
            except Employee.DoesNotExist:
                return qs.none()
        return qs

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdminOrHR()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(reviewer=self.request.user)
