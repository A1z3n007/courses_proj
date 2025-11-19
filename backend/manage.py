#!/usr/bin/env python
"""
Django's command-line utility for administrative tasks.
This file is a simplified version of the default manage.py generated
by the Django framework. It sets up the environment so the project can
be executed via command line. You can use this script to run
migrations, start the development server, create superusers, etc.
"""
import os
import sys


def main() -> None:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'integration_platform.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()