from rest_framework import viewsets, permissions
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from apps.accounts.permissions import IsAdminOrHR
from .models import OnboardingTask, OnboardingTemplate, OffboardingRecord
from .serializers import OnboardingTemplateSerializer, OnboardingTaskSerializer, OffboardingRecordSerializer


class OnboardingTemplateViewSet(viewsets.ModelViewSet):
    queryset = OnboardingTemplate.objects.all()
    serializer_class = OnboardingTemplateSerializer
    permission_classes = [IsAdminOrHR]


class OnboardingTaskViewSet(viewsets.ModelViewSet):
    serializer_class = OnboardingTaskSerializer
    permission_classes = [IsAdminOrHR]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['employee', 'status', 'category']

    def get_queryset(self):
        return OnboardingTask.objects.select_related('employee__user', 'assigned_to')

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.status == 'completed' and not instance.completed_at:
            instance.completed_at = timezone.now()
            instance.save(update_fields=['completed_at'])


class OffboardingRecordViewSet(viewsets.ModelViewSet):
    serializer_class = OffboardingRecordSerializer
    permission_classes = [IsAdminOrHR]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['employee', 'reason']

    def get_queryset(self):
        return OffboardingRecord.objects.select_related('employee__user')

    def perform_create(self, serializer):
        serializer.save(processed_by=self.request.user)
