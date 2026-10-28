from rest_framework import serializers
from .models import PayrollRecord, SalaryRevision


class PayrollRecordSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    employee_id_display = serializers.CharField(source='employee.employee_id', read_only=True)
    department_name = serializers.CharField(source='employee.department.name', read_only=True, default=None)
    period_display = serializers.SerializerMethodField()

    class Meta:
        model = PayrollRecord
        fields = [
            'id', 'employee', 'employee_name', 'employee_id_display',
            'department_name',
            'period_month', 'period_year', 'period_display',
            'basic_salary', 'allowances', 'bonuses', 'deductions',
            'gross_salary', 'net_salary', 'breakdown',
            'status', 'payment_date', 'notes',
            'processed_by', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'gross_salary', 'net_salary', 'processed_by', 'created_at', 'updated_at']

    def get_period_display(self, obj):
        import calendar
        return f"{calendar.month_abbr[obj.period_month]} {obj.period_year}"


class PayrollCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayrollRecord
        fields = ['employee', 'period_month', 'period_year', 'basic_salary',
                  'allowances', 'bonuses', 'deductions', 'notes']

    def validate(self, data):
        if PayrollRecord.objects.filter(
            employee=data['employee'],
            period_month=data['period_month'],
            period_year=data['period_year']
        ).exists():
            raise serializers.ValidationError(
                'A payroll record already exists for this employee and period.'
            )
        return data

    def create(self, validated_data):
        record = PayrollRecord(**validated_data)
        record.calculate()
        record.save()
        return record


class SalaryRevisionSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    approved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = SalaryRevision
        fields = ['id', 'employee', 'employee_name', 'previous_salary', 'new_salary',
                  'effective_date', 'reason', 'approved_by', 'approved_by_name', 'created_at']
        read_only_fields = ['id', 'approved_by', 'created_at']

    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return obj.approved_by.get_full_name()
        return None
