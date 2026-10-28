from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        HR_MANAGER = 'hr_manager', 'HR Manager'
        EMPLOYEE = 'employee', 'Employee'

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.EMPLOYEE)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'users'
        ordering = ['first_name', 'last_name']

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN

    @property
    def is_hr_manager(self):
        return self.role == self.Role.HR_MANAGER

    @property
    def is_employee_role(self):
        return self.role == self.Role.EMPLOYEE
