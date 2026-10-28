from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q
from django_filters.rest_framework import DjangoFilterBackend

from apps.accounts.permissions import IsAdminOrHR
from .models import Department, Designation
from .serializers import DepartmentListSerializer, DepartmentDetailSerializer, DesignationSerializer


class DepartmentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrHR]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    filterset_fields = ['is_active']

    def get_queryset(self):
        return Department.objects.annotate(
            employee_count=Count('employees', filter=Q(employees__status='active'))
        ).select_related('head__user')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return DepartmentDetailSerializer
        return DepartmentListSerializer

    def destroy(self, request, *args, **kwargs):
        department = self.get_object()
        active_employees = department.employees.filter(status='active').count()
        if active_employees > 0:
            return Response(
                {'detail': f'Cannot delete department with {active_employees} active employee(s). Reassign or archive instead.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        department = self.get_object()
        from apps.employees.serializers import EmployeeListSerializer
        employees = department.employees.select_related('user', 'designation').filter(status='active')
        serializer = EmployeeListSerializer(employees, many=True)
        return Response(serializer.data)


class DesignationViewSet(viewsets.ModelViewSet):
    queryset = Designation.objects.select_related('department')
    serializer_class = DesignationSerializer
    permission_classes = [IsAdminOrHR]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['title']
    filterset_fields = ['department', 'is_active']
