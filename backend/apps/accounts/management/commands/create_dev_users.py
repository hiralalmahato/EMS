from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Create development users for testing'

    def handle(self, *args, **options):
        users = [
            {
                'username': 'admin',
                'email': 'admin@ems.local',
                'password': 'admin123!@#',
                'first_name': 'Sarah',
                'last_name': 'Mitchell',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
            },
            {
                'username': 'hr_manager',
                'email': 'hr@ems.local',
                'password': 'hr123!@#',
                'first_name': 'James',
                'last_name': 'Wilson',
                'role': 'hr_manager',
                'is_staff': True,
            },
            {
                'username': 'employee1',
                'email': 'employee1@ems.local',
                'password': 'emp123!@#',
                'first_name': 'Emily',
                'last_name': 'Chen',
                'role': 'employee',
            },
        ]

        for user_data in users:
            password = user_data.pop('password')
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults=user_data,
            )
            if created:
                user.set_password(password)
                user.save()
                self.stdout.write(self.style.SUCCESS(f'Created user: {user.username} ({user.role})'))
            else:
                self.stdout.write(self.style.WARNING(f'User already exists: {user.username}'))
