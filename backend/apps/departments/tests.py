from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.departments.models import Department
from apps.employees.models import Employee
from datetime import date
from decimal import Decimal

User = get_user_model()


class DepartmentTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='admin', password='TestPass123!',
            email='admin@test.com', role='admin',
            first_name='Admin', last_name='User'
        )
        self.emp_user = User.objects.create_user(
            username='emp1', password='TestPass123!',
            email='emp1@test.com', role='employee',
        )
        self.dept = Department.objects.create(name='Engineering', description='Dev team')

    def test_admin_can_list_departments(self):
        self.client.force_authenticate(user=self.admin)
        r = self.client.get('/api/departments/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_employee_cannot_access_departments(self):
        self.client.force_authenticate(user=self.emp_user)
        r = self.client.get('/api/departments/')
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_create_department(self):
        self.client.force_authenticate(user=self.admin)
        r = self.client.post('/api/departments/', {'name': 'Marketing', 'description': 'Growth team'})
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Department.objects.count(), 2)

    def test_cannot_delete_department_with_active_employees(self):
        self.client.force_authenticate(user=self.admin)
        emp = Employee.objects.create(
            user=self.emp_user, employee_id='EMP-X01',
            department=self.dept, joining_date=date(2024, 1, 1),
            basic_salary=Decimal('80000'), status='active',
        )
        r = self.client.delete(f'/api/departments/{self.dept.id}/')
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(Department.objects.filter(id=self.dept.id).exists())

    def test_can_delete_empty_department(self):
        self.client.force_authenticate(user=self.admin)
        empty = Department.objects.create(name='Empty Dept')
        r = self.client.delete(f'/api/departments/{empty.id}/')
        self.assertEqual(r.status_code, status.HTTP_204_NO_CONTENT)
