from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'openings', views.JobOpeningViewSet, basename='job-opening')
router.register(r'candidates', views.CandidateViewSet, basename='candidate')

urlpatterns = [path('', include(router.urls))]
