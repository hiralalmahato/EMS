from rest_framework import serializers
from .models import Notification, Announcement


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'notification_type', 'is_read', 'link', 'created_at']
        read_only_fields = ['id', 'created_at']


class AnnouncementSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = ['id', 'title', 'content', 'author', 'author_name', 'target_roles',
                  'target_departments', 'is_published', 'publish_date', 'expiry_date',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']

    def get_author_name(self, obj):
        return obj.author.get_full_name() if obj.author else None
