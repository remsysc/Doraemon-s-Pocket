#!/bin/bash

set -e

echo "Waiting for database..."
until php -r "new PDO('pgsql:host=${DB_HOST};port=${DB_PORT};dbname=${DB_DATABASE}', '${DB_USERNAME}', '${DB_PASSWORD}');" 2>/dev/null; do
    sleep 1
done
echo "Database is ready."

echo "Running migrations..."
php artisan migrate --force
if ! php artisan tinker --execute="exit(App\Models\User::exists() ? 1 : 0)"; then
    echo "Seeding database..."
    php artisan db:seed --force
fi
echo "Clearing caches..."
php artisan config:clear
php artisan route:clear

echo "Starting Laravel development server..."
exec php artisan serve --host=0.0.0.0 --port=8000
