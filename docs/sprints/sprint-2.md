# Sprint 2 — Core Ledger

> Status: 🟡 In Progress | Current sprint

---

| Item                                                     | Owner | Status                                                       |
| -------------------------------------------------------- | ----- | ------------------------------------------------------------ |
| CATEGORY table + CRUD endpoints                          | Rem   | 🟡 WIP                                                       |
| PRODUCT table + CRUD endpoints                           | Rem   | ✅ DONE _(migration + model done; see discrepancy note below)_ |
| LOT table + CRUD endpoints                               | Rem   | 🟡 WIP                                                       |
| INVENTORY_TRANSACTION table + append-only write endpoint | —     | ⬜ not started                                               |
| AUDIT_LOG table                                          | —     | ⬜ not started                                               |
| Automatic audit logging middleware/service               | —     | ⬜ not started                                               |
| Frontend: Category Management                            | —     | ⬜ not started                                               |
| Frontend: Product List                                   | —     | ⬜ not started                                               |
| Frontend: Product Form                                   | —     | ⬜ not started                                               |
| Frontend: Lot Management                                 | —     | ⬜ not started                                               |
| Seed realistic inventory data                            | —     | ⬜ not started                                               |
| Test: transaction writes are immutable                   | —     | ⬜ not started                                               |
| Test: audit logs are generated for CRUD operations       | —     | ⬜ not started                                               |

---

## Discrepancy Note — Product CRUD

The checklist marks Product CRUD `[/]` (DONE), but `routes/api.php` has
every Product/Category/Lot route commented out, and no
`ProductController` create/store/update/destroy logic was visible in
reviewed files. Likely reading: the **migration + model** for Product is
done, but the **CRUD endpoints** are not — the checklist bundles both
under one checkbox.

Recommendation: treat Product CRUD as **WIP** for planning purposes
until endpoints are confirmed live and tested.

---

## Open Questions Blocking Sprint 2 Sign-Off

| ID   | Question                                                                                       |
| ---- | ---------------------------------------------------------------------------------------------- |
| OQ-1 | Lot write ownership (admin + warehouse_staff) — inferred, not confirmed by perms team.         |
| OQ-4 | Lot `onDelete` when parent Product deleted — restrict vs. cascade.                             |
| OQ-5 | `received_date` type: migration `dateTime` vs. Blueprint `date`.                               |
| OQ-7 | Can a new Product reference a soft-deleted Category?                                           |
| OQ-8 | Past-dated `expiry_date` on Lot creation — reject (422) or allow?                              |
| OQ-9 | `users.id` UUID vs. bigint deviation — needs explicit team sign-off.                           |

Full open questions list: `docs/prd/PRD.md` §9.
