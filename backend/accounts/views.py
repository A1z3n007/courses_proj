"""
API views for user registration and profile management.

This module defines views for creating new users and retrieving/updating
the currently authenticated user's profile. Authentication is handled
via JSON Web Tokens provided by ``rest_framework_simplejwt``.
"""
from rest_framework import generics, permissions
from django.contrib.auth.models import User

from .serializers import RegisterSerializer, UserSerializer
from .models import Profile


class RegisterView(generics.CreateAPIView):
    """API endpoint for user registration."""

    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class ProfileView(generics.RetrieveUpdateAPIView):
    """API endpoint for retrieving and updating the authenticated user's profile."""

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        """Return the current authenticated user, ensuring a Profile exists."""
        user = self.request.user
        # Ensure profile exists
        Profile.objects.get_or_create(user=user)
        return user