from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Count, Q, Sum, F
from django.db.models.functions import ExtractMonth
from datetime import timedelta

from apps.employees.models import Employee
from apps.departments.models import Department


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        current_month_start = today.replace(day=1)

        employees = Employee.objects.select_related('user', 'department', 'designation')

        total_employees = employees.count()
        active_employees = employees.filter(status='active').count()

        new_hires_month = employees.filter(
            joining_date__gte=current_month_start,
            joining_date__lte=today
        ).count()

        dept_distribution = list(
            Department.objects.filter(is_active=True)
            .annotate(count=Count('employees', filter=Q(employees__status='active')))
            .values('name', 'count')
            .order_by('-count')
        )

        recent_employees = employees.filter(
            status='active'
        ).order_by('-joining_date')[:5]

        recent_employees_data = [
            {
                'id': emp.id,
                'employee_id': emp.employee_id,
                'name': emp.user.get_full_name(),
                'department': emp.department.name if emp.department else None,
                'designation': emp.designation.title if emp.designation else None,
                'joining_date': emp.joining_date,
                'avatar': emp.user.avatar.url if emp.user.avatar else None,
            }
            for emp in recent_employees
        ]

        upcoming_birthdays = []
        birthday_employees = employees.filter(
            status='active',
            date_of_birth__isnull=False,
        )
        for emp in birthday_employees:
            try:
                next_bday = emp.date_of_birth.replace(year=today.year)
                if next_bday < today:
                    next_bday = next_bday.replace(year=today.year + 1)
                if (next_bday - today).days <= 30:
                    upcoming_birthdays.append({
                        'id': emp.id,
                        'name': emp.user.get_full_name(),
                        'date': next_bday,
                        'department': emp.department.name if emp.department else None,
                    })
            except ValueError:
                continue
        upcoming_birthdays.sort(key=lambda x: x['date'])
        upcoming_birthdays = upcoming_birthdays[:5]

        type_breakdown = list(
            employees.filter(status='active')
            .values('employment_type')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        headcount_trend = []
        for i in range(5, -1, -1):
            month_date = today - timedelta(days=30 * i)
            month_start = month_date.replace(day=1)
            count = employees.filter(
                joining_date__lte=month_start,
            ).exclude(
                status='inactive',
            ).count()
            headcount_trend.append({
                'month': month_start.strftime('%b %Y'),
                'count': count,
            })

        # Attendance today
        from apps.attendance.models import AttendanceRecord
        present_today = AttendanceRecord.objects.filter(
            date=today, status__in=['present', 'late']
        ).count()

        # Pending leave requests
        from apps.leaves.models import LeaveRequest
        pending_leaves = LeaveRequest.objects.filter(status='pending').count()
        on_leave_today = LeaveRequest.objects.filter(
            status='approved',
            start_date__lte=today,
            end_date__gte=today,
        ).count()

        data = {
            'kpi': {
                'total_employees': total_employees,
                'active_employees': active_employees,
                'new_hires_month': new_hires_month,
                'departments': Department.objects.filter(is_active=True).count(),
                'present_today': present_today,
                'pending_leaves': pending_leaves,
                'on_leave_today': on_leave_today,
            },
            'department_distribution': dept_distribution,
            'recent_employees': recent_employees_data,
            'upcoming_birthdays': upcoming_birthdays,
            'employment_type_breakdown': type_breakdown,
            'headcount_trend': headcount_trend,
        }

        return Response(data)


class ReportsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.attendance.models import AttendanceRecord
        from apps.leaves.models import LeaveRequest
        from apps.payroll.models import PayrollRecord

        if request.user.role not in ('admin', 'hr_manager'):
            return Response({'detail': 'Permission denied.'}, status=403)

        today = timezone.now().date()
        report_type = request.query_params.get('type', 'overview')

        if report_type == 'attendance':
            start = request.query_params.get('start_date', (today - timedelta(days=30)).isoformat())
            end = request.query_params.get('end_date', today.isoformat())

            records = AttendanceRecord.objects.filter(date__gte=start, date__lte=end)

            status_summary = list(
                records.values('status')
                .annotate(count=Count('id'))
                .order_by('-count')
            )

            daily_trend = list(
                records.values('date')
                .annotate(
                    present=Count('id', filter=Q(status__in=['present', 'late'])),
                    absent=Count('id', filter=Q(status='absent')),
                    on_leave=Count('id', filter=Q(status='on_leave')),
                )
                .order_by('date')
            )

            dept_attendance = list(
                records.filter(status__in=['present', 'late'])
                .values(department=F('employee__department__name'))
                .annotate(count=Count('id'))
                .order_by('-count')
            )

            return Response({
                'status_summary': status_summary,
                'daily_trend': daily_trend,
                'department_attendance': dept_attendance,
            })

        elif report_type == 'leave':
            year = int(request.query_params.get('year', today.year))

            leave_by_type = list(
                LeaveRequest.objects.filter(
                    start_date__year=year,
                    status='approved'
                )
                .values(type_name=F('leave_type__name'))
                .annotate(total_days=Sum('total_days'), count=Count('id'))
                .order_by('-total_days')
            )

            leave_by_month = list(
                LeaveRequest.objects.filter(
                    start_date__year=year,
                    status='approved'
                )
                .annotate(month=ExtractMonth('start_date'))
                .values('month')
                .annotate(total_days=Sum('total_days'))
                .order_by('month')
            )

            pending_count = LeaveRequest.objects.filter(status='pending').count()

            return Response({
                'leave_by_type': leave_by_type,
                'leave_by_month': leave_by_month,
                'pending_count': pending_count,
            })

        elif report_type == 'payroll':
            year = int(request.query_params.get('year', today.year))

            monthly_payroll = list(
                PayrollRecord.objects.filter(period_year=year)
                .values('period_month')
                .annotate(
                    total_gross=Sum('gross_salary'),
                    total_net=Sum('net_salary'),
                    total_deductions=Sum('deductions'),
                    count=Count('id'),
                )
                .order_by('period_month')
            )

            dept_payroll = list(
                PayrollRecord.objects.filter(period_year=year, status__in=['processed', 'paid'])
                .values(department=F('employee__department__name'))
                .annotate(total_net=Sum('net_salary'))
                .order_by('-total_net')
            )

            return Response({
                'monthly_payroll': monthly_payroll,
                'department_payroll': dept_payroll,
            })

        else:
            # Overview
            total_emp = Employee.objects.count()
            active_emp = Employee.objects.filter(status='active').count()

            dept_distribution = list(
                Department.objects.filter(is_active=True)
                .annotate(count=Count('employees', filter=Q(employees__status='active')))
                .values('name', 'count')
                .order_by('-count')
            )

            type_breakdown = list(
                Employee.objects.filter(status='active')
                .values('employment_type')
                .annotate(count=Count('id'))
                .order_by('-count')
            )

            gender_breakdown = list(
                Employee.objects.filter(status='active')
                .values('gender')
                .annotate(count=Count('id'))
            )

            recent_hires = list(
                Employee.objects.filter(status='active')
                .order_by('-joining_date')[:10]
                .values('employee_id', 'user__first_name', 'user__last_name', 'department__name', 'joining_date')
            )

            return Response({
                'total_employees': total_emp,
                'active_employees': active_emp,
                'department_distribution': dept_distribution,
                'employment_type_breakdown': type_breakdown,
                'gender_breakdown': gender_breakdown,
                'recent_hires': recent_hires,
            })
