from rest_framework import serializers
from .models import OnboardingTask, OnboardingTemplate, OffboardingRecord


class OnboardingTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OnboardingTemplate
        fields = ['id', 'name', 'description', 'department', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class OnboardingTaskSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = OnboardingTask
        fields = ['id', 'employee', 'employee_name', 'title', 'description',
                  'category', 'assigned_to', 'assigned_to_name', 'status',
                  'due_date', 'completed_at', 'created_at']
        read_only_fields = ['id', 'completed_at', 'created_at']

    def get_assigned_to_name(self, obj):
        return obj.assigned_to.get_full_name() if obj.assigned_to else None


class OffboardingRecordSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)

    class Meta:
        model = OffboardingRecord
        fields = ['id', 'employee', 'employee_name', 'reason', 'last_working_date',
                  'exit_interview_notes', 'equipment_returned', 'access_revoked',
                  'final_settlement_done', 'notes', 'processed_by', 'created_at', 'updated_at']
        read_only_fields = ['id', 'processed_by', 'created_at', 'updated_at']
