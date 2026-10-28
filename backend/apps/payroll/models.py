from django.db import models
from django.conf import settings


class PayrollRecord(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        PROCESSED = 'processed', 'Processed'
        PAID = 'paid', 'Paid'

    employee = models.ForeignKey(
        'employees.Employee', on_delete=models.CASCADE, related_name='payroll_records'
    )
    period_month = models.IntegerField()
    period_year = models.IntegerField()
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2)
    allowances = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    bonuses = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    gross_salary = models.DecimalField(max_digits=12, decimal_places=2)
    net_salary = models.DecimalField(max_digits=12, decimal_places=2)
    breakdown = models.JSONField(default=dict, blank=True, help_text='Detailed calculation breakdown')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    payment_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='processed_payrolls'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payroll_records'
        ordering = ['-period_year', '-period_month']
        unique_together = ['employee', 'period_month', 'period_year']

    def __str__(self):
        return f"{self.employee.employee_id} - {self.period_month}/{self.period_year}"

    def calculate(self):
        self.gross_salary = self.basic_salary + self.allowances + self.bonuses
        self.net_salary = self.gross_salary - self.deductions
        self.breakdown = {
            'basic_salary': str(self.basic_salary),
            'allowances': str(self.allowances),
            'bonuses': str(self.bonuses),
            'gross_salary': str(self.gross_salary),
            'deductions': str(self.deductions),
            'net_salary': str(self.net_salary),
        }


class SalaryRevision(models.Model):
    employee = models.ForeignKey(
        'employees.Employee', on_delete=models.CASCADE, related_name='salary_revisions'
    )
    previous_salary = models.DecimalField(max_digits=12, decimal_places=2)
    new_salary = models.DecimalField(max_digits=12, decimal_places=2)
    effective_date = models.DateField()
    reason = models.TextField(blank=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'salary_revisions'
        ordering = ['-effective_date']

    def __str__(self):
        return f"{self.employee.employee_id}: {self.previous_salary} -> {self.new_salary}"
