"""
URL configuration for integration_platform project.

This module configures the URL routes for the project, including the admin
interface, authentication endpoints, and API routes for accounts and courses.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)


urlpatterns = [
    path('admin/', admin.site.urls),
    # JWT authentication endpoints
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Include application routes
    path('api/accounts/', include('accounts.urls')), 
    path('api/courses/', include('courses.urls')),
]