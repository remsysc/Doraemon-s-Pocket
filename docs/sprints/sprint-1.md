# Sprint 1 — Foundation & Auth

> Status: 🟡 DONE WITH FOLLOW-UPS | Owner: Rem (Backend) + Lyll & Larce (Frontend)

Sprint 1's foundation work is substantially present, with documentation follow-ups
remaining for future decisions. The completed work below is based on the
implementation currently in the repository, not on the earlier checklist claims.

| Item                                                    | Owner        | Status                                                   |
| ------------------------------------------------------- | ------------ | -------------------------------------------------------- |
| Repo setup, CI, project skeleton                        | Rem          | ✅ DONE                                                  |
| USER table (id, email, password_hash, role)             | Rem          | ✅ DONE                                                  |
| Register/login endpoints, session auth                  | Rem          | ✅ DONE — register/login/logout/user routes and registration tests |
| Role-based route-guarding middleware                    | Rem          | ✅ DONE — admin bypass plus role checks and tests        |
| Purchasing Manager / Warehouse Staff / Admin personas   | Cindy & Vane | ✅ DONE (submitted 2026-08-04)                           |
| User can/can't-do, UI expectations                      | Cindy & Vane | ✅ DONE (submitted 2026-08-04)                           |
| Wireframes                                              | Lyll & Larce | ✅ DONE                                                  |
| Frontend: login/register pages, protected-route wrapper | Lyll & Larce | ✅ DONE — wrapper checks current user before `/dashboard` |
| Initial DB seeders (users, roles, sample products)      | Rem          | ✅ DONE — 3 users, 4 categories, 8 products, 16 lots |
| List all endpoints (API contract doc)                   | Rem          | ✅ DONE — registration route now matches implementation |
| Test: can't hit inventory endpoint unauthenticated      | —            | ✅ DONE — transaction list test added 2026-08-07         |

---

## Verified implementation status

- `POST /api/login`, `POST /api/logout`, and `GET /api/user` are routed inside
  the Sanctum-authenticated API setup. The login action regenerates the session,
  and logout invalidates the session and CSRF token.
- `RegisteredUserController` validates and creates users, and
  `POST /api/register` is routed publicly from `routes/api.php`. The endpoint
  returns 201 with a token/user payload and is covered by
  `tests/Feature/AuthRegistrationTest.php` (3 tests, 17 assertions).
- `RoleMiddleware` returns 401 for guests, 403 for non-matching roles, and
  unconditionally allows admins. These behaviors are covered by
  `tests/Feature/RoleMiddlewareTest.php`.
- Login and registration pages, form validation, error handling, and the API
  client are present. `ProtectedRoute` calls `getCurrentUser()` before
  rendering `/dashboard` and redirects unauthenticated users to `/login`.
- `DatabaseSeeder` creates the three demo users and calls `CatalogSeeder`,
  which deterministically creates 4 categories, 8 products, and 16 lots.
  `tests/Feature/CatalogSeederTest.php` verifies the counts, representative
  records, and repeatability.
- `tests/Feature/InventoryTransactionTest.php::test_guest_cannot_list_transactions`
  verifies that an unauthenticated request to
  `GET /api/inventory-transactions` returns 401. This resolves the Sprint 1
  carry-over test, although the endpoint itself was implemented in Sprint 2.

## Open questions and current answers

| Question | Current answer | Decision status |
| --- | --- | --- |
| Is the role/persona model settled? | Yes. The three roles and their can/can't-do expectations were submitted by the perms team on 2026-08-04. | ✅ Resolved |
| Should Admin be a separate escalation tier? | No. The implementation treats Admin as a backend superuser; the frontend's default screen is only a navigation convention. | ✅ Resolved |
| Is registration implemented? | Yes. `POST /api/register` is routed to `RegisteredUserController@store`, validated by three feature tests, and used by the frontend API client. | ✅ Resolved 2026-08-09 |
| Is the protected-route requirement implemented? | Yes. `ProtectedRoute` checks `/api/user` before rendering `/dashboard` and redirects unauthenticated users to `/login`. | ✅ Resolved 2026-08-09 |
| Is the unauthenticated inventory check implemented? | Yes. The transaction-list feature test asserts 401 for guests. | ✅ Resolved |
| Are sample catalog records seeded? | Yes. `DatabaseSeeder` invokes `CatalogSeeder`, producing 4 categories, 8 products, and 16 lots; repeatability is covered by `CatalogSeederTest`. | ✅ Resolved 2026-08-09 |
| Who owns Lot writes? | Admin + Warehouse Staff, under the physical-receipt interpretation. Purchasing Manager is read-only. | ✅ Resolved 2026-08-09 |
| Should Purchasing Manager be blocked from all transaction writes? | Yes. Purchasing Manager is read-only for the ledger; only Admin and Warehouse Staff can append any transaction type, while all authenticated roles can read. | ✅ Resolved 2026-08-09 |
| Lot `onDelete` behavior? | Product deletion is restricted while related Lots exist; the current constrained foreign key intentionally prevents cascading deletion and preserves inventory traceability. | ✅ Resolved 2026-08-09 |
| `received_date` type? | `received_date` is a required `dateTime` to capture the precise physical receipt time; `expiry_date` remains a nullable `date`. | ✅ Resolved 2026-08-09 |
| Users table UUID vs bigint? | Keep Laravel's auto-incrementing `bigint` `users.id`; it is appropriate for this single-warehouse project's internal user and actor references. UUIDs remain available for domain records. | ✅ Resolved 2026-08-09 |

## Follow-ups for the next sprint

1. Continue documenting any remaining schema decisions in the
   PRD/SPEC decision log.
