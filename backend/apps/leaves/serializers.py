from rest_framework import serializers
from .models import LeaveType, LeaveBalance, LeaveRequest


class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = ['id', 'name', 'code', 'days_per_year', 'is_paid', 'is_active',
                  'carry_forward', 'max_carry_forward_days', 'description']


class LeaveBalanceSerializer(serializers.ModelSerializer):
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    leave_type_code = serializers.CharField(source='leave_type.code', read_only=True)
    remaining_days = serializers.FloatField(read_only=True)

    class Meta:
        model = LeaveBalance
        fields = ['id', 'employee', 'leave_type', 'leave_type_name', 'leave_type_code',
                  'year', 'total_days', 'used_days', 'carried_forward', 'remaining_days']
        read_only_fields = ['id']


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    employee_id_display = serializers.CharField(source='employee.employee_id', read_only=True)
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    reviewed_by_name = serializers.SerializerMethodField()
    department_name = serializers.CharField(source='employee.department.name', read_only=True, default=None)

    class Meta:
        model = LeaveRequest
        fields = [
            'id', 'employee', 'employee_name', 'employee_id_display',
            'department_name',
            'leave_type', 'leave_type_name',
            'start_date', 'end_date', 'total_days', 'reason',
            'status', 'reviewed_by', 'reviewed_by_name', 'review_date',
            'rejection_reason', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'status', 'reviewed_by', 'review_date', 'rejection_reason', 'created_at', 'updated_at']

    def get_reviewed_by_name(self, obj):
        if obj.reviewed_by:
            return obj.reviewed_by.get_full_name()
        return None


class LeaveRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveRequest
        fields = ['id', 'leave_type', 'start_date', 'end_date', 'total_days', 'reason']
        read_only_fields = ['id']

    def validate(self, data):
        if data['start_date'] > data['end_date']:
            raise serializers.ValidationError({'end_date': 'End date must be after start date.'})

        employee = self.context['employee']

        # Check for overlapping requests
        overlapping = LeaveRequest.objects.filter(
            employee=employee,
            status__in=['pending', 'approved'],
            start_date__lte=data['end_date'],
            end_date__gte=data['start_date'],
        )
        if overlapping.exists():
            raise serializers.ValidationError('You have an overlapping leave request for this period.')

        return data
