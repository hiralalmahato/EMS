from django.contrib import admin
from .models import Employee, EmployeeDocument


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['employee_id', 'user', 'department', 'designation', 'status', 'joining_date']
    list_filter = ['status', 'department', 'employment_type']
    search_fields = ['employee_id', 'user__first_name', 'user__last_name', 'user__email']
    raw_id_fields = ['user', 'reporting_manager']


@admin.register(EmployeeDocument)
class EmployeeDocumentAdmin(admin.ModelAdmin):
    list_display = ['employee', 'document_type', 'title', 'uploaded_at']
    list_filter = ['document_type']
