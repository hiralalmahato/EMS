from django.db import models
from django.conf import settings


class OnboardingTemplate(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    department = models.ForeignKey('departments.Department', on_delete=models.SET_NULL, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'onboarding_templates'

    def __str__(self):
        return self.name


class OnboardingTask(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'
        SKIPPED = 'skipped', 'Skipped'

    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE, related_name='onboarding_tasks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=50, choices=[
        ('documentation', 'Documentation'),
        ('equipment', 'Equipment'),
        ('training', 'Training'),
        ('orientation', 'Orientation'),
        ('access', 'Access Setup'),
        ('other', 'Other'),
    ], default='other')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    due_date = models.DateField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'onboarding_tasks'
        ordering = ['due_date', 'created_at']

    def __str__(self):
        return f"{self.employee.employee_id} - {self.title}"


class OffboardingRecord(models.Model):
    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE, related_name='offboarding_records')
    reason = models.CharField(max_length=50, choices=[
        ('resignation', 'Resignation'),
        ('termination', 'Termination'),
        ('retirement', 'Retirement'),
        ('contract_end', 'Contract End'),
        ('other', 'Other'),
    ])
    last_working_date = models.DateField()
    exit_interview_notes = models.TextField(blank=True)
    equipment_returned = models.BooleanField(default=False)
    access_revoked = models.BooleanField(default=False)
    final_settlement_done = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    processed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'offboarding_records'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.employee.employee_id} - {self.reason}"
