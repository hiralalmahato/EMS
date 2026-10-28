from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from django_filters.rest_framework import DjangoFilterBackend

from apps.accounts.permissions import IsAdminOrHR
from apps.employees.models import Employee
from .models import LeaveType, LeaveBalance, LeaveRequest
from .serializers import (
    LeaveTypeSerializer, LeaveBalanceSerializer,
    LeaveRequestSerializer, LeaveRequestCreateSerializer,
)


class LeaveTypeViewSet(viewsets.ModelViewSet):
    queryset = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [permissions.IsAuthenticated()]
        return [IsAdminOrHR()]


class LeaveBalanceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = LeaveBalanceSerializer

    def get_queryset(self):
        user = self.request.user
        qs = LeaveBalance.objects.select_related('leave_type', 'employee')

        if user.role == 'employee':
            try:
                emp = Employee.objects.get(user=user)
                return qs.filter(employee=emp)
            except Employee.DoesNotExist:
                return qs.none()

        # Admin/HR: optionally filter by employee
        employee_id = self.request.query_params.get('employee')
        if employee_id:
            qs = qs.filter(employee_id=employee_id)

        year = self.request.query_params.get('year', timezone.now().year)
        return qs.filter(year=year)


class LeaveRequestViewSet(viewsets.ModelViewSet):
    serializer_class = LeaveRequestSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'leave_type', 'employee']
    ordering_fields = ['created_at', 'start_date']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        qs = LeaveRequest.objects.select_related(
            'employee__user', 'employee__department', 'leave_type', 'reviewed_by'
        )

        if user.role == 'employee':
            try:
                emp = Employee.objects.get(user=user)
                return qs.filter(employee=emp)
            except Employee.DoesNotExist:
                return qs.none()

        # Date filtering
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        department = self.request.query_params.get('department')

        if start_date:
            qs = qs.filter(start_date__gte=start_date)
        if end_date:
            qs = qs.filter(end_date__lte=end_date)
        if department:
            qs = qs.filter(employee__department_id=department)

        return qs

    def get_serializer_class(self):
        if self.action == 'create':
            return LeaveRequestCreateSerializer
        return LeaveRequestSerializer

    def perform_create(self, serializer):
        try:
            employee = Employee.objects.get(user=self.request.user)
        except Employee.DoesNotExist:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'detail': 'No employee profile found.'})

        serializer.save(employee=employee)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        if self.action == 'create':
            try:
                context['employee'] = Employee.objects.get(user=self.request.user)
            except Employee.DoesNotExist:
                pass
        return context

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrHR])
    def approve(self, request, pk=None):
        leave_request = self.get_object()

        if leave_request.status != 'pending':
            return Response(
                {'detail': 'Only pending requests can be approved.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Prevent self-approval
        try:
            emp = Employee.objects.get(user=request.user)
            if leave_request.employee == emp:
                return Response(
                    {'detail': 'You cannot approve your own leave request.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Employee.DoesNotExist:
            pass

        with transaction.atomic():
            leave_request.status = 'approved'
            leave_request.reviewed_by = request.user
            leave_request.review_date = timezone.now()
            leave_request.save()

            # Update leave balance
            year = leave_request.start_date.year
            balance, created = LeaveBalance.objects.get_or_create(
                employee=leave_request.employee,
                leave_type=leave_request.leave_type,
                year=year,
                defaults={'total_days': leave_request.leave_type.days_per_year}
            )
            balance.used_days += leave_request.total_days
            balance.save()

        return Response(LeaveRequestSerializer(leave_request).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrHR])
    def reject(self, request, pk=None):
        leave_request = self.get_object()

        if leave_request.status != 'pending':
            return Response(
                {'detail': 'Only pending requests can be rejected.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        rejection_reason = request.data.get('rejection_reason', '')

        leave_request.status = 'rejected'
        leave_request.reviewed_by = request.user
        leave_request.review_date = timezone.now()
        leave_request.rejection_reason = rejection_reason
        leave_request.save()

        return Response(LeaveRequestSerializer(leave_request).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        leave_request = self.get_object()

        # Only the employee who created it can cancel
        try:
            emp = Employee.objects.get(user=request.user)
            if leave_request.employee != emp and request.user.role not in ('admin', 'hr_manager'):
                return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
        except Employee.DoesNotExist:
            if request.user.role not in ('admin', 'hr_manager'):
                return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

        if leave_request.status not in ('pending',):
            return Response(
                {'detail': 'Only pending requests can be cancelled.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        leave_request.status = 'cancelled'
        leave_request.save()

        return Response(LeaveRequestSerializer(leave_request).data)

    @action(detail=False, methods=['get'])
    def my_balances(self, request):
        try:
            employee = Employee.objects.get(user=request.user)
        except Employee.DoesNotExist:
            return Response({'detail': 'No employee profile found.'}, status=status.HTTP_404_NOT_FOUND)

        year = int(request.query_params.get('year', timezone.now().year))
        balances = LeaveBalance.objects.filter(
            employee=employee, year=year
        ).select_related('leave_type')

        # Auto-create balances if missing
        if not balances.exists():
            leave_types = LeaveType.objects.filter(is_active=True)
            for lt in leave_types:
                LeaveBalance.objects.get_or_create(
                    employee=employee,
                    leave_type=lt,
                    year=year,
                    defaults={'total_days': lt.days_per_year}
                )
            balances = LeaveBalance.objects.filter(
                employee=employee, year=year
            ).select_related('leave_type')

        serializer = LeaveBalanceSerializer(balances, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAdminOrHR])
    def pending_count(self, request):
        count = LeaveRequest.objects.filter(status='pending').count()
        return Response({'count': count})
