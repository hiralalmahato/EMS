from django.db import models
from django.conf import settings


class CompanySettings(models.Model):
    company_name = models.CharField(max_length=200, default='Acme Corporation')
    company_logo = models.ImageField(upload_to='company/', blank=True, null=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    zip_code = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)
    fiscal_year_start = models.IntegerField(default=1, help_text='Month number (1-12)')
    date_format = models.CharField(max_length=20, default='YYYY-MM-DD')
    currency = models.CharField(max_length=10, default='USD')
    currency_symbol = models.CharField(max_length=5, default='$')

    class Meta:
        db_table = 'company_settings'
        verbose_name_plural = 'Company Settings'

    def __str__(self):
        return self.company_name


class AuditLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=50)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=50, blank=True)
    changes = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user} - {self.action} - {self.model_name} at {self.timestamp}"


class Holiday(models.Model):
    name = models.CharField(max_length=200)
    date = models.DateField()
    is_optional = models.BooleanField(default=False)
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'holidays'
        ordering = ['date']
        unique_together = ['name', 'date']

    def __str__(self):
        return f"{self.name} ({self.date})"


class WorkSchedule(models.Model):
    name = models.CharField(max_length=100)
    start_time = models.TimeField()
    end_time = models.TimeField()
    grace_period_minutes = models.IntegerField(default=15)
    is_default = models.BooleanField(default=False)
    working_days = models.JSONField(
        default=list,
        help_text='List of working day numbers (0=Monday, 6=Sunday)'
    )

    class Meta:
        db_table = 'work_schedules'

    def __str__(self):
        return self.name
