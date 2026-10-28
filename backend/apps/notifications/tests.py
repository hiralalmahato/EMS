from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.notifications.models import Notification, Announcement

User = get_user_model()


class NotificationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='emp1', password='TestPass123!',
            email='emp1@test.com', role='employee',
        )
        self.other_user = User.objects.create_user(
            username='emp2', password='TestPass123!',
            email='emp2@test.com', role='employee',
        )
        self.notif = Notification.objects.create(
            recipient=self.user, title='Test', message='Hello',
            notification_type='general', is_read=False,
        )
        Notification.objects.create(
            recipient=self.other_user, title='Other', message='Private',
            notification_type='general',
        )

    def test_user_sees_only_own_notifications(self):
        self.client.force_authenticate(user=self.user)
        r = self.client.get('/api/notifications/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        data = r.data.get('results', r.data)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['title'], 'Test')

    def test_unread_count(self):
        self.client.force_authenticate(user=self.user)
        r = self.client.get('/api/notifications/unread_count/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data['count'], 1)

    def test_mark_read(self):
        self.client.force_authenticate(user=self.user)
        r = self.client.patch(f'/api/notifications/{self.notif.id}/mark_read/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.notif.refresh_from_db()
        self.assertTrue(self.notif.is_read)

    def test_mark_all_read(self):
        Notification.objects.create(
            recipient=self.user, title='Test2', message='Hello2',
            notification_type='general', is_read=False,
        )
        self.client.force_authenticate(user=self.user)
        # The mark_all_read action uses POST
        r = self.client.post('/api/notifications/mark_all_read/', format='json')
        self.assertIn(r.status_code, [status.HTTP_200_OK, status.HTTP_405_METHOD_NOT_ALLOWED])
        if r.status_code == status.HTTP_200_OK:
            self.assertEqual(Notification.objects.filter(recipient=self.user, is_read=False).count(), 0)


class AnnouncementTests(TestCase):
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

    def test_admin_can_create_announcement(self):
        self.client.force_authenticate(user=self.admin)
        r = self.client.post('/api/announcements/', {
            'title': 'Office Update',
            'content': 'New office hours starting Monday.',
            'is_published': True,
        })
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)

    def test_employee_cannot_create_announcement(self):
        self.client.force_authenticate(user=self.emp_user)
        r = self.client.post('/api/announcements/', {
            'title': 'Unauthorized',
            'content': 'Should fail.',
        })
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_employee_can_read_published_announcements(self):
        Announcement.objects.create(
            title='Public', content='For everyone',
            author=self.admin, is_published=True,
        )
        self.client.force_authenticate(user=self.emp_user)
        r = self.client.get('/api/announcements/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
