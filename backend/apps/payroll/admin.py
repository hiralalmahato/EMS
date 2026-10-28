from django.contrib import admin
from .models import PayrollRecord, SalaryRevision

@admin.register(PayrollRecord)
class PayrollRecordAdmin(admin.ModelAdmin):
    list_display = ['employee', 'period_month', 'period_year', 'gross_salary', 'net_salary', 'status']
    list_filter = ['status', 'period_year']

@admin.register(SalaryRevision)
class SalaryRevisionAdmin(admin.ModelAdmin):
    list_display = ['employee', 'previous_salary', 'new_salary', 'effective_date']
