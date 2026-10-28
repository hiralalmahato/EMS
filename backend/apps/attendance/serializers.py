from rest_framework import serializers
from .models import AttendanceRecord


class AttendanceRecordSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    employee_id_display = serializers.CharField(source='employee.employee_id', read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'employee', 'employee_name', 'employee_id_display',
            'date', 'check_in', 'check_out', 'status', 'working_hours',
            'overtime_hours', 'notes', 'is_manual_entry',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'working_hours', 'created_at', 'updated_at']


class CheckInSerializer(serializers.Serializer):
    notes = serializers.CharField(required=False, allow_blank=True)


class CheckOutSerializer(serializers.Serializer):
    notes = serializers.CharField(required=False, allow_blank=True)
