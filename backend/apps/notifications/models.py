from django.db import models
from django.conf import settings


class Notification(models.Model):
    class NotifType(models.TextChoices):
        LEAVE_SUBMITTED = 'leave_submitted', 'Leave Request Submitted'
        LEAVE_APPROVED = 'leave_approved', 'Leave Approved'
        LEAVE_REJECTED = 'leave_rejected', 'Leave Rejected'
        TASK_ASSIGNED = 'task_assigned', 'Task Assigned'
        TASK_COMPLETED = 'task_completed', 'Task Completed'
        ANNOUNCEMENT = 'announcement', 'Announcement'
        PAYSLIP = 'payslip', 'Payslip Published'
        GENERAL = 'general', 'General'

    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=30, choices=NotifType.choices, default=NotifType.GENERAL)
    is_read = models.BooleanField(default=False)
    link = models.CharField(max_length=200, blank=True, help_text='Relative URL to the relevant page')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
        ]

    def __str__(self):
        return f"{self.recipient.username} - {self.title}"


class Announcement(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    target_roles = models.JSONField(default=list, blank=True, help_text='Empty = all roles')
    target_departments = models.ManyToManyField('departments.Department', blank=True)
    is_published = models.BooleanField(default=True)
    publish_date = models.DateField(auto_now_add=True)
    expiry_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'announcements'
        ordering = ['-publish_date']

    def __str__(self):
        return self.title
