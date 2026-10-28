from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from apps.departments.models import Department
from apps.employees.models import Employee
from apps.attendance.models import AttendanceRecord
from datetime import date, datetime, timedelta
from decimal import Decimal

User = get_user_model()


class AttendanceTests(TestCase):
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
            user=self.emp_user, employee_id='EMP-A01',
            department=self.dept, joining_date=date(2024, 1, 1),
            basic_salary=Decimal('100000'), status='active',
        )

    def test_employee_can_check_in(self):
        self.client.force_authenticate(user=self.emp_user)
        r = self.client.post('/api/attendance/check_in/')
        self.assertIn(r.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])

    def test_cannot_check_in_twice_same_day(self):
        self.client.force_authenticate(user=self.emp_user)
        self.client.post('/api/attendance/check_in/')
        r = self.client.post('/api/attendance/check_in/')
        self.assertIn(r.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_409_CONFLICT])

    def test_employee_can_check_out(self):
        self.client.force_authenticate(user=self.emp_user)
        self.client.post('/api/attendance/check_in/')
        r = self.client.post('/api/attendance/check_out/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        record = AttendanceRecord.objects.get(employee=self.employee)
        self.assertIsNotNone(record.check_out)

    def test_admin_can_view_all_attendance(self):
        self.client.force_authenticate(user=self.admin)
        r = self.client.get('/api/attendance/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
