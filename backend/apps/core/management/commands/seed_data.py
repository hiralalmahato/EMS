from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.departments.models import Department, Designation
from apps.employees.models import Employee
from apps.core.models import CompanySettings, Holiday, WorkSchedule
from apps.leaves.models import LeaveType, LeaveBalance, LeaveRequest
from apps.attendance.models import AttendanceRecord
from apps.payroll.models import PayrollRecord
from apps.tasks.models import Task
from apps.notifications.models import Notification, Announcement
from apps.performance.models import PerformanceGoal
from apps.recruitment.models import JobOpening, Candidate
from datetime import date, time, datetime, timedelta
from decimal import Decimal
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed database with demo data for development'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')

        self._create_company_settings()
        self._create_work_schedules()
        self._create_holidays()
        departments = self._create_departments()
        designations = self._create_designations(departments)
        self._create_employees(departments, designations)

        leave_types = self._create_leave_types()
        self._create_leave_balances(leave_types)
        self._create_leave_requests(leave_types)
        self._create_attendance_records()
        self._create_payroll_records()
        self._create_tasks()
        self._create_notifications()
        self._create_announcements()
        self._create_performance_goals()
        self._create_recruitment_data()

        self.stdout.write(self.style.SUCCESS('Database seeded successfully.'))

    def _create_company_settings(self):
        CompanySettings.objects.get_or_create(
            pk=1,
            defaults={
                'company_name': 'Meridian Technologies',
                'email': 'info@meridiantech.com',
                'phone': '+1 (555) 234-5678',
                'address': '450 Innovation Drive, Suite 300',
                'city': 'Austin',
                'state': 'Texas',
                'country': 'United States',
                'zip_code': '78701',
                'website': 'https://meridiantech.com',
                'currency': 'USD',
                'currency_symbol': '$',
            }
        )
        self.stdout.write('  Company settings created.')

    def _create_work_schedules(self):
        WorkSchedule.objects.get_or_create(
            name='Standard (9-6)',
            defaults={
                'start_time': time(9, 0),
                'end_time': time(18, 0),
                'grace_period_minutes': 15,
                'is_default': True,
                'working_days': [0, 1, 2, 3, 4],
            }
        )
        WorkSchedule.objects.get_or_create(
            name='Flexible (10-7)',
            defaults={
                'start_time': time(10, 0),
                'end_time': time(19, 0),
                'grace_period_minutes': 30,
                'working_days': [0, 1, 2, 3, 4],
            }
        )
        self.stdout.write('  Work schedules created.')

    def _create_holidays(self):
        holidays = [
            ('New Year\'s Day', date(2026, 1, 1)),
            ('Martin Luther King Jr. Day', date(2026, 1, 19)),
            ('Presidents\' Day', date(2026, 2, 16)),
            ('Memorial Day', date(2026, 5, 25)),
            ('Independence Day', date(2026, 7, 4)),
            ('Labor Day', date(2026, 9, 7)),
            ('Thanksgiving', date(2026, 11, 26)),
            ('Christmas Day', date(2026, 12, 25)),
        ]
        for name, d in holidays:
            Holiday.objects.get_or_create(name=name, date=d)
        self.stdout.write(f'  {len(holidays)} holidays created.')

    def _create_departments(self):
        dept_data = [
            ('Engineering', 'Software development, DevOps, and technical architecture.'),
            ('Product', 'Product management, strategy, and roadmap planning.'),
            ('Design', 'UI/UX design, brand identity, and creative direction.'),
            ('Human Resources', 'Talent acquisition, employee relations, and HR operations.'),
            ('Finance', 'Financial planning, accounting, and payroll administration.'),
            ('Marketing', 'Growth marketing, content strategy, and demand generation.'),
            ('Sales', 'Business development, account management, and partnerships.'),
            ('Operations', 'Office management, procurement, and vendor relations.'),
            ('Customer Success', 'Customer onboarding, support, and retention.'),
            ('Legal', 'Compliance, contracts, and intellectual property.'),
        ]
        departments = {}
        for name, desc in dept_data:
            dept, _ = Department.objects.get_or_create(
                name=name,
                defaults={'description': desc}
            )
            departments[name] = dept
        self.stdout.write(f'  {len(departments)} departments created.')
        return departments

    def _create_designations(self, departments):
        desig_data = [
            ('Software Engineer', 'Engineering', 3),
            ('Senior Software Engineer', 'Engineering', 5),
            ('Staff Engineer', 'Engineering', 7),
            ('Engineering Manager', 'Engineering', 8),
            ('VP of Engineering', 'Engineering', 9),
            ('Product Manager', 'Product', 5),
            ('Senior Product Manager', 'Product', 7),
            ('UI/UX Designer', 'Design', 3),
            ('Senior Designer', 'Design', 5),
            ('Design Lead', 'Design', 7),
            ('HR Coordinator', 'Human Resources', 2),
            ('HR Manager', 'Human Resources', 6),
            ('HR Director', 'Human Resources', 8),
            ('Financial Analyst', 'Finance', 3),
            ('Finance Manager', 'Finance', 6),
            ('Marketing Specialist', 'Marketing', 3),
            ('Marketing Manager', 'Marketing', 6),
            ('Sales Representative', 'Sales', 2),
            ('Sales Manager', 'Sales', 6),
            ('Account Executive', 'Sales', 4),
            ('Operations Coordinator', 'Operations', 2),
            ('Operations Manager', 'Operations', 6),
            ('Customer Success Manager', 'Customer Success', 5),
            ('Support Specialist', 'Customer Success', 2),
            ('Legal Counsel', 'Legal', 6),
            ('Intern', None, 1),
        ]
        designations = {}
        for title, dept_name, level in desig_data:
            dept = departments.get(dept_name) if dept_name else None
            desig, _ = Designation.objects.get_or_create(
                title=title,
                defaults={'department': dept, 'level': level}
            )
            designations[title] = desig
        self.stdout.write(f'  {len(designations)} designations created.')
        return designations

    def _create_employees(self, departments, designations):
        default_schedule = WorkSchedule.objects.filter(is_default=True).first()

        employee_data = [
            ('EMP-001', 'Sarah', 'Mitchell', 'sarah.mitchell@meridiantech.com', 'Engineering', 'VP of Engineering', 'full_time', 'active', date(2020, 3, 15), 185000, date(1985, 6, 12), 'female', '+1 (555) 101-0001'),
            ('EMP-002', 'James', 'Wilson', 'james.wilson@meridiantech.com', 'Human Resources', 'HR Director', 'full_time', 'active', date(2019, 8, 1), 145000, date(1982, 11, 28), 'male', '+1 (555) 101-0002'),
            ('EMP-003', 'Emily', 'Chen', 'emily.chen@meridiantech.com', 'Engineering', 'Senior Software Engineer', 'full_time', 'active', date(2021, 1, 10), 135000, date(1992, 3, 22), 'female', '+1 (555) 101-0003'),
            ('EMP-004', 'Michael', 'Rodriguez', 'michael.rodriguez@meridiantech.com', 'Engineering', 'Software Engineer', 'full_time', 'active', date(2022, 6, 1), 105000, date(1995, 9, 5), 'male', '+1 (555) 101-0004'),
            ('EMP-005', 'Priya', 'Sharma', 'priya.sharma@meridiantech.com', 'Product', 'Senior Product Manager', 'full_time', 'active', date(2021, 4, 12), 150000, date(1988, 1, 17), 'female', '+1 (555) 101-0005'),
            ('EMP-006', 'David', 'Kim', 'david.kim@meridiantech.com', 'Design', 'Design Lead', 'full_time', 'active', date(2020, 9, 28), 130000, date(1990, 7, 3), 'male', '+1 (555) 101-0006'),
            ('EMP-007', 'Rachel', 'Thompson', 'rachel.thompson@meridiantech.com', 'Marketing', 'Marketing Manager', 'full_time', 'active', date(2021, 11, 15), 115000, date(1991, 4, 19), 'female', '+1 (555) 101-0007'),
            ('EMP-008', 'Alex', 'Nakamura', 'alex.nakamura@meridiantech.com', 'Engineering', 'Staff Engineer', 'full_time', 'active', date(2019, 5, 20), 165000, date(1987, 12, 8), 'male', '+1 (555) 101-0008'),
            ('EMP-009', 'Jessica', 'Okafor', 'jessica.okafor@meridiantech.com', 'Sales', 'Sales Manager', 'full_time', 'active', date(2020, 2, 3), 120000, date(1989, 8, 30), 'female', '+1 (555) 101-0009'),
            ('EMP-010', 'Ryan', 'Patel', 'ryan.patel@meridiantech.com', 'Finance', 'Finance Manager', 'full_time', 'active', date(2021, 7, 19), 125000, date(1986, 5, 14), 'male', '+1 (555) 101-0010'),
            ('EMP-011', 'Olivia', 'Martinez', 'olivia.martinez@meridiantech.com', 'Customer Success', 'Customer Success Manager', 'full_time', 'active', date(2022, 1, 24), 95000, date(1993, 10, 7), 'female', '+1 (555) 101-0011'),
            ('EMP-012', 'Daniel', 'Lee', 'daniel.lee@meridiantech.com', 'Engineering', 'Engineering Manager', 'full_time', 'active', date(2020, 6, 8), 155000, date(1984, 2, 25), 'male', '+1 (555) 101-0012'),
            ('EMP-013', 'Sophia', 'Brown', 'sophia.brown@meridiantech.com', 'Human Resources', 'HR Coordinator', 'full_time', 'active', date(2023, 3, 6), 65000, date(1997, 6, 11), 'female', '+1 (555) 101-0013'),
            ('EMP-014', 'Marcus', 'Johnson', 'marcus.johnson@meridiantech.com', 'Sales', 'Account Executive', 'full_time', 'active', date(2022, 9, 12), 88000, date(1994, 1, 29), 'male', '+1 (555) 101-0014'),
            ('EMP-015', 'Nina', 'Volkov', 'nina.volkov@meridiantech.com', 'Design', 'UI/UX Designer', 'full_time', 'active', date(2023, 5, 22), 90000, date(1996, 8, 16), 'female', '+1 (555) 101-0015'),
            ('EMP-016', 'Thomas', 'Wright', 'thomas.wright@meridiantech.com', 'Operations', 'Operations Manager', 'full_time', 'active', date(2021, 10, 4), 98000, date(1988, 3, 9), 'male', '+1 (555) 101-0016'),
            ('EMP-017', 'Aisha', 'Hassan', 'aisha.hassan@meridiantech.com', 'Legal', 'Legal Counsel', 'full_time', 'active', date(2022, 4, 18), 140000, date(1985, 11, 22), 'female', '+1 (555) 101-0017'),
            ('EMP-018', 'Carlos', 'Rivera', 'carlos.rivera@meridiantech.com', 'Engineering', 'Software Engineer', 'full_time', 'active', date(2023, 8, 7), 100000, date(1998, 4, 2), 'male', '+1 (555) 101-0018'),
            ('EMP-019', 'Lauren', 'Fischer', 'lauren.fischer@meridiantech.com', 'Marketing', 'Marketing Specialist', 'part_time', 'active', date(2023, 11, 13), 52000, date(1995, 7, 26), 'female', '+1 (555) 101-0019'),
            ('EMP-020', 'Kevin', 'Nguyen', 'kevin.nguyen@meridiantech.com', 'Customer Success', 'Support Specialist', 'full_time', 'active', date(2024, 2, 5), 58000, date(1999, 9, 18), 'male', '+1 (555) 101-0020'),
            ('EMP-021', 'Hannah', 'Price', 'hannah.price@meridiantech.com', 'Product', 'Product Manager', 'full_time', 'active', date(2024, 1, 15), 120000, date(1991, 12, 3), 'female', '+1 (555) 101-0021'),
            ('EMP-022', 'Brandon', 'Cooper', 'brandon.cooper@meridiantech.com', 'Engineering', 'Software Engineer', 'contract', 'active', date(2024, 6, 1), 95000, date(1993, 5, 20), 'male', '+1 (555) 101-0022'),
            ('EMP-023', 'Mei', 'Wang', 'mei.wang@meridiantech.com', 'Finance', 'Financial Analyst', 'full_time', 'active', date(2024, 3, 11), 78000, date(1997, 2, 14), 'female', '+1 (555) 101-0023'),
            ('EMP-024', 'Jason', 'Taylor', 'jason.taylor@meridiantech.com', 'Sales', 'Sales Representative', 'full_time', 'active', date(2024, 5, 20), 65000, date(2000, 10, 8), 'male', '+1 (555) 101-0024'),
            ('EMP-025', 'Isabella', 'Rossi', 'isabella.rossi@meridiantech.com', 'Design', 'Senior Designer', 'full_time', 'active', date(2022, 8, 29), 110000, date(1990, 6, 30), 'female', '+1 (555) 101-0025'),
            ('EMP-026', 'Samuel', 'Osei', 'samuel.osei@meridiantech.com', 'Engineering', 'Senior Software Engineer', 'full_time', 'active', date(2023, 2, 14), 130000, date(1991, 1, 5), 'male', '+1 (555) 101-0026'),
            ('EMP-027', 'Victoria', 'Adams', 'victoria.adams@meridiantech.com', 'Operations', 'Operations Coordinator', 'full_time', 'active', date(2024, 7, 8), 52000, date(2001, 3, 17), 'female', '+1 (555) 101-0027'),
            ('EMP-028', 'Derek', 'Hughes', 'derek.hughes@meridiantech.com', 'Engineering', 'Software Engineer', 'intern', 'active', date(2026, 9, 1), 45000, date(2003, 8, 22), 'male', '+1 (555) 101-0028'),
            ('EMP-029', 'Amanda', 'Reeves', 'amanda.reeves@meridiantech.com', 'Human Resources', 'HR Manager', 'full_time', 'inactive', date(2019, 4, 10), 110000, date(1983, 7, 9), 'female', '+1 (555) 101-0029'),
            ('EMP-030', 'Lucas', 'Bennett', 'lucas.bennett@meridiantech.com', 'Engineering', 'Software Engineer', 'full_time', 'active', date(2026, 10, 14), 102000, date(1996, 11, 25), 'male', '+1 (555) 101-0030'),
        ]

        user_map = {
            'EMP-001': 'admin',
            'EMP-002': 'hr_manager',
            'EMP-003': 'employee1',
        }

        created_employees = {}
        for data in employee_data:
            emp_id, first, last, email, dept_name, desig_title, emp_type, emp_status, join_date, salary, dob, gender, phone = data

            existing_username = user_map.get(emp_id)
            if existing_username:
                try:
                    user = User.objects.get(username=existing_username)
                    user.first_name = first
                    user.last_name = last
                    user.email = email
                    user.phone = phone
                    user.save()
                except User.DoesNotExist:
                    user = User.objects.create_user(
                        username=existing_username,
                        email=email,
                        first_name=first,
                        last_name=last,
                        password='demo123!@#',
                        role='employee',
                        phone=phone,
                    )
            else:
                username = email.split('@')[0]
                user, created = User.objects.get_or_create(
                    username=username,
                    defaults={
                        'email': email,
                        'first_name': first,
                        'last_name': last,
                        'role': 'employee',
                        'phone': phone,
                        'is_active': emp_status != 'inactive',
                    }
                )
                if created:
                    user.set_password('demo123!@#')
                    user.save()

            dept = departments.get(dept_name)
            desig = designations.get(desig_title)

            emp, created = Employee.objects.get_or_create(
                employee_id=emp_id,
                defaults={
                    'user': user,
                    'department': dept,
                    'designation': desig,
                    'employment_type': emp_type,
                    'status': emp_status,
                    'joining_date': join_date,
                    'basic_salary': Decimal(str(salary)),
                    'date_of_birth': dob,
                    'gender': gender,
                    'phone': phone,
                    'work_schedule': default_schedule,
                    'city': random.choice(['Austin', 'San Francisco', 'New York', 'Seattle', 'Denver', 'Chicago']),
                    'state': random.choice(['TX', 'CA', 'NY', 'WA', 'CO', 'IL']),
                    'country': 'United States',
                }
            )
            created_employees[emp_id] = emp

        # Set reporting relationships
        manager_map = {
            'EMP-003': 'EMP-012',
            'EMP-004': 'EMP-012',
            'EMP-008': 'EMP-001',
            'EMP-012': 'EMP-001',
            'EMP-018': 'EMP-012',
            'EMP-022': 'EMP-012',
            'EMP-026': 'EMP-012',
            'EMP-028': 'EMP-012',
            'EMP-030': 'EMP-012',
            'EMP-013': 'EMP-002',
            'EMP-005': 'EMP-001',
            'EMP-006': 'EMP-001',
            'EMP-007': 'EMP-001',
            'EMP-015': 'EMP-006',
            'EMP-025': 'EMP-006',
        }
        for emp_id, mgr_id in manager_map.items():
            emp = created_employees.get(emp_id)
            mgr = created_employees.get(mgr_id)
            if emp and mgr:
                emp.reporting_manager = mgr
                emp.save(update_fields=['reporting_manager'])

        # Set department heads
        head_map = {
            'Engineering': 'EMP-001',
            'Human Resources': 'EMP-002',
            'Product': 'EMP-005',
            'Design': 'EMP-006',
            'Marketing': 'EMP-007',
            'Sales': 'EMP-009',
            'Finance': 'EMP-010',
            'Customer Success': 'EMP-011',
            'Operations': 'EMP-016',
            'Legal': 'EMP-017',
        }
        for dept_name, emp_id in head_map.items():
            dept = departments.get(dept_name)
            emp = created_employees.get(emp_id)
            if dept and emp:
                dept.head = emp
                dept.save(update_fields=['head'])

        self.stdout.write(f'  {len(employee_data)} employees created.')

    # ──────────────────────────────────────────────
    #  NEW SEED METHODS
    # ──────────────────────────────────────────────

    def _create_leave_types(self):
        types_data = [
            ('Casual Leave', 'CL', 12, True, True, False, 0),
            ('Sick Leave', 'SL', 10, True, True, False, 0),
            ('Annual Leave', 'AL', 15, True, True, True, 5),
            ('Unpaid Leave', 'UL', 0, False, False, False, 0),
        ]
        leave_types = {}
        for name, code, days, is_paid, is_active, carry, max_carry in types_data:
            lt, _ = LeaveType.objects.get_or_create(
                code=code,
                defaults={
                    'name': name,
                    'days_per_year': days,
                    'is_paid': is_paid,
                    'is_active': is_active,
                    'carry_forward': carry,
                    'max_carry_forward_days': max_carry,
                }
            )
            leave_types[code] = lt
        self.stdout.write(f'  {len(leave_types)} leave types created.')
        return leave_types

    def _create_leave_balances(self, leave_types):
        active_employees = Employee.objects.filter(status='active')
        count = 0
        for emp in active_employees:
            for code, lt in leave_types.items():
                if lt.days_per_year == 0:
                    continue
                used = Decimal(str(random.randint(0, min(5, lt.days_per_year))))
                LeaveBalance.objects.get_or_create(
                    employee=emp,
                    leave_type=lt,
                    year=2026,
                    defaults={
                        'total_days': Decimal(str(lt.days_per_year)),
                        'used_days': used,
                        'carried_forward': Decimal('0'),
                    }
                )
                count += 1
        self.stdout.write(f'  {count} leave balances created.')

    def _create_leave_requests(self, leave_types):
        active_employees = list(Employee.objects.filter(status='active')[:20])
        admin_user = User.objects.filter(role='admin').first()

        requests_data = [
            (0, 'CL', date(2026, 3, 10), date(2026, 3, 11), 'Family event - cousin\'s wedding', 'approved'),
            (1, 'SL', date(2026, 4, 5), date(2026, 4, 5), 'Doctor appointment and follow-up tests', 'approved'),
            (2, 'AL', date(2026, 7, 14), date(2026, 7, 18), 'Summer vacation - beach trip with family', 'approved'),
            (3, 'CL', date(2026, 5, 20), date(2026, 5, 21), 'Personal errands and home repairs', 'approved'),
            (4, 'SL', date(2026, 6, 8), date(2026, 6, 10), 'Flu symptoms and recovery', 'approved'),
            (5, 'CL', date(2026, 11, 3), date(2026, 11, 4), 'Moving to a new apartment', 'pending'),
            (6, 'AL', date(2026, 12, 22), date(2026, 12, 26), 'Year-end holidays with family', 'pending'),
            (7, 'SL', date(2026, 10, 28), date(2026, 10, 28), 'Migraine - need rest', 'pending'),
            (8, 'CL', date(2026, 8, 15), date(2026, 8, 15), 'Child\'s school event', 'approved'),
            (9, 'UL', date(2026, 9, 1), date(2026, 9, 5), 'Extended personal leave for travel', 'rejected'),
            (10, 'CL', date(2026, 2, 14), date(2026, 2, 14), 'Valentine\'s day plans', 'approved'),
            (11, 'AL', date(2026, 6, 22), date(2026, 6, 26), 'Visiting hometown', 'approved'),
            (12, 'SL', date(2026, 10, 15), date(2026, 10, 16), 'Back pain - physiotherapy', 'pending'),
            (3, 'CL', date(2026, 11, 10), date(2026, 11, 11), 'DMV appointment and paperwork', 'pending'),
            (5, 'SL', date(2026, 9, 22), date(2026, 9, 22), 'Dental surgery', 'approved'),
            (7, 'AL', date(2026, 11, 24), date(2026, 11, 28), 'Thanksgiving week off', 'pending'),
            (14, 'CL', date(2026, 10, 20), date(2026, 10, 21), 'House closing and inspection', 'approved'),
            (15, 'SL', date(2026, 8, 3), date(2026, 8, 4), 'Food poisoning recovery', 'approved'),
        ]

        count = 0
        for emp_idx, lt_code, start, end, reason, status in requests_data:
            if emp_idx >= len(active_employees):
                continue
            emp = active_employees[emp_idx]
            lt = leave_types.get(lt_code)
            if not lt:
                continue

            # Calculate business days
            total_days = 0
            current = start
            while current <= end:
                if current.weekday() < 5:
                    total_days += 1
                current += timedelta(days=1)

            _, created = LeaveRequest.objects.get_or_create(
                employee=emp,
                leave_type=lt,
                start_date=start,
                end_date=end,
                defaults={
                    'total_days': Decimal(str(total_days)),
                    'reason': reason,
                    'status': status,
                    'reviewed_by': admin_user if status in ('approved', 'rejected') else None,
                    'review_date': timezone.now() - timedelta(days=random.randint(1, 30)) if status in ('approved', 'rejected') else None,
                    'rejection_reason': 'Insufficient leave balance for the requested period.' if status == 'rejected' else '',
                }
            )
            if created:
                count += 1
        self.stdout.write(f'  {count} leave requests created.')

    def _create_attendance_records(self):
        active_employees = list(Employee.objects.filter(status='active'))
        today = timezone.now().date()
        count = 0

        holiday_dates = set(Holiday.objects.values_list('date', flat=True))

        for day_offset in range(1, 22):
            record_date = today - timedelta(days=day_offset)
            # Skip weekends
            if record_date.weekday() >= 5:
                continue
            # Skip holidays
            if record_date in holiday_dates:
                continue

            for emp in active_employees:
                # 85% present, 8% late, 5% absent, 2% on_leave
                rand = random.random()
                if rand < 0.85:
                    status = 'present'
                elif rand < 0.93:
                    status = 'late'
                elif rand < 0.98:
                    status = 'absent'
                else:
                    status = 'on_leave'

                if status in ('present', 'late'):
                    if status == 'late':
                        check_in_hour = random.randint(9, 10)
                        check_in_minute = random.randint(16, 45)
                    else:
                        check_in_hour = 8 if random.random() < 0.3 else 9
                        check_in_minute = random.randint(45, 59) if check_in_hour == 8 else random.randint(0, 14)

                    check_out_hour = random.randint(17, 18)
                    check_out_minute = random.randint(0, 55)

                    check_in_dt = timezone.make_aware(
                        datetime(record_date.year, record_date.month, record_date.day,
                                 check_in_hour, check_in_minute, 0)
                    )
                    check_out_dt = timezone.make_aware(
                        datetime(record_date.year, record_date.month, record_date.day,
                                 check_out_hour, check_out_minute, 0)
                    )
                    delta = check_out_dt - check_in_dt
                    working_hours = round(delta.total_seconds() / 3600, 2)
                    overtime = max(0, round(working_hours - 9, 2))
                else:
                    check_in_dt = None
                    check_out_dt = None
                    working_hours = 0
                    overtime = 0

                _, created = AttendanceRecord.objects.get_or_create(
                    employee=emp,
                    date=record_date,
                    defaults={
                        'check_in': check_in_dt,
                        'check_out': check_out_dt,
                        'status': status,
                        'working_hours': Decimal(str(working_hours)),
                        'overtime_hours': Decimal(str(overtime)),
                    }
                )
                if created:
                    count += 1

        self.stdout.write(f'  {count} attendance records created.')

    def _create_payroll_records(self):
        active_employees = list(Employee.objects.filter(status='active'))
        count = 0

        # Create payroll for Aug, Sep, Oct 2026
        for month in [8, 9, 10]:
            for emp in active_employees:
                basic = emp.basic_salary / 12  # Monthly basic
                allowances = round(basic * Decimal('0.10'), 2)
                bonuses = Decimal('0')
                deductions = round(basic * Decimal('0.08'), 2)
                gross = basic + allowances + bonuses
                net = gross - deductions

                status = 'paid' if month < 10 else 'processed'
                payment_date = date(2026, month, 28) if status == 'paid' else None

                _, created = PayrollRecord.objects.get_or_create(
                    employee=emp,
                    period_month=month,
                    period_year=2026,
                    defaults={
                        'basic_salary': round(basic, 2),
                        'allowances': allowances,
                        'bonuses': bonuses,
                        'deductions': deductions,
                        'gross_salary': round(gross, 2),
                        'net_salary': round(net, 2),
                        'status': status,
                        'payment_date': payment_date,
                        'breakdown': {
                            'basic_salary': str(round(basic, 2)),
                            'hra': str(round(basic * Decimal('0.06'), 2)),
                            'transport': str(round(basic * Decimal('0.04'), 2)),
                            'tax': str(round(basic * Decimal('0.05'), 2)),
                            'insurance': str(round(basic * Decimal('0.03'), 2)),
                        },
                    }
                )
                if created:
                    count += 1

        self.stdout.write(f'  {count} payroll records created.')

    def _create_tasks(self):
        active_employees = list(Employee.objects.filter(status='active')[:15])
        admin_user = User.objects.filter(role='admin').first()
        hr_user = User.objects.filter(role='hr_manager').first()
        today = timezone.now().date()

        tasks_data = [
            ('Update employee handbook section 4.2', 'Review and update the remote work policy section to reflect the new hybrid guidelines.', 'high', 'in_progress', today + timedelta(days=5)),
            ('Complete Q3 performance self-assessment', 'Fill out the self-assessment form covering achievements, challenges, and goals for Q3 2026.', 'medium', 'todo', today + timedelta(days=10)),
            ('Review new hire onboarding checklist', 'Verify all onboarding steps are documented and up to date for the engineering team.', 'medium', 'completed', today - timedelta(days=3)),
            ('Submit expense reports for October', 'Compile and submit all business expense receipts for October 2026.', 'low', 'todo', today + timedelta(days=7)),
            ('Prepare team standup presentation', 'Create slides summarizing sprint progress and blockers for the weekly team standup.', 'medium', 'in_progress', today + timedelta(days=2)),
            ('Schedule annual compliance training', 'Coordinate with Legal to schedule mandatory compliance training for all departments.', 'high', 'todo', today + timedelta(days=14)),
            ('Audit vendor contracts for renewal', 'Review expiring vendor contracts and prepare renewal recommendations.', 'high', 'in_progress', today + timedelta(days=8)),
            ('Update emergency contact information', 'Ensure all employee emergency contact records are current in the HR system.', 'low', 'completed', today - timedelta(days=7)),
            ('Draft job description for DevOps role', 'Write a comprehensive job description for the open Senior DevOps Engineer position.', 'medium', 'in_progress', today + timedelta(days=6)),
            ('Organize team building event', 'Plan and coordinate the quarterly team building activity for November.', 'low', 'todo', today + timedelta(days=21)),
            ('Review and approve time-off requests', 'Process pending time-off requests in the leave management system.', 'high', 'todo', today + timedelta(days=1)),
            ('Update project documentation wiki', 'Ensure all project docs are current and properly organized in Confluence.', 'medium', 'in_progress', today + timedelta(days=12)),
            ('Conduct mid-year budget review', 'Analyze department spending against budget and prepare variance report.', 'high', 'todo', today + timedelta(days=15)),
            ('Set up new employee workstation', 'Configure laptop, accounts, and access for the new hire starting November 1.', 'urgent', 'in_progress', today + timedelta(days=3)),
            ('Archive completed project files', 'Move completed Q2 project files to the archive storage following retention policy.', 'low', 'completed', today - timedelta(days=10)),
        ]

        count = 0
        for i, (title, desc, priority, status, due) in enumerate(tasks_data):
            emp = active_employees[i % len(active_employees)]
            assigner = admin_user if i % 2 == 0 else hr_user
            completed_at = timezone.now() - timedelta(days=random.randint(1, 5)) if status == 'completed' else None

            _, created = Task.objects.get_or_create(
                title=title,
                assigned_to=emp,
                defaults={
                    'description': desc,
                    'assigned_by': assigner,
                    'priority': priority,
                    'status': status,
                    'due_date': due,
                    'completed_at': completed_at,
                }
            )
            if created:
                count += 1
        self.stdout.write(f'  {count} tasks created.')

    def _create_notifications(self):
        admin_user = User.objects.filter(role='admin').first()
        hr_user = User.objects.filter(role='hr_manager').first()
        emp_user = User.objects.filter(role='employee').first()

        notif_data = [
            (admin_user, 'New Leave Request', 'Emily Chen has submitted a casual leave request for Nov 3-4, 2026.', 'leave_submitted', '/leaves'),
            (admin_user, 'Leave Request Reminder', 'There are 5 pending leave requests awaiting your approval.', 'leave_submitted', '/leaves'),
            (admin_user, 'Task Completed', 'Review of new hire onboarding checklist has been marked as completed.', 'task_completed', '/tasks'),
            (admin_user, 'Payroll Processed', 'October 2026 payroll has been processed for 29 employees.', 'payslip', '/payroll'),
            (admin_user, 'New Employee Joined', 'Lucas Bennett (EMP-030) has joined the Engineering department.', 'general', '/employees'),
            (hr_user, 'Leave Request Submitted', 'Michael Rodriguez has submitted a casual leave request for Nov 10-11.', 'leave_submitted', '/leaves'),
            (hr_user, 'Onboarding Task Due', 'Onboarding tasks for Derek Hughes are due this week.', 'task_assigned', '/onboarding'),
            (hr_user, 'Performance Review Reminder', 'Q3 performance reviews are due by end of this month.', 'general', '/performance'),
            (emp_user, 'Leave Approved', 'Your casual leave request for Mar 10-11, 2026 has been approved.', 'leave_approved', '/leaves'),
            (emp_user, 'New Task Assigned', 'You have been assigned: "Complete Q3 performance self-assessment".', 'task_assigned', '/tasks'),
            (emp_user, 'Payslip Available', 'Your September 2026 payslip is now available for download.', 'payslip', '/payroll'),
            (emp_user, 'Company Announcement', 'New office renovation schedule has been announced.', 'announcement', '/announcements'),
        ]

        count = 0
        for i, (recipient, title, message, ntype, link) in enumerate(notif_data):
            if not recipient:
                continue
            _, created = Notification.objects.get_or_create(
                recipient=recipient,
                title=title,
                message=message,
                defaults={
                    'notification_type': ntype,
                    'is_read': i < 3,  # First few are read
                    'link': link,
                }
            )
            if created:
                count += 1
        self.stdout.write(f'  {count} notifications created.')

    def _create_announcements(self):
        admin_user = User.objects.filter(role='admin').first()

        announcements_data = [
            ('Q4 2026 Company Goals and Priorities',
             'As we enter Q4, I want to share our key priorities for the remainder of the year:\n\n'
             '1. Complete the platform migration to the new cloud infrastructure by November 30.\n'
             '2. Launch the redesigned customer portal by mid-December.\n'
             '3. Achieve 95% customer satisfaction score across all support channels.\n'
             '4. Finalize hiring for 5 open engineering positions.\n\n'
             'Each department head will share specific OKRs during the all-hands meeting this Friday. '
             'Thank you for your continued hard work and dedication.',
             True),
            ('Office Renovation Schedule - November 2026',
             'We are excited to announce that the 3rd floor renovation will begin on November 10, 2026. '
             'During this time, teams currently on the 3rd floor will be temporarily relocated to the 2nd floor conference area.\n\n'
             'Key dates:\n'
             '- Nov 10-14: Furniture removal and electrical work\n'
             '- Nov 17-21: New workstation installation\n'
             '- Nov 24: Move-in day\n\n'
             'Please label all personal items before November 8. Contact Operations if you have questions.',
             True),
            ('Updated Remote Work Policy - Effective November 1',
             'After reviewing team feedback and productivity data, we are updating our hybrid work policy:\n\n'
             '- Employees may work remotely up to 3 days per week (previously 2).\n'
             '- Core collaboration hours remain 10 AM - 3 PM local time.\n'
             '- All team members must be in office on Tuesdays and Thursdays.\n'
             '- Remote work requests should be submitted at least 24 hours in advance.\n\n'
             'The full policy document is available on the HR portal. Reach out to your HR partner with questions.',
             True),
            ('Annual Health & Wellness Fair - November 20',
             'Join us for our annual Health & Wellness Fair on November 20 from 11 AM to 3 PM in the main lobby!\n\n'
             'This year\'s event includes:\n'
             '- Free flu shots and health screenings\n'
             '- Yoga and meditation sessions\n'
             '- Healthy cooking demonstrations\n'
             '- Mental health resources and counseling information\n'
             '- Fitness challenge sign-ups\n\n'
             'Lunch will be provided. Please RSVP through the events calendar by November 15.',
             True),
            ('Year-End Holiday Schedule',
             'The office will observe the following holidays for the remainder of 2026:\n\n'
             '- Thanksgiving: November 26-27 (Thu-Fri)\n'
             '- Christmas: December 24-25 (Thu-Fri)\n'
             '- New Year: January 1, 2027 (Thu)\n\n'
             'Employees are encouraged to plan their PTO early for the holiday season. '
             'Please submit leave requests by November 15 to ensure adequate team coverage.',
             True),
        ]

        count = 0
        for title, content, is_published in announcements_data:
            _, created = Announcement.objects.get_or_create(
                title=title,
                defaults={
                    'content': content,
                    'author': admin_user,
                    'is_published': is_published,
                }
            )
            if created:
                count += 1
        self.stdout.write(f'  {count} announcements created.')

    def _create_performance_goals(self):
        active_employees = list(Employee.objects.filter(status='active')[:12])
        admin_user = User.objects.filter(role='admin').first()
        today = timezone.now().date()

        goals_data = [
            ('Improve API response time', 'Reduce average API response time to under 200ms for all critical endpoints.', 'Average response time < 200ms across all monitored endpoints', 'in_progress', 65),
            ('Complete AWS certification', 'Obtain AWS Solutions Architect Professional certification by year end.', 'Pass the AWS SAP exam', 'in_progress', 40),
            ('Reduce customer churn by 15%', 'Implement retention strategies to reduce monthly churn rate from 5% to 4.25%.', 'Monthly churn rate <= 4.25%', 'not_started', 0),
            ('Launch mobile app v2.0', 'Complete development and launch of the redesigned mobile application.', 'App published to both App Store and Google Play', 'in_progress', 75),
            ('Mentor 2 junior developers', 'Provide structured mentorship to two junior team members through pair programming and code reviews.', 'Both mentees promoted or given positive reviews', 'in_progress', 50),
            ('Implement CI/CD pipeline', 'Set up automated testing and deployment pipeline for the main product.', 'Zero manual deployment steps for production releases', 'completed', 100),
            ('Increase sales pipeline by 25%', 'Generate and qualify 25% more leads compared to Q2.', 'Pipeline value increase >= 25% QoQ', 'in_progress', 30),
            ('Redesign onboarding flow', 'Create a streamlined onboarding experience reducing time-to-productivity for new hires.', 'Average onboarding time reduced by 30%', 'not_started', 0),
            ('Achieve SOC 2 compliance', 'Complete all required controls and documentation for SOC 2 Type II certification.', 'SOC 2 Type II report received', 'in_progress', 55),
            ('Build analytics dashboard', 'Create a real-time analytics dashboard for executive team showing key business metrics.', 'Dashboard deployed and adopted by leadership', 'in_progress', 80),
        ]

        count = 0
        for i, (title, desc, target, status, progress) in enumerate(goals_data):
            emp = active_employees[i % len(active_employees)]
            _, created = PerformanceGoal.objects.get_or_create(
                employee=emp,
                title=title,
                defaults={
                    'description': desc,
                    'target': target,
                    'start_date': date(2026, 7, 1),
                    'end_date': date(2026, 12, 31),
                    'status': status,
                    'progress': progress,
                    'created_by': admin_user,
                }
            )
            if created:
                count += 1
        self.stdout.write(f'  {count} performance goals created.')

    def _create_recruitment_data(self):
        admin_user = User.objects.filter(role='admin').first()
        eng_dept = Department.objects.filter(name='Engineering').first()
        design_dept = Department.objects.filter(name='Design').first()
        marketing_dept = Department.objects.filter(name='Marketing').first()
        product_dept = Department.objects.filter(name='Product').first()

        openings_data = [
            ('Senior DevOps Engineer', eng_dept,
             'We are looking for an experienced DevOps engineer to lead our cloud infrastructure initiatives. '
             'You will design and maintain CI/CD pipelines, manage AWS infrastructure, and mentor junior team members.',
             'full_time', 'Austin, TX (Hybrid)', 1, 'open'),
            ('Product Designer', design_dept,
             'Join our design team to create intuitive and visually compelling user interfaces for our SaaS platform. '
             'You will work closely with product managers and engineers to deliver pixel-perfect designs.',
             'full_time', 'Remote', 2, 'open'),
            ('Content Marketing Manager', marketing_dept,
             'Lead our content strategy across blog, social media, and email channels. '
             'Drive brand awareness and generate qualified leads through compelling content.',
             'full_time', 'Austin, TX', 1, 'open'),
            ('Junior Software Engineer', eng_dept,
             'Great opportunity for recent graduates to join a fast-growing engineering team. '
             'You will work on full-stack features using React and Django.',
             'full_time', 'Austin, TX (Hybrid)', 2, 'open'),
            ('Technical Product Manager', product_dept,
             'Own the product roadmap for our developer tools platform. '
             'Requires strong technical background and experience with API-first products.',
             'full_time', 'Remote', 1, 'on_hold'),
        ]

        openings = {}
        count = 0
        for title, dept, desc, emp_type, location, positions, status in openings_data:
            opening, created = JobOpening.objects.get_or_create(
                title=title,
                department=dept,
                defaults={
                    'description': desc,
                    'employment_type': emp_type,
                    'location': location,
                    'positions': positions,
                    'status': status,
                    'posted_by': admin_user,
                }
            )
            openings[title] = opening
            if created:
                count += 1
        self.stdout.write(f'  {count} job openings created.')

        candidates_data = [
            ('Senior DevOps Engineer', 'Raj Kapoor', 'raj.kapoor@email.com', '+1 (555) 200-0001', 'interview', 4),
            ('Senior DevOps Engineer', 'Lisa Park', 'lisa.park@email.com', '+1 (555) 200-0002', 'screening', None),
            ('Product Designer', 'Mia Johnson', 'mia.johnson@email.com', '+1 (555) 200-0003', 'offered', 5),
            ('Product Designer', 'Tom Keller', 'tom.keller@email.com', '+1 (555) 200-0004', 'interview', 3),
            ('Product Designer', 'Ana Ruiz', 'ana.ruiz@email.com', '+1 (555) 200-0005', 'applied', None),
            ('Content Marketing Manager', 'Chris Moore', 'chris.moore@email.com', '+1 (555) 200-0006', 'interview', 4),
            ('Content Marketing Manager', 'Sarah Blake', 'sarah.blake@email.com', '+1 (555) 200-0007', 'rejected', 2),
            ('Junior Software Engineer', 'Alex Tan', 'alex.tan@email.com', '+1 (555) 200-0008', 'screening', None),
            ('Junior Software Engineer', 'Jordan Hill', 'jordan.hill@email.com', '+1 (555) 200-0009', 'applied', None),
            ('Junior Software Engineer', 'Priya Mehta', 'priya.mehta@email.com', '+1 (555) 200-0010', 'interview', 4),
        ]

        cand_count = 0
        for opening_title, name, email, phone, stage, rating in candidates_data:
            opening = openings.get(opening_title)
            if not opening:
                continue
            _, created = Candidate.objects.get_or_create(
                job_opening=opening,
                email=email,
                defaults={
                    'name': name,
                    'phone': phone,
                    'stage': stage,
                    'rating': rating,
                }
            )
            if created:
                cand_count += 1
        self.stdout.write(f'  {cand_count} candidates created.')
