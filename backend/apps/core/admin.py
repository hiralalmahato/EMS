from django.contrib import admin
from .models import CompanySettings, AuditLog, Holiday, WorkSchedule

@admin.register(CompanySettings)
class CompanySettingsAdmin(admin.ModelAdmin):
    list_display = ['company_name', 'email', 'phone']

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'model_name', 'timestamp']
    list_filter = ['action', 'model_name']
    readonly_fields = ['user', 'action', 'model_name', 'object_id', 'changes', 'ip_address', 'timestamp']

@admin.register(Holiday)
class HolidayAdmin(admin.ModelAdmin):
    list_display = ['name', 'date', 'is_optional']

@admin.register(WorkSchedule)
class WorkScheduleAdmin(admin.ModelAdmin):
    list_display = ['name', 'start_time', 'end_time', 'is_default']
