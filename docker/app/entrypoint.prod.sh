#!/bin/sh
set -e

# If a command was supplied (e.g. artisan), run it directly.
if [ "$#" -gt 0 ]; then
    exec "$@"
fi

echo "==> DB_HOST=${DB_HOST} DB_PORT=${DB_PORT:-5432} DB_DATABASE=${DB_DATABASE}"
echo "==> PORT=${PORT:-8000}"

# Wait for database with a timeout (max 30 seconds)
echo "Waiting for database (max 30s)..."
TRIES=0
MAX_TRIES=30
until php -r "new PDO('pgsql:host='.getenv('DB_HOST').';port='.(getenv('DB_PORT')?:'5432').';dbname='.getenv('DB_DATABASE'), getenv('DB_USERNAME'), getenv('DB_PASSWORD'));" 2>/dev/null; do
    TRIES=$((TRIES + 1))
    if [ "$TRIES" -ge "$MAX_TRIES" ]; then
        echo "ERROR: Could not connect to database after ${MAX_TRIES}s. Starting server anyway..."
        break
    fi
    sleep 1
done

if [ "$TRIES" -lt "$MAX_TRIES" ]; then
    echo "Database is ready."

    # Run migrations
    php artisan migrate --force || echo "WARNING: migrate failed"

    # Production seeding is opt-in for demo environments. Keep the flag unset
    # for normal production deployments, and remove it after the demo seed runs.
    if [ "${APP_ENV}" != "production" ] || [ "${SEED_DEMO_DATA:-false}" = "true" ]; then
        echo "Running seeders..."
        php artisan db:seed --force || echo "WARNING: seed failed"
    fi
fi

# Cache config, routes, and views for performance
php artisan config:cache || echo "WARNING: config:cache failed"
php artisan route:cache || echo "WARNING: route:cache failed"
php artisan view:cache || echo "WARNING: view:cache failed"
php artisan event:cache || echo "WARNING: event:cache failed"

echo "Starting Laravel server on port ${PORT:-8000}..."
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
