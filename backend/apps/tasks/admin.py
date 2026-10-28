from django.contrib import admin
from .models import Task, TaskComment

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'assigned_to', 'priority', 'status', 'due_date']
    list_filter = ['priority', 'status']
    search_fields = ['title']

@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = ['task', 'author', 'created_at']
