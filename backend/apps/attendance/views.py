from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
import csv
from django.http import HttpResponse

from apps.accounts.permissions import IsAdminOrHR
from apps.employees.models import Employee
from .models import AttendanceRecord
from .serializers import AttendanceRecordSerializer, CheckInSerializer, CheckOutSerializer


class AttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceRecordSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['employee', 'status', 'date']
    search_fields = ['employee__user__first_name', 'employee__user__last_name', 'employee__employee_id']
    ordering_fields = ['date', 'check_in']
    ordering = ['-date']

    def get_queryset(self):
        user = self.request.user
        qs = AttendanceRecord.objects.select_related('employee__user')

        if user.role == 'employee':
            try:
                emp = Employee.objects.get(user=user)
                return qs.filter(employee=emp)
            except Employee.DoesNotExist:
                return qs.none()

        # Date range filtering
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            qs = qs.filter(date__gte=start_date)
        if end_date:
            qs = qs.filter(date__lte=end_date)

        return qs

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdminOrHR()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['post'])
    def check_in(self, request):
        try:
            employee = Employee.objects.get(user=request.user)
        except Employee.DoesNotExist:
            return Response({'detail': 'No employee profile found.'}, status=status.HTTP_404_NOT_FOUND)

        today = timezone.now().date()

        # Check for existing record
        existing = AttendanceRecord.objects.filter(employee=employee, date=today).first()
        if existing and existing.check_in:
            return Response({'detail': 'Already checked in today.'}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()

        if existing:
            existing.check_in = now
            existing.status = 'present'
            existing.save()
            record = existing
        else:
            record = AttendanceRecord.objects.create(
                employee=employee,
                date=today,
                check_in=now,
                status='present',
            )

        # Check if late
        if employee.work_schedule:
            schedule_start = timezone.make_aware(
                timezone.datetime.combine(today, employee.work_schedule.start_time)
            )
            grace = timezone.timedelta(minutes=employee.work_schedule.grace_period_minutes)
            if now > schedule_start + grace:
                record.status = 'late'
                record.save()

        serializer = AttendanceRecordSerializer(record)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def check_out(self, request):
        try:
            employee = Employee.objects.get(user=request.user)
        except Employee.DoesNotExist:
            return Response({'detail': 'No employee profile found.'}, status=status.HTTP_404_NOT_FOUND)

        today = timezone.now().date()
        try:
            record = AttendanceRecord.objects.get(employee=employee, date=today)
        except AttendanceRecord.DoesNotExist:
            return Response({'detail': 'No check-in found for today.'}, status=status.HTTP_400_BAD_REQUEST)

        if not record.check_in:
            return Response({'detail': 'No check-in found for today.'}, status=status.HTTP_400_BAD_REQUEST)

        if record.check_out:
            return Response({'detail': 'Already checked out today.'}, status=status.HTTP_400_BAD_REQUEST)

        record.check_out = timezone.now()
        record.save()  # working_hours calculated in save()

        serializer = AttendanceRecordSerializer(record)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get today's attendance status for the logged-in employee."""
        try:
            employee = Employee.objects.get(user=request.user)
        except Employee.DoesNotExist:
            return Response({'detail': 'No employee profile found.'}, status=status.HTTP_404_NOT_FOUND)

        today = timezone.now().date()
        try:
            record = AttendanceRecord.objects.get(employee=employee, date=today)
            serializer = AttendanceRecordSerializer(record)
            return Response(serializer.data)
        except AttendanceRecord.DoesNotExist:
            return Response({'checked_in': False, 'date': today})

    @action(detail=False, methods=['get'], permission_classes=[IsAdminOrHR])
    def summary(self, request):
        """Get attendance summary for today."""
        today = timezone.now().date()
        records = AttendanceRecord.objects.filter(date=today)
        total_employees = Employee.objects.filter(status='active').count()
        present = records.filter(status__in=['present', 'late']).count()
        late = records.filter(status='late').count()
        absent = total_employees - present

        return Response({
            'date': today,
            'total_employees': total_employees,
            'present': present,
            'late': late,
            'absent': absent,
            'on_leave': records.filter(status='on_leave').count(),
        })

    @action(detail=False, methods=['get'], permission_classes=[IsAdminOrHR])
    def export_csv(self, request):
        records = self.filter_queryset(self.get_queryset())
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="attendance.csv"'

        writer = csv.writer(response)
        writer.writerow(['Employee ID', 'Name', 'Date', 'Check In', 'Check Out', 'Status', 'Working Hours'])

        for record in records[:1000]:
            writer.writerow([
                record.employee.employee_id,
                record.employee.user.get_full_name(),
                record.date,
                record.check_in.strftime('%H:%M') if record.check_in else '',
                record.check_out.strftime('%H:%M') if record.check_out else '',
                record.get_status_display(),
                record.working_hours,
            ])

        return response
