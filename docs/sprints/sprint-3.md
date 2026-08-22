# Sprint 3 — Inventory Snapshots & Concurrency

> Status: ⬜ Planned | Next sprint
> Depends on: Sprint 2 Core Ledger ✅ complete

## Goal

Turn the append-only transaction ledger into real-time stock availability without allowing concurrent picks or sales to oversell inventory.

## Scope checklist

| Item | Status |
| --- | --- |
| Define `inventory_snapshots` schema for `qty_on_hand`, `qty_reserved`, and `qty_available` per SKU | ⬜ Not started |
| Add snapshot model, relationships, and non-standard primary-key handling | ⬜ Not started |
| Implement transaction side effects in a database transaction | ⬜ Not started |
| Lock the affected snapshot row with `lockForUpdate()` before calculating availability | ⬜ Not started |
| Apply `RECEIPT` and `ADJUSTMENT` quantity changes | ⬜ Not started |
| Apply `RESERVE` and release semantics without negative availability | ⬜ Not started |
| Apply `PICK`, `SALE`, and `WRITE_OFF` decrements | ⬜ Not started |
| Reject insufficient stock with a documented 422 error and roll back the ledger insert | ⬜ Not started |
| Add concurrency tests proving only one competing decrement succeeds | ⬜ Not started |
| Add snapshot read endpoints for authenticated roles | ⬜ Not started |
| Add frontend stock overview / on-hand display | ⬜ Not started |

## Acceptance criteria

1. Every accepted stock-affecting transaction updates its corresponding snapshot in the same database transaction.
2. A `SALE` or `PICK` that would make `qty_available` negative returns 422 and creates no transaction row.
3. Concurrent decrements against the same SKU are serialized by a row-level lock; exactly one request can consume the final available unit.
4. Snapshot quantities are derived from ledger operations, not directly edited by clients.
5. All snapshot read endpoints enforce the existing authenticated-role read policy.
6. Existing Sprint 2 append-only and actor-attribution behavior remains green.

## Non-goals

- Reorder points, EOQ, ABC/XYZ classification, and purchasing alerts belong to Sprint 4.
- Cycle counts, variance reports, and audit-log UI belong to Sprint 5.
- Production authentication hardening and removal of public registration are later hardening/user-management work.

## Technical constraints

- Use Laravel database transactions and PostgreSQL row-level locking.
- Preserve the existing `inventory_transactions.occured_at` column spelling until a separately documented schema migration is approved.
- Do not add Product price or valuation fields.
- Keep transaction writes append-only; corrections are new ledger rows.
