# ============================================================
# Production Dockerfile — used by Railway (and any PaaS).
# Local Docker dev still uses docker/app/Dockerfile via docker-compose.
# ============================================================

# ---- Stage 1: Frontend build ----
FROM docker.io/library/node:22-alpine AS frontend
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci --ignore-scripts=false
COPY resources/ resources/
COPY vite.config.js tsconfig.json ./
RUN npm run build

# ---- Stage 2: Composer dependencies ----
FROM docker.io/library/composer:2 AS composer
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader --no-scripts
COPY . .
RUN composer dump-autoload --optimize

# ---- Stage 3: Production runtime ----
FROM docker.io/library/php:8.4-cli-alpine

RUN apk add --no-cache \
    bash \
    curl \
    libpq-dev \
    libzip-dev \
    unzip

RUN docker-php-ext-install \
    pdo \
    pdo_pgsql \
    pgsql \
    zip \
    pcntl \
    bcmath

WORKDIR /var/www/html

# Copy app source with Composer deps from stage 2
COPY --from=composer /app /var/www/html

# Copy frontend build artifacts from stage 1
COPY --from=frontend /app/public/build ./public/build

# Set permissions
RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Production entrypoint
COPY docker/app/entrypoint.prod.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
