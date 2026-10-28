from django.contrib import admin
from .models import OnboardingTask, OnboardingTemplate, OffboardingRecord

@admin.register(OnboardingTemplate)
class OnboardingTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'department', 'is_active']

@admin.register(OnboardingTask)
class OnboardingTaskAdmin(admin.ModelAdmin):
    list_display = ['employee', 'title', 'category', 'status', 'due_date']
    list_filter = ['status', 'category']

@admin.register(OffboardingRecord)
class OffboardingRecordAdmin(admin.ModelAdmin):
    list_display = ['employee', 'reason', 'last_working_date']
