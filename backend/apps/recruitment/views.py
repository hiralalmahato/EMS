from rest_framework import viewsets, filters
from django.db.models import Count
from django_filters.rest_framework import DjangoFilterBackend
from apps.accounts.permissions import IsAdminOrHR
from .models import JobOpening, Candidate
from .serializers import JobOpeningSerializer, CandidateSerializer


class JobOpeningViewSet(viewsets.ModelViewSet):
    serializer_class = JobOpeningSerializer
    permission_classes = [IsAdminOrHR]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'department', 'employment_type']
    search_fields = ['title', 'description']
    ordering = ['-created_at']

    def get_queryset(self):
        return JobOpening.objects.select_related('department').annotate(
            candidate_count=Count('candidates')
        )

    def perform_create(self, serializer):
        serializer.save(posted_by=self.request.user)


class CandidateViewSet(viewsets.ModelViewSet):
    serializer_class = CandidateSerializer
    permission_classes = [IsAdminOrHR]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['job_opening', 'stage']
    search_fields = ['name', 'email']
    ordering = ['-created_at']

    def get_queryset(self):
        return Candidate.objects.select_related('job_opening')
