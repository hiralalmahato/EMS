from rest_framework import serializers
from .models import Department, Designation


class DesignationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Designation
        fields = ['id', 'title', 'department', 'level', 'description', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class DepartmentListSerializer(serializers.ModelSerializer):
    employee_count = serializers.IntegerField(read_only=True)
    head_name = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ['id', 'name', 'description', 'head', 'head_name', 'is_active', 'employee_count', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_head_name(self, obj):
        if obj.head:
            return obj.head.user.get_full_name()
        return None


class DepartmentDetailSerializer(serializers.ModelSerializer):
    employee_count = serializers.IntegerField(read_only=True)
    head_name = serializers.SerializerMethodField()
    designations = DesignationSerializer(many=True, read_only=True)

    class Meta:
        model = Department
        fields = ['id', 'name', 'description', 'head', 'head_name', 'is_active',
                  'employee_count', 'designations', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_head_name(self, obj):
        if obj.head:
            return obj.head.user.get_full_name()
        return None
