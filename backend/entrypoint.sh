#!/bin/sh
set -e

echo "Waiting for postgres..."
while ! nc -z db 5432; do
  sleep 1
done
echo "Postgres is up."

# Migraciones
python manage.py migrate --noinput

# Static
python manage.py collectstatic --noinput || true

exec "$@"
