from rest_framework import viewsets, filters, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
import csv
from django.http import HttpResponse

from apps.accounts.permissions import IsAdminOrHR, IsOwnerOrAdmin
from .models import Employee, EmployeeDocument
from .serializers import (
    EmployeeListSerializer,
    EmployeeDetailSerializer,
    EmployeeCreateSerializer,
    EmployeeUpdateSerializer,
    EmployeeDocumentSerializer,
    EmployeeSelfSerializer,
)


class EmployeeViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['employee_id', 'user__first_name', 'user__last_name', 'user__email']
    ordering_fields = ['employee_id', 'user__first_name', 'joining_date', 'created_at']
    ordering = ['employee_id']
    filterset_fields = ['department', 'employment_type', 'status', 'designation']

    def get_queryset(self):
        user = self.request.user
        qs = Employee.objects.select_related(
            'user', 'department', 'designation', 'reporting_manager__user'
        )

        if user.role == 'employee':
            # Employees can only see their own record
            return qs.filter(user=user)

        return qs

    def get_serializer_class(self):
        if self.action == 'create':
            return EmployeeCreateSerializer
        if self.action in ('update', 'partial_update'):
            return EmployeeUpdateSerializer
        if self.action == 'retrieve':
            return EmployeeDetailSerializer
        if self.action == 'me':
            return EmployeeSelfSerializer
        return EmployeeListSerializer

    def get_permissions(self):
        if self.action in ('create', 'destroy'):
            return [IsAdminOrHR()]
        if self.action in ('update', 'partial_update'):
            return [IsAdminOrHR()]
        if self.action == 'me':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        try:
            employee = Employee.objects.select_related(
                'user', 'department', 'designation'
            ).get(user=request.user)
        except Employee.DoesNotExist:
            return Response(
                {'detail': 'No employee profile found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if request.method == 'PATCH':
            serializer = EmployeeSelfSerializer(employee, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

        serializer = EmployeeSelfSerializer(employee)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAdminOrHR])
    def export_csv(self, request):
        employees = self.filter_queryset(self.get_queryset())
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="employees.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Employee ID', 'Name', 'Email', 'Phone', 'Department',
            'Designation', 'Employment Type', 'Status', 'Joining Date'
        ])

        for emp in employees:
            writer.writerow([
                emp.employee_id,
                emp.user.get_full_name(),
                emp.user.email,
                emp.phone,
                emp.department.name if emp.department else '',
                emp.designation.title if emp.designation else '',
                emp.get_employment_type_display(),
                emp.get_status_display(),
                emp.joining_date,
            ])

        return response

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrHR])
    def deactivate(self, request, pk=None):
        employee = self.get_object()
        employee.status = 'inactive'
        employee.user.is_active = False
        employee.user.save()
        employee.save()
        return Response({'detail': 'Employee deactivated.'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrHR])
    def reactivate(self, request, pk=None):
        employee = self.get_object()
        employee.status = 'active'
        employee.user.is_active = True
        employee.user.save()
        employee.save()
        return Response({'detail': 'Employee reactivated.'})


class EmployeeDocumentViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeDocumentSerializer

    def get_queryset(self):
        user = self.request.user
        employee_pk = self.kwargs.get('employee_pk')

        if user.role == 'employee':
            try:
                emp = Employee.objects.get(user=user)
                if str(emp.pk) != str(employee_pk):
                    return EmployeeDocument.objects.none()
            except Employee.DoesNotExist:
                return EmployeeDocument.objects.none()

        return EmployeeDocument.objects.filter(employee_id=employee_pk)

    def perform_create(self, serializer):
        serializer.save(
            employee_id=self.kwargs['employee_pk'],
            uploaded_by=self.request.user
        )
