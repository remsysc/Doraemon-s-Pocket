# Sprint 3 — Inventory Snapshots & Concurrency

> Status: ⬜ Planned | Next sprint
> Depends on: Sprint 2 Core Ledger ✅ complete

## Goal

Turn the append-only transaction ledger into real-time stock availability without allowing concurrent picks or sales to oversell inventory.

## Snapshot semantics

`inventory_snapshots` contains one derived row per SKU with these invariants:

```text
qty_on_hand >= 0
qty_reserved >= 0
qty_available >= 0
qty_available = qty_on_hand - qty_reserved
```

Transaction side effects use the signed `qty_delta` from the append-only ledger:

| Transaction | `qty_on_hand` | `qty_reserved` | `qty_available` |
| --- | ---: | ---: | ---: |
| `RECEIPT +N` | `+N` | unchanged | `+N` |
| `ADJUSTMENT ±N` | `±N` | unchanged | `±N` |
| `RESERVE -N` | unchanged | `+N` | `-N` |
| `RESERVE +N` | unchanged | `-N` | `+N` |
| `PICK -N` | `-N` | `-N` | unchanged |
| `SALE -N` | `-N` | unchanged | `-N` |
| `WRITE_OFF -N` | `-N` | unchanged | `-N` |

A negative `RESERVE` creates a reservation; a positive `RESERVE` releases one. `PICK` consumes reserved stock. Each ledger row still references one Lot, while the snapshot aggregates the affected Lot's Product SKU. Any operation that would violate an invariant is rejected with HTTP 422 and rolls back both the snapshot update and ledger insert.

## Scope checklist

| Item | Status |
| --- | --- |
| Define `inventory_snapshots` schema for `qty_on_hand`, `qty_reserved`, and `qty_available` per SKU | ✅ Foundation implemented |
| Add snapshot model, relationships, and non-standard primary-key handling | ✅ Foundation implemented |
| Implement transaction side effects in a database transaction | ✅ Implemented |
| Lock the affected snapshot row with `lockForUpdate()` before calculating availability | ✅ Implemented |
| Apply `RECEIPT` and `ADJUSTMENT` quantity changes | ✅ Implemented |
| Apply `RESERVE` and release semantics without negative availability | ✅ Implemented |
| Apply `PICK`, `SALE`, and `WRITE_OFF` decrements | ✅ Implemented |
| Reject insufficient stock with a documented 422 error and roll back the ledger insert | ✅ Implemented |
| Add concurrency tests proving only one competing decrement succeeds | ✅ Implemented |
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
- Preserve the existing `inventory_transactions.occurred_at` column spelling from the authoritative migration; application and API references must use `occurred_at`.
- Do not add Product price or valuation fields.
- Keep transaction writes append-only; corrections are new ledger rows.
