from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class ReportsTests(TestCase):
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

    def test_admin_can_access_dashboard(self):
        self.client.force_authenticate(user=self.admin)
        r = self.client.get('/api/reports/dashboard/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertIn('kpi', r.data)

    def test_employee_can_access_dashboard(self):
        self.client.force_authenticate(user=self.emp_user)
        r = self.client.get('/api/reports/dashboard/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_admin_can_access_reports(self):
        self.client.force_authenticate(user=self.admin)
        for report_type in ['overview', 'attendance', 'leave', 'payroll']:
            r = self.client.get(f'/api/reports/reports/?type={report_type}')
            self.assertEqual(r.status_code, status.HTTP_200_OK, f'Failed for type={report_type}')

    def test_employee_cannot_access_reports(self):
        self.client.force_authenticate(user=self.emp_user)
        r = self.client.get('/api/reports/reports/?type=overview')
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)


class CoreSettingsTests(TestCase):
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

    def test_anyone_can_read_settings(self):
        self.client.force_authenticate(user=self.emp_user)
        r = self.client.get('/api/core/settings/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_admin_can_update_settings(self):
        self.client.force_authenticate(user=self.admin)
        r = self.client.patch('/api/core/settings/', {'company_name': 'Updated Inc'}, format='json')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data['company_name'], 'Updated Inc')

    def test_employee_cannot_update_settings(self):
        self.client.force_authenticate(user=self.emp_user)
        r = self.client.patch('/api/core/settings/', {'company_name': 'Hacked'}, format='json')
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_holidays_list(self):
        self.client.force_authenticate(user=self.emp_user)
        r = self.client.get('/api/core/holidays/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_employee_cannot_create_holiday(self):
        self.client.force_authenticate(user=self.emp_user)
        r = self.client.post('/api/core/holidays/', {'name': 'Hack Day', 'date': '2026-01-01'})
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)
