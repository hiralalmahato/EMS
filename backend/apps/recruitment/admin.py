from django.contrib import admin
from .models import JobOpening, Candidate

@admin.register(JobOpening)
class JobOpeningAdmin(admin.ModelAdmin):
    list_display = ['title', 'department', 'status', 'positions', 'opening_date']
    list_filter = ['status', 'department']

@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ['name', 'job_opening', 'stage', 'rating', 'application_date']
    list_filter = ['stage']
