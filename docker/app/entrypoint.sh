#!/bin/sh
set -e

# If a command was supplied, run it instead of the normal startup.
if [ "$#" -gt 0 ]; then
    exec "$@"
fi

echo "Waiting for database at ${DB_HOST}:${DB_PORT}..."
until php -r "new PDO('pgsql:host=${DB_HOST};port=${DB_PORT};dbname=${DB_DATABASE}', '${DB_USERNAME}', '${DB_PASSWORD}');" 2>/dev/null; do
    sleep 1
done

echo "Database is ready."

php artisan migrate --force
php artisan db:seed --force

php artisan config:clear
php artisan route:clear

echo "Starting Laravel development server..."
exec php artisan serve --host=0.0.0.0 --port=8000
