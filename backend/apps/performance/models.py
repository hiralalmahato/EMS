from django.db import models
from django.conf import settings


class PerformanceGoal(models.Model):
    class Status(models.TextChoices):
        NOT_STARTED = 'not_started', 'Not Started'
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'

    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE, related_name='performance_goals')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    target = models.TextField(blank=True, help_text='Measurable target')
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NOT_STARTED)
    progress = models.IntegerField(default=0, help_text='Percentage 0-100')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_goals')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'performance_goals'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.employee.employee_id} - {self.title}"


class PerformanceReview(models.Model):
    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE, related_name='performance_reviews')
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='given_reviews')
    period_start = models.DateField()
    period_end = models.DateField()
    rating = models.IntegerField(choices=[(i, str(i)) for i in range(1, 6)], null=True, blank=True)
    self_assessment = models.TextField(blank=True)
    manager_feedback = models.TextField(blank=True)
    strengths = models.TextField(blank=True)
    improvements = models.TextField(blank=True)
    is_finalized = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'performance_reviews'
        ordering = ['-period_end']

    def __str__(self):
        return f"{self.employee.employee_id} review ({self.period_start} to {self.period_end})"
