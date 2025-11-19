"""
WSGI config for integration_platform project.

It exposes the WSGI callable as a module-level variable named ``application``.
"""
import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'integration_platform.settings')

application = get_wsgi_application()