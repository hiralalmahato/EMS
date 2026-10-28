from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Employee, EmployeeDocument

User = get_user_model()


class EmployeeListSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True, default=None)
    designation_title = serializers.CharField(source='designation.title', read_only=True, default=None)
    avatar = serializers.ImageField(source='user.avatar', read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'full_name', 'email', 'phone',
            'department', 'department_name', 'designation', 'designation_title',
            'employment_type', 'status', 'joining_date', 'profile_photo', 'avatar',
        ]


class EmployeeDetailSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True, default=None)
    designation_title = serializers.CharField(source='designation.title', read_only=True, default=None)
    manager_name = serializers.SerializerMethodField()
    avatar = serializers.ImageField(source='user.avatar', read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'full_name', 'first_name', 'last_name', 'email',
            'profile_photo', 'avatar',
            'phone', 'personal_email', 'date_of_birth', 'gender', 'marital_status', 'nationality',
            'address_line1', 'address_line2', 'city', 'state', 'country', 'zip_code',
            'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation',
            'department', 'department_name', 'designation', 'designation_title',
            'reporting_manager', 'manager_name',
            'employment_type', 'joining_date', 'probation_end_date', 'confirmation_date', 'status',
            'skills', 'qualifications', 'notes',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_manager_name(self, obj):
        if obj.reporting_manager:
            return obj.reporting_manager.user.get_full_name()
        return None


class EmployeeCreateSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Employee
        fields = [
            'employee_id', 'first_name', 'last_name', 'email', 'password',
            'phone', 'personal_email', 'date_of_birth', 'gender', 'marital_status', 'nationality',
            'address_line1', 'address_line2', 'city', 'state', 'country', 'zip_code',
            'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation',
            'department', 'designation', 'reporting_manager',
            'employment_type', 'joining_date', 'probation_end_date', 'status',
            'basic_salary', 'skills', 'qualifications', 'notes',
            'profile_photo',
        ]

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def validate_employee_id(self, value):
        if Employee.objects.filter(employee_id=value).exists():
            raise serializers.ValidationError('This employee ID is already in use.')
        return value

    def create(self, validated_data):
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        email = validated_data.pop('email')
        password = validated_data.pop('password', None)

        # Create username from email
        username = email.split('@')[0]
        counter = 1
        base_username = username
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        user = User.objects.create_user(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            password=password or 'TempPass123!',
            role='employee',
        )

        employee = Employee.objects.create(user=user, **validated_data)
        return employee


class EmployeeUpdateSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)

    class Meta:
        model = Employee
        fields = [
            'first_name', 'last_name', 'email',
            'phone', 'personal_email', 'date_of_birth', 'gender', 'marital_status', 'nationality',
            'address_line1', 'address_line2', 'city', 'state', 'country', 'zip_code',
            'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation',
            'department', 'designation', 'reporting_manager',
            'employment_type', 'joining_date', 'probation_end_date', 'confirmation_date', 'status',
            'basic_salary', 'skills', 'qualifications', 'notes',
            'profile_photo',
        ]

    def validate_email(self, value):
        instance = self.instance
        if instance and User.objects.filter(email=value).exclude(pk=instance.user.pk).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def update(self, instance, validated_data):
        user_fields = {}
        for field in ['first_name', 'last_name', 'email']:
            if field in validated_data:
                user_fields[field] = validated_data.pop(field)

        if user_fields:
            for attr, value in user_fields.items():
                setattr(instance.user, attr, value)
            instance.user.save()

        return super().update(instance, validated_data)


class EmployeeDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeDocument
        fields = ['id', 'employee', 'document_type', 'title', 'file', 'uploaded_at', 'uploaded_by']
        read_only_fields = ['id', 'uploaded_at', 'uploaded_by']


class EmployeeSelfSerializer(serializers.ModelSerializer):
    """Serializer for employees viewing/editing their own limited profile."""
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True, default=None)
    designation_title = serializers.CharField(source='designation.title', read_only=True, default=None)

    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'full_name', 'email',
            'phone', 'personal_email', 'date_of_birth', 'gender',
            'address_line1', 'address_line2', 'city', 'state', 'country', 'zip_code',
            'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation',
            'department', 'department_name', 'designation', 'designation_title',
            'employment_type', 'joining_date', 'status',
            'skills', 'profile_photo',
        ]
        read_only_fields = [
            'id', 'employee_id', 'department', 'designation',
            'employment_type', 'joining_date', 'status',
        ]
