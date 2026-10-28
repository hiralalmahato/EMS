from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from apps.accounts.permissions import IsAdminOrHR
from .models import Notification, Announcement
from .serializers import NotificationSerializer, AnnouncementSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    http_method_names = ['get', 'patch', 'delete']

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'count': count})

    @action(detail=True, methods=['patch'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response(NotificationSerializer(notification).data)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'detail': 'All notifications marked as read.'})


class AnnouncementViewSet(viewsets.ModelViewSet):
    serializer_class = AnnouncementSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content']
    ordering = ['-publish_date']

    def get_queryset(self):
        user = self.request.user
        qs = Announcement.objects.select_related('author')

        if user.role in ('admin', 'hr_manager'):
            return qs

        today = timezone.now().date()
        qs = qs.filter(is_published=True)
        qs = qs.filter(Q(expiry_date__isnull=True) | Q(expiry_date__gte=today))

        # Filter by target_roles in Python to avoid DB-backend-specific JSON lookups
        announcements = list(qs)
        filtered_ids = [
            a.id for a in announcements
            if not a.target_roles or user.role in a.target_roles
        ]
        return qs.filter(id__in=filtered_ids)

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdminOrHR()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
