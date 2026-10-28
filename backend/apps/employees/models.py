from django.db import models
from django.conf import settings


class Employee(models.Model):
    class EmploymentType(models.TextChoices):
        FULL_TIME = 'full_time', 'Full Time'
        PART_TIME = 'part_time', 'Part Time'
        CONTRACT = 'contract', 'Contract'
        INTERN = 'intern', 'Intern'

    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        ON_LEAVE = 'on_leave', 'On Leave'
        INACTIVE = 'inactive', 'Inactive'

    # Link to user account
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='employee'
    )

    # Identification
    employee_id = models.CharField(max_length=20, unique=True, db_index=True)
    profile_photo = models.ImageField(upload_to='employees/photos/', blank=True, null=True)

    # Personal information
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(
        max_length=20,
        choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other'), ('prefer_not_to_say', 'Prefer not to say')],
        blank=True
    )
    marital_status = models.CharField(
        max_length=20,
        choices=[('single', 'Single'), ('married', 'Married'), ('divorced', 'Divorced'), ('widowed', 'Widowed')],
        blank=True
    )
    nationality = models.CharField(max_length=100, blank=True)

    # Contact
    phone = models.CharField(max_length=20, blank=True)
    personal_email = models.EmailField(blank=True)
    address_line1 = models.CharField(max_length=200, blank=True)
    address_line2 = models.CharField(max_length=200, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    zip_code = models.CharField(max_length=20, blank=True)

    # Emergency contact
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    emergency_contact_relation = models.CharField(max_length=50, blank=True)

    # Employment
    department = models.ForeignKey(
        'departments.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='employees'
    )
    designation = models.ForeignKey(
        'departments.Designation',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='employees'
    )
    reporting_manager = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='direct_reports'
    )
    employment_type = models.CharField(
        max_length=20,
        choices=EmploymentType.choices,
        default=EmploymentType.FULL_TIME
    )
    joining_date = models.DateField()
    probation_end_date = models.DateField(null=True, blank=True)
    confirmation_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE
    )

    # Salary (base info — detailed in payroll)
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Skills and qualifications
    skills = models.JSONField(default=list, blank=True)
    qualifications = models.JSONField(default=list, blank=True)

    # Work schedule
    work_schedule = models.ForeignKey(
        'core.WorkSchedule',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='employees'
    )

    # Meta
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'employees'
        ordering = ['employee_id']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['department']),
            models.Index(fields=['employment_type']),
            models.Index(fields=['joining_date']),
        ]

    def __str__(self):
        return f"{self.employee_id} - {self.user.get_full_name()}"

    @property
    def full_name(self):
        return self.user.get_full_name()

    @property
    def email(self):
        return self.user.email


class EmployeeDocument(models.Model):
    class DocType(models.TextChoices):
        RESUME = 'resume', 'Resume'
        ID_PROOF = 'id_proof', 'ID Proof'
        ADDRESS_PROOF = 'address_proof', 'Address Proof'
        EDUCATION = 'education', 'Education Certificate'
        EXPERIENCE = 'experience', 'Experience Letter'
        OFFER_LETTER = 'offer_letter', 'Offer Letter'
        CONTRACT = 'contract', 'Contract'
        OTHER = 'other', 'Other'

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='documents'
    )
    document_type = models.CharField(max_length=30, choices=DocType.choices)
    title = models.CharField(max_length=200)
    file = models.FileField(upload_to='employees/documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )

    class Meta:
        db_table = 'employee_documents'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.employee.employee_id} - {self.title}"
