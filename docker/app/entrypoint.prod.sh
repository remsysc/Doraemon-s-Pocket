#!/bin/sh
set -e

# If a command was supplied (e.g. artisan), run it directly.
if [ "$#" -gt 0 ]; then
    exec "$@"
fi

echo "Waiting for database at ${DB_HOST}:${DB_PORT:-5432}..."
until php -r "new PDO('pgsql:host='.getenv('DB_HOST').';port='.(getenv('DB_PORT')?:'5432').';dbname='.getenv('DB_DATABASE'), getenv('DB_USERNAME'), getenv('DB_PASSWORD'));" 2>/dev/null; do
    sleep 1
done
echo "Database is ready."

# Run migrations (safe for production — --force skips the confirmation prompt)
php artisan migrate --force

# Only seed in non-production environments (for staging/preview deploys)
if [ "${APP_ENV}" != "production" ]; then
    echo "Non-production environment detected — running seeders..."
    php artisan db:seed --force
fi

# Cache config, routes, and views for performance
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

echo "Starting Laravel server on port ${PORT:-8000}..."
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
