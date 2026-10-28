from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/employees/', include('apps.employees.urls')),
    path('api/', include('apps.departments.urls')),
    path('api/attendance/', include('apps.attendance.urls')),
    path('api/leaves/', include('apps.leaves.urls')),
    path('api/payroll/', include('apps.payroll.urls')),
    path('api/performance/', include('apps.performance.urls')),
    path('api/recruitment/', include('apps.recruitment.urls')),
    path('api/onboarding/', include('apps.onboarding.urls')),
    path('api/tasks/', include('apps.tasks.urls')),
    path('api/', include('apps.notifications.urls')),
    path('api/reports/', include('apps.reports.urls')),
    path('api/core/', include('apps.core.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
