from rest_framework import serializers
from .models import Task, TaskComment


class TaskCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = TaskComment
        fields = ['id', 'task', 'author', 'author_name', 'content', 'created_at']
        read_only_fields = ['id', 'author', 'created_at']

    def get_author_name(self, obj):
        return obj.author.get_full_name() if obj.author else None


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source='assigned_to.user.get_full_name', read_only=True)
    assigned_by_name = serializers.SerializerMethodField()
    comments_count = serializers.IntegerField(read_only=True)
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'assigned_to', 'assigned_to_name',
                  'assigned_by', 'assigned_by_name', 'priority', 'status',
                  'due_date', 'completed_at', 'comments_count', 'is_overdue',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'assigned_by', 'completed_at', 'created_at', 'updated_at']

    def get_assigned_by_name(self, obj):
        return obj.assigned_by.get_full_name() if obj.assigned_by else None

    def get_is_overdue(self, obj):
        if obj.due_date and obj.status != 'completed':
            from django.utils import timezone
            return obj.due_date < timezone.now().date()
        return False
