"""
Serializers for the accounts app.

These serializers define how user data is converted between JSON and
native Python data structures. They support user registration,
retrieval, and update operations.
"""
from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Profile


class UserSerializer(serializers.ModelSerializer):
    """Serializer for retrieving and updating user profiles.

    This serializer exposes a nested profile serializer to allow updating
    extended profile fields in a single request.
    """

    # Nested profile serializer
    class ProfileSerializer(serializers.ModelSerializer):
        class Meta:
            model = Profile
            fields = ['department', 'mentor_name', 'date_joined_company', 'city', 'avatar']

    profile = ProfileSerializer(required=False)
    is_staff = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'is_staff', 'profile']
        read_only_fields = ['id', 'username', 'is_staff']

    def update(self, instance: User, validated_data):
        profile_data = validated_data.pop('profile', None)
        # Update base user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        # Update or create profile
        if profile_data is not None:
            profile, _ = Profile.objects.get_or_create(user=instance)
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
        return instance


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration.

    Accepts username, email and password. Handles password hashing via
    Django's built in user management.
    """
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
        )
        return user