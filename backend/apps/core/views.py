from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.accounts.permissions import IsAdmin
from .models import CompanySettings, Holiday, WorkSchedule
from .serializers import CompanySettingsSerializer, HolidaySerializer, WorkScheduleSerializer


class CompanySettingsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        settings_obj = CompanySettings.objects.first()
        if not settings_obj:
            settings_obj = CompanySettings.objects.create()
        serializer = CompanySettingsSerializer(settings_obj)
        return Response(serializer.data)

    def patch(self, request):
        if request.user.role != 'admin':
            return Response({'detail': 'Only admins can update settings.'}, status=403)
        settings_obj = CompanySettings.objects.first()
        if not settings_obj:
            settings_obj = CompanySettings.objects.create()
        serializer = CompanySettingsSerializer(settings_obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class HolidayViewSet(viewsets.ModelViewSet):
    queryset = Holiday.objects.all()
    serializer_class = HolidaySerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]


class WorkScheduleViewSet(viewsets.ModelViewSet):
    queryset = WorkSchedule.objects.all()
    serializer_class = WorkScheduleSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]
