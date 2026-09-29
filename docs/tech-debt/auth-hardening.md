# Auth Hardening — Tech Debt for Real Deployment

> Status: Academic demo complete. The items below must be addressed before any production rollout.
> Owner: Backend Lead | Reviewed: Sprint 6

---

## Risk Register

| # | Risk | Severity | Recommended Fix | Effort |
|---|------|----------|-----------------|--------|
| 1 | **Open self-registration with role selection** — `POST /api/register` accepts any role, including `admin`, from any unauthenticated caller. A malicious actor can create an admin account without any approval step. | 🔴 Critical | Remove `role` from the self-registration request. Instead, seed the initial admin account (or provide an admin-only invite endpoint) and require an existing admin to assign roles via the User Management screen. As a quick interim fix, at minimum change the default role to `warehouse_staff` and reject `admin` from self-registration. | Medium |
| 2 | **Sanctum stateful domains not locked to production** — `SANCTUM_STATEFUL_DOMAINS` and `SESSION_DOMAIN` default to `localhost` in the shipped `.env.example`. If these are not overridden, Sanctum will accept session cookies from the wrong origin in production. | 🟠 High | Set `SANCTUM_STATEFUL_DOMAINS=yourdomain.com` and `SESSION_DOMAIN=.yourdomain.com` in the production `.env`. Never commit production values; inject them via CI/CD secrets or a secrets manager. | Low |
| 3 | **Debug mode and development environment in production** — Running with `APP_DEBUG=true` or `APP_ENV=local` in production exposes full stack traces and internal configuration to API error responses. | 🟠 High | Set `APP_DEBUG=false` and `APP_ENV=production` in the production `.env`. Confirm with `php artisan config:show app.debug` before go-live. | Low |
| 4 | **Session cookies not enforced as HTTPS-only** — Without `SESSION_SECURE_COOKIE=true`, the session cookie can be transmitted over plain HTTP, enabling session hijacking on any non-TLS request. | 🟠 High | Set `SESSION_SECURE_COOKIE=true` in the production `.env`. Ensure the load balancer or reverse proxy terminates TLS and forwards `X-Forwarded-Proto` (configure `TrustProxies` middleware accordingly). | Low |
| 5 | **No rate limiting on the login endpoint** — `POST /api/login` has no throttle, allowing unlimited brute-force password attempts. Laravel's default route throttle middleware is not applied to this route. | 🟡 Medium | Add `->middleware('throttle:10,1')` to the login route in `routes/api.php` (10 attempts per minute per IP). For production, consider a per-email lockout using Laravel's built-in `RateLimiter` with a composite key `email\|ip`. | Low |
| 6 | **No password reset or email verification flow** — Users cannot recover a forgotten password, and email addresses are accepted without any verification step. Compromised or invalid accounts cannot be detected via email bounces. | 🟡 Medium | Implement Laravel's built-in password reset (`ForgotPassword` / `ResetPassword` controllers from the Auth scaffold) and email verification (`MustVerifyEmail` contract + `verified` middleware on protected routes). Requires a production mailer (SMTP, SES, Mailgun, etc.) configured in `.env`. | High |

---

## Deployment Checklist

Before going live, verify:

- [ ] `POST /api/register` no longer accepts `admin` role from unauthenticated callers.
- [ ] `SANCTUM_STATEFUL_DOMAINS` matches the production domain exactly.
- [ ] `SESSION_DOMAIN` is set to `.yourdomain.com` (note the leading dot for subdomain coverage).
- [ ] `APP_DEBUG=false` confirmed via `php artisan config:show app.debug`.
- [ ] `APP_ENV=production` confirmed via `php artisan config:show app.env`.
- [ ] `SESSION_SECURE_COOKIE=true` and TLS is enforced end-to-end.
- [ ] Login route throttled (10 req/min minimum).
- [ ] Password reset flow implemented and mailer configured.
- [ ] `php artisan config:cache` and `php artisan route:cache` run after `.env` changes.

---

> For the full deployment procedure (Docker, Railway → AWS EC2 migration), see `docs/ai/todo.md`.
