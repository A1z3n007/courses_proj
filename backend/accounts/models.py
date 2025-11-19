"""
Models for the accounts app.

This module defines additional models for user profiles. Each user has a
one-to-one related ``Profile`` object containing supplemental information
such as department, mentor, date of joining, city and avatar choice.
"""
from django.db import models
from django.contrib.auth.models import User


class Profile(models.Model):
    """Extends the built-in User model with additional information."""

    AVATAR_CHOICES = [
        ('robot', 'Robot'),
        ('astronaut', 'Astronaut'),
        ('worker', 'Worker'),
        ('manager', 'Manager'),
        ('seller', 'Seller'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    department = models.CharField(max_length=255, blank=True)
    mentor_name = models.CharField(max_length=255, blank=True)
    date_joined_company = models.DateField(null=True, blank=True)
    city = models.CharField(max_length=255, blank=True)
    avatar = models.CharField(max_length=50, choices=AVATAR_CHOICES, blank=True)

    def __str__(self) -> str:
        return f"Profile of {self.user.username}"