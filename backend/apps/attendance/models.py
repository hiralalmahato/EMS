from django.db import models
from django.conf import settings
from django.utils import timezone


class AttendanceRecord(models.Model):
    class Status(models.TextChoices):
        PRESENT = 'present', 'Present'
        ABSENT = 'absent', 'Absent'
        LATE = 'late', 'Late'
        HALF_DAY = 'half_day', 'Half Day'
        ON_LEAVE = 'on_leave', 'On Leave'
        HOLIDAY = 'holiday', 'Holiday'
        WEEKEND = 'weekend', 'Weekend'

    employee = models.ForeignKey(
        'employees.Employee',
        on_delete=models.CASCADE,
        related_name='attendance_records'
    )
    date = models.DateField(db_index=True)
    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PRESENT)
    working_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    overtime_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    is_manual_entry = models.BooleanField(default=False)
    modified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='attendance_modifications'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'attendance_records'
        ordering = ['-date', '-check_in']
        unique_together = ['employee', 'date']
        indexes = [
            models.Index(fields=['employee', 'date']),
            models.Index(fields=['date', 'status']),
        ]

    def __str__(self):
        return f"{self.employee.employee_id} - {self.date} ({self.status})"

    def calculate_working_hours(self):
        if self.check_in and self.check_out:
            delta = self.check_out - self.check_in
            hours = delta.total_seconds() / 3600
            return round(hours, 2)
        return 0

    def save(self, *args, **kwargs):
        if self.check_in and self.check_out:
            self.working_hours = self.calculate_working_hours()
        super().save(*args, **kwargs)
