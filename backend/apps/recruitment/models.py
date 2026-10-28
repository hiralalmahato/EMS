from django.db import models
from django.conf import settings


class JobOpening(models.Model):
    class Status(models.TextChoices):
        OPEN = 'open', 'Open'
        CLOSED = 'closed', 'Closed'
        ON_HOLD = 'on_hold', 'On Hold'

    title = models.CharField(max_length=200)
    department = models.ForeignKey('departments.Department', on_delete=models.SET_NULL, null=True, related_name='job_openings')
    description = models.TextField()
    requirements = models.TextField(blank=True)
    location = models.CharField(max_length=100, blank=True)
    employment_type = models.CharField(max_length=20, choices=[
        ('full_time', 'Full Time'), ('part_time', 'Part Time'),
        ('contract', 'Contract'), ('intern', 'Intern'),
    ], default='full_time')
    positions = models.IntegerField(default=1)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    posted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    opening_date = models.DateField(auto_now_add=True)
    closing_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'job_openings'
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class Candidate(models.Model):
    class Stage(models.TextChoices):
        APPLIED = 'applied', 'Applied'
        SCREENING = 'screening', 'Screening'
        INTERVIEW = 'interview', 'Interview'
        OFFERED = 'offered', 'Offered'
        HIRED = 'hired', 'Hired'
        REJECTED = 'rejected', 'Rejected'

    job_opening = models.ForeignKey(JobOpening, on_delete=models.CASCADE, related_name='candidates')
    name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    resume = models.FileField(upload_to='recruitment/resumes/', blank=True, null=True)
    stage = models.CharField(max_length=20, choices=Stage.choices, default=Stage.APPLIED)
    interview_date = models.DateTimeField(null=True, blank=True)
    interviewer_notes = models.TextField(blank=True)
    rating = models.IntegerField(null=True, blank=True, choices=[(i, str(i)) for i in range(1, 6)])
    application_date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'candidates'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.job_opening.title}"
