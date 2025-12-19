#!/bin/bash
set -e

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput || true

echo "Starting server with gunicorn..."
exec gunicorn --bind 0.0.0.0:8000 --workers 3 --timeout 120 --access-logfile - --error-logfile - conduit.wsgi:application
