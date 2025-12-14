#!/bin/bash
set -e

# Set Python environment
export PYTHONPATH=/home/conduit/.local/lib/python3.9/site-packages:$PYTHONPATH
export PATH=/home/conduit/.local/bin:$PATH

# Wait for database if needed (for future PostgreSQL support)
# while ! nc -z db 5432; do
#   echo "Waiting for database..."
#   sleep 1
# done

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput || true

echo "Starting server with gunicorn..."
exec "$@"
