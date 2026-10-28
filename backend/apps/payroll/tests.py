from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.departments.models import Department
from apps.employees.models import Employee
from apps.payroll.models import PayrollRecord
from datetime import date
from decimal import Decimal

User = get_user_model()


class PayrollTests(TestCase):
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
        self.employee = Employee.objects.create(
            user=self.emp_user, employee_id='EMP-P01',
            department=self.dept, joining_date=date(2024, 1, 1),
            basic_salary=Decimal('120000'), status='active',
        )

    def test_admin_can_create_payroll_record(self):
        self.client.force_authenticate(user=self.admin)
        r = self.client.post('/api/payroll/records/', {
            'employee': self.employee.id,
            'period_month': 10,
            'period_year': 2026,
            'basic_salary': '10000.00',
            'allowances': '1000.00',
            'bonuses': '0.00',
            'deductions': '800.00',
            'gross_salary': '11000.00',
            'net_salary': '10200.00',
        })
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)

    def test_employee_sees_only_paid_payroll(self):
        """Employees can access payroll list but only see their paid records."""
        self.client.force_authenticate(user=self.emp_user)
        r = self.client.get('/api/payroll/records/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        # No paid records exist yet, so should be empty
        self.assertEqual(r.data['count'], 0)

    def test_duplicate_payroll_period_rejected(self):
        self.client.force_authenticate(user=self.admin)
        PayrollRecord.objects.create(
            employee=self.employee, period_month=10, period_year=2026,
            basic_salary=Decimal('10000'), gross_salary=Decimal('11000'),
            net_salary=Decimal('10200'), allowances=Decimal('1000'),
            deductions=Decimal('800'),
        )
        r = self.client.post('/api/payroll/records/', {
            'employee': self.employee.id,
            'period_month': 10, 'period_year': 2026,
            'basic_salary': '10000.00',
            'gross_salary': '11000.00', 'net_salary': '10200.00',
        })
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_can_list_payroll(self):
        self.client.force_authenticate(user=self.admin)
        r = self.client.get('/api/payroll/records/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
