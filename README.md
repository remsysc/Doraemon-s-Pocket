# Doraemon's Pocket

Inventory management system for WalangBrownout Appliances — Laravel API + React SPA, PostgreSQL, Sanctum cookie auth.

## Tech Stack

- **Backend:** Laravel 13, PostgreSQL, Laravel Sanctum (SPA cookie auth)
- **Frontend:** React + React Router, Vite, Tailwind CSS — lives in the same repo under `resources/js/`
- **Database:** PostgreSQL (runs in a container)

> Frontend and backend run from the **same repo**. There's no separate frontend project to clone or CORS setup to configure.

---

## Getting Started (Docker)

The recommended way for everyone. No PHP, Composer, or Node required on your machine.

**Prerequisites:** [Docker](https://docs.docker.com/get-docker/) with the Compose plugin.

```bash
# 1. Clone the repo
git clone <repo-url>
cd Doraemon-s-Pocket

# 2. Copy the env file
cp .env.example .env

# 3. Build the images
docker compose build

# 4. Generate an app key
docker compose run --rm app php artisan key:generate

# 5. Start everything
docker compose up

# 6. Seed the database (first time only)
docker compose exec app php artisan db:seed
```

That's it. Visit **`http://localhost:8000`**.

`docker compose up` starts four services:

| Container        | What it does                                                |
| ---------------- | ----------------------------------------------------------- |
| `doraemon_db`    | PostgreSQL database                                         |
| `doraemon_app`   | Laravel on port 8000 — runs migrations and seeds on startup |
| `doraemon_vite`  | Vite dev server on port 5173 — hot module replacement       |
| `doraemon_queue` | Laravel queue worker                                        |

Seeded accounts to log in with:

| Email                 | Password   | Role               |
| --------------------- | ---------- | ------------------ |
| `admin@test.com`      | `password` | Admin              |
| `purchasing@test.com` | `password` | Purchasing Manager |
| `warehouse@test.com`  | `password` | Warehouse Staff    |

### Stopping

```bash
docker compose down        # stop containers, keep database
docker compose down -v     # stop containers and wipe the database
```

### Rebuilding after dependency changes

If someone adds a Composer or npm package, rebuild the images:

```bash
docker compose up --build
```

---

## Getting Started (Local — without Docker)

Only needed if you can't use Docker. Requires PHP 8.4+, Composer, Node 22+, and a local PostgreSQL instance.

```bash
# 1. Install dependencies
composer install
npm install

# 2. Copy env and generate key
cp .env.example .env
# Edit .env: set DB_HOST=127.0.0.1 and fill in your local DB credentials
php artisan key:generate

# 3. Run migrations and seed
php artisan migrate
php artisan db:seed

# 4. Start the dev servers
composer run dev
```

Visit **`http://localhost:8000`**.

---

## Project Structure

```
app/                  ← Backend: models, controllers, middleware
database/             ← Migrations, seeders
routes/api.php        ← JSON API endpoints
routes/web.php        ← Single catch-all route (serves the SPA)

resources/js/         ← Frontend: all React code lives here
  ├─ main.tsx           entry point
  ├─ App.tsx            root component + routes
  ├─ pages/             Login, Register, Dashboard, etc.
  ├─ lib/               API client (axios calls to routes/api.php)
  └─ ...

docker/               ← Dockerfiles and config
  ├─ app/Dockerfile
  └─ app/entrypoint.sh
```

Backend work touches `app/`, `database/`, `routes/api.php`.
Frontend work touches `resources/js/`.
This keeps merge conflicts rare since each team works in separate folders.

---

## API Endpoints

All under `/api`, JSON in/out, session-cookie authenticated via Sanctum after login.

| Method         | Endpoint           | Auth | Description              |
| -------------- | ------------------ | ---- | ------------------------ |
| POST           | `/register`        | —    | Create account           |
| POST           | `/login`           | —    | Login                    |
| POST           | `/logout`          | ✓    | Logout                   |
| GET            | `/user`            | ✓    | Current user             |
| GET/POST       | `/categories`      | ✓    | List / create categories |
| GET/PUT/DELETE | `/categories/{id}` | ✓    | Show / update / delete   |
| GET/POST       | `/products`        | ✓    | List / create products   |
| GET/PUT/DELETE | `/products/{id}`   | ✓    | Show / update / delete   |
| GET/POST       | `/lots`            | ✓    | List / create lots       |
| GET/PUT/DELETE | `/lots/{id}`       | ✓    | Show / update / delete   |

---

## Useful Commands

```bash
# Run a one-off artisan command inside the container
docker compose exec app php artisan <command>

# Re-run migrations fresh (wipes data)
docker compose exec app php artisan migrate:fresh --seed

# View Laravel logs
docker compose logs app

# Open a shell inside the app container
docker compose exec app bash
```

### Production demo data (opt-in)

The `demo/seeded-data` branch contains repeatable demo seeders for the three demo accounts, 4 categories, 8 products, 16 lots, and 24 inventory transactions. Production startup does **not** seed by default. To populate a demo deployment, set `SEED_DEMO_DATA=true` in the deployment environment and deploy this branch once, then remove or unset the variable and redeploy. The seeders use upserts/fixed transaction IDs and are repeatable, but they still modify the production database; verify the target database before enabling the flag.

Demo credentials are listed above. Change or remove these accounts before using the deployment for real production data.
