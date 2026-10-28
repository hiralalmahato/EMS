from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.departments.models import Department, Designation
from apps.employees.models import Employee
from datetime import date
from decimal import Decimal

User = get_user_model()


class EmployeeTests(TestCase):
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
            first_name='John', last_name='Doe'
        )
        self.dept = Department.objects.create(name='Engineering')
        self.desig = Designation.objects.create(title='Engineer', department=self.dept, level=3)
        self.employee = Employee.objects.create(
            user=self.emp_user, employee_id='EMP-T01',
            department=self.dept, designation=self.desig,
            joining_date=date(2024, 1, 1),
            basic_salary=Decimal('100000'),
            status='active',
        )

    def test_admin_can_list_all_employees(self):
        self.client.force_authenticate(user=self.admin)
        r = self.client.get('/api/employees/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data['count'], 1)

    def test_employee_sees_only_own_record(self):
        self.client.force_authenticate(user=self.emp_user)
        r = self.client.get('/api/employees/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data['count'], 1)
        self.assertEqual(r.data['results'][0]['employee_id'], 'EMP-T01')

    def test_admin_can_create_employee(self):
        self.client.force_authenticate(user=self.admin)
        r = self.client.post('/api/employees/', {
            'employee_id': 'EMP-T02',
            'first_name': 'Jane',
            'last_name': 'Smith',
            'email': 'jane.smith@test.com',
            'password': 'TestPass123!',
            'department': self.dept.id,
            'designation': self.desig.id,
            'joining_date': '2024-06-01',
            'basic_salary': '95000.00',
            'employment_type': 'full_time',
            'status': 'active',
        }, format='json')
        self.assertIn(r.status_code, [status.HTTP_201_CREATED, status.HTTP_200_OK],
                       msg=f'Create employee failed: {r.data}')
        self.assertEqual(Employee.objects.count(), 2)

    def test_duplicate_employee_id_rejected(self):
        self.client.force_authenticate(user=self.admin)
        r = self.client.post('/api/employees/', {
            'employee_id': 'EMP-T01',  # Duplicate
            'first_name': 'Dup',
            'last_name': 'User',
            'email': 'dup@test.com',
            'department': self.dept.id,
            'joining_date': '2024-06-01',
            'basic_salary': '90000.00',
        })
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_employee_me_endpoint(self):
        self.client.force_authenticate(user=self.emp_user)
        r = self.client.get('/api/employees/me/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data['employee_id'], 'EMP-T01')
