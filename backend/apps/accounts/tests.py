from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class AuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='testadmin', password='TestPass123!',
            email='admin@test.com', role='admin',
            first_name='Test', last_name='Admin'
        )
        self.employee = User.objects.create_user(
            username='testemp', password='TestPass123!',
            email='emp@test.com', role='employee',
            first_name='Test', last_name='Employee'
        )

    def test_login_success(self):
        r = self.client.post('/api/auth/login/', {'username': 'testadmin', 'password': 'TestPass123!'})
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertIn('access', r.data)
        self.assertIn('refresh', r.data)
        self.assertIn('user', r.data)
        self.assertEqual(r.data['user']['role'], 'admin')

    def test_login_invalid_credentials(self):
        r = self.client.post('/api/auth/login/', {'username': 'testadmin', 'password': 'wrong'})
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_endpoint_authenticated(self):
        self.client.force_authenticate(user=self.admin)
        r = self.client.get('/api/auth/me/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data['username'], 'testadmin')

    def test_me_endpoint_unauthenticated(self):
        r = self.client.get('/api/auth/me/')
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_change_password(self):
        self.client.force_authenticate(user=self.admin)
        r = self.client.post('/api/auth/change-password/', {
            'old_password': 'TestPass123!',
            'new_password': 'NewPass456!',
        })
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        # Verify new password works
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.check_password('NewPass456!'))

    def test_change_password_wrong_old(self):
        self.client.force_authenticate(user=self.admin)
        r = self.client.post('/api/auth/change-password/', {
            'old_password': 'WrongPass!',
            'new_password': 'NewPass456!',
        })
        self.assertIn(r.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN])
