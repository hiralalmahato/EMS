from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
import csv
from django.http import HttpResponse

from apps.accounts.permissions import IsAdmin, IsAdminOrHR
from apps.employees.models import Employee
from .models import PayrollRecord, SalaryRevision
from .serializers import PayrollRecordSerializer, PayrollCreateSerializer, SalaryRevisionSerializer


class PayrollViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'period_month', 'period_year', 'employee']
    search_fields = ['employee__user__first_name', 'employee__user__last_name', 'employee__employee_id']
    ordering = ['-period_year', '-period_month']

    def get_queryset(self):
        user = self.request.user
        qs = PayrollRecord.objects.select_related('employee__user', 'employee__department')

        if user.role == 'employee':
            try:
                emp = Employee.objects.get(user=user)
                return qs.filter(employee=emp, status='paid')
            except Employee.DoesNotExist:
                return qs.none()

        return qs

    def get_serializer_class(self):
        if self.action == 'create':
            return PayrollCreateSerializer
        return PayrollRecordSerializer

    def get_permissions(self):
        if self.action == 'list' and self.request.user.role == 'employee':
            return [permissions.IsAuthenticated()]
        if self.action == 'retrieve' and self.request.user.role == 'employee':
            return [permissions.IsAuthenticated()]
        return [IsAdmin()]

    def perform_create(self, serializer):
        serializer.save(processed_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def process(self, request, pk=None):
        record = self.get_object()
        if record.status != 'draft':
            return Response({'detail': 'Only draft records can be processed.'}, status=status.HTTP_400_BAD_REQUEST)
        record.status = 'processed'
        record.save()
        return Response(PayrollRecordSerializer(record).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def mark_paid(self, request, pk=None):
        record = self.get_object()
        if record.status != 'processed':
            return Response({'detail': 'Only processed records can be marked as paid.'}, status=status.HTTP_400_BAD_REQUEST)
        record.status = 'paid'
        record.payment_date = timezone.now().date()
        record.save()
        return Response(PayrollRecordSerializer(record).data)

    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def export_csv(self, request):
        records = self.filter_queryset(self.get_queryset())
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="payroll.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Employee ID', 'Name', 'Period', 'Basic', 'Allowances', 'Bonuses',
            'Gross', 'Deductions', 'Net', 'Status'
        ])

        for r in records[:1000]:
            writer.writerow([
                r.employee.employee_id, r.employee.user.get_full_name(),
                f"{r.period_month}/{r.period_year}",
                r.basic_salary, r.allowances, r.bonuses,
                r.gross_salary, r.deductions, r.net_salary,
                r.get_status_display(),
            ])
        return response


class SalaryRevisionViewSet(viewsets.ModelViewSet):
    serializer_class = SalaryRevisionSerializer
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['employee']

    def get_queryset(self):
        return SalaryRevision.objects.select_related('employee__user', 'approved_by')

    def perform_create(self, serializer):
        revision = serializer.save(approved_by=self.request.user)
        # Update employee's basic salary
        emp = revision.employee
        emp.basic_salary = revision.new_salary
        emp.save(update_fields=['basic_salary'])
