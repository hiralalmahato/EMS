from rest_framework import serializers
from .models import JobOpening, Candidate


class JobOpeningSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True, default=None)
    candidate_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = JobOpening
        fields = ['id', 'title', 'department', 'department_name', 'description',
                  'requirements', 'location', 'employment_type', 'positions',
                  'status', 'posted_by', 'opening_date', 'closing_date',
                  'candidate_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'posted_by', 'opening_date', 'created_at', 'updated_at']


class CandidateSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source='job_opening.title', read_only=True)

    class Meta:
        model = Candidate
        fields = ['id', 'job_opening', 'job_title', 'name', 'email', 'phone',
                  'resume', 'stage', 'interview_date', 'interviewer_notes',
                  'rating', 'application_date', 'created_at', 'updated_at']
        read_only_fields = ['id', 'application_date', 'created_at', 'updated_at']
