from django.contrib import admin
from .models import PerformanceGoal, PerformanceReview

@admin.register(PerformanceGoal)
class PerformanceGoalAdmin(admin.ModelAdmin):
    list_display = ['employee', 'title', 'status', 'progress', 'end_date']
    list_filter = ['status']

@admin.register(PerformanceReview)
class PerformanceReviewAdmin(admin.ModelAdmin):
    list_display = ['employee', 'reviewer', 'rating', 'period_end', 'is_finalized']
    list_filter = ['is_finalized']
