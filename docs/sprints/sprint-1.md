# Sprint 1 — Foundation & Auth

> Status: ✅ DONE | Owner: Rem (Backend) + Lyll & Larce (Frontend)

---

| Item                                                    | Owner        | Status                                          |
| ------------------------------------------------------- | ------------ | ----------------------------------------------- |
| Repo setup, CI, project skeleton                        | Rem          | ✅ DONE                                         |
| USER table (id, email, password_hash, role)             | Rem          | ✅ DONE                                         |
| Register/login endpoints, session auth                  | Rem          | ✅ DONE                                         |
| Role-based route-guarding middleware                    | Rem          | ✅ DONE                                         |
| Purchasing Manager / Warehouse Staff / Admin personas   | Cindy & Vane | ✅ DONE (submitted 2026-08-04)                  |
| User can/can't-do, UI expectations                      | Cindy & Vane | ✅ DONE (submitted 2026-08-04)                  |
| Wireframes                                              | Lyll & Larce | ✅ DONE                                         |
| Frontend: login/register pages, protected-route wrapper | Lyll & Larce | 🟡 WIP                                          |
| Initial DB seeders (users, roles, sample products)      | Rem          | ✅ DONE                                         |
| List all endpoints (API contract doc)                   | Rem          | ✅ DONE                                         |
| Test: can't hit inventory endpoint unauthenticated      | —            | ⬜ not started                                  |

---

## Notes

- RBAC refinement from perms team (Cindy & Vane) incorporated 2026-08-04.
  See `docs/ai/decisions.md` for the full reasoning.
- Frontend login/register pages are WIP as of last check — not blocking
  Sprint 2 backend work.
- The "can't hit inventory endpoint unauthenticated" test was not written
  in this sprint; carry forward to Sprint 2 test cleanup.
