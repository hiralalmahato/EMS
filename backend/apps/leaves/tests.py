from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.departments.models import Department
from apps.employees.models import Employee
from apps.leaves.models import LeaveType, LeaveBalance, LeaveRequest
from datetime import date
from decimal import Decimal

User = get_user_model()


class LeaveTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='admin', password='TestPass123!',
            email='admin@test.com', role='admin',
        )
        self.emp_user = User.objects.create_user(
            username='emp1', password='TestPass123!',
            email='emp1@test.com', role='employee',
        )
        self.dept = Department.objects.create(name='Engineering')
        self.admin_emp = Employee.objects.create(
            user=self.admin, employee_id='EMP-ADM',
            department=self.dept, joining_date=date(2020, 1, 1),
            basic_salary=Decimal('150000'), status='active',
        )
        self.employee = Employee.objects.create(
            user=self.emp_user, employee_id='EMP-L01',
            department=self.dept, joining_date=date(2024, 1, 1),
            basic_salary=Decimal('100000'), status='active',
        )
        self.leave_type = LeaveType.objects.create(
            name='Casual Leave', code='CL', days_per_year=12, is_paid=True
        )
        self.balance = LeaveBalance.objects.create(
            employee=self.employee, leave_type=self.leave_type,
            year=2026, total_days=12, used_days=0,
        )

    def test_employee_can_request_leave(self):
        self.client.force_authenticate(user=self.emp_user)
        r = self.client.post('/api/leaves/requests/', {
            'leave_type': self.leave_type.id,
            'start_date': '2026-12-01',
            'end_date': '2026-12-02',
            'total_days': '2.0',
            'reason': 'Personal matter',
        })
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertEqual(LeaveRequest.objects.count(), 1)
        self.assertEqual(LeaveRequest.objects.first().status, 'pending')

    def test_admin_can_approve_leave(self):
        self.client.force_authenticate(user=self.emp_user)
        r = self.client.post('/api/leaves/requests/', {
            'leave_type': self.leave_type.id,
            'start_date': '2026-12-01',
            'end_date': '2026-12-02',
            'total_days': '2.0',
            'reason': 'Personal matter',
        })
        leave_id = r.data['id']

        self.client.force_authenticate(user=self.admin)
        r = self.client.post(f'/api/leaves/requests/{leave_id}/approve/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        req = LeaveRequest.objects.get(id=leave_id)
        self.assertEqual(req.status, 'approved')

    def test_admin_can_reject_leave(self):
        self.client.force_authenticate(user=self.emp_user)
        r = self.client.post('/api/leaves/requests/', {
            'leave_type': self.leave_type.id,
            'start_date': '2026-12-05',
            'end_date': '2026-12-05',
            'total_days': '1.0',
            'reason': 'Appointment',
        })
        leave_id = r.data['id']

        self.client.force_authenticate(user=self.admin)
        r = self.client.post(f'/api/leaves/requests/{leave_id}/reject/', {
            'rejection_reason': 'Insufficient coverage'
        })
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        req = LeaveRequest.objects.get(id=leave_id)
        self.assertEqual(req.status, 'rejected')

    def test_leave_types_list(self):
        self.client.force_authenticate(user=self.emp_user)
        r = self.client.get('/api/leaves/types/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(r.data), 1)

    def test_employee_can_view_balances(self):
        self.client.force_authenticate(user=self.emp_user)
        r = self.client.get('/api/leaves/requests/my_balances/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_pending_count(self):
        LeaveRequest.objects.create(
            employee=self.employee, leave_type=self.leave_type,
            start_date=date(2026, 12, 10), end_date=date(2026, 12, 11),
            total_days=2, reason='Test', status='pending',
        )
        self.client.force_authenticate(user=self.admin)
        r = self.client.get('/api/leaves/requests/pending_count/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data['count'], 1)
