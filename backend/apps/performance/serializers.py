from rest_framework import serializers
from .models import PerformanceGoal, PerformanceReview


class PerformanceGoalSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    employee_id_display = serializers.CharField(source='employee.employee_id', read_only=True)

    class Meta:
        model = PerformanceGoal
        fields = ['id', 'employee', 'employee_name', 'employee_id_display',
                  'title', 'description', 'target', 'start_date', 'end_date',
                  'status', 'progress', 'created_by', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']


class PerformanceReviewSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    reviewer_name = serializers.SerializerMethodField()

    class Meta:
        model = PerformanceReview
        fields = ['id', 'employee', 'employee_name', 'reviewer', 'reviewer_name',
                  'period_start', 'period_end', 'rating', 'self_assessment',
                  'manager_feedback', 'strengths', 'improvements',
                  'is_finalized', 'created_at', 'updated_at']
        read_only_fields = ['id', 'reviewer', 'created_at', 'updated_at']

    def get_reviewer_name(self, obj):
        return obj.reviewer.get_full_name() if obj.reviewer else None
