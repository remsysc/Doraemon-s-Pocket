# Doraemon's Pocket — Tech Debt & Production Readiness

> **Document ID:** DOC-6.1  
> **Status:** Active Reference  
> **Related Documents:** [`docs/tech-debt/auth-hardening.md`](tech-debt/auth-hardening.md), [`docs/spec/SPEC.md`](spec/SPEC.md)

---

## 1. Authentication & Session Hardening

Detailed audit and remediation strategies are documented in [`docs/tech-debt/auth-hardening.md`](tech-debt/auth-hardening.md). Key priorities for production deployment include:

| Area | Current Behavior | Production Requirement | Priority |
| :--- | :--- | :--- | :--- |
| **User Registration** | `POST /api/register` is open for development | Restrict to Admin invitation or disable public route via config flag. | **High** |
| **Sanctum Domains** | `SANCTUM_STATEFUL_DOMAINS` set to localhost/127.0.0.1 | Explicitly set to production domain (e.g., `inventory.walangbrownout.ph`). | **High** |
| **Cookie Security** | `SESSION_SECURE_COOKIE=false` in dev | Set `SESSION_SECURE_COOKIE=true` and enforce `SameSite=Lax` / `Secure` over HTTPS. | **High** |
| **Login Rate Limiting** | Default Laravel throttle (5 attempts/min) | Configure Redis-backed rate limiting per IP + username combo to prevent brute-force attacks. | **Medium** |
| **Session Driver** | `SESSION_DRIVER=database` or `file` | Migrate session driver to Redis or Memcached in multi-container / load-balanced deployments. | **Medium** |

---

## 2. Production Database Indexing & Query Optimization

The current PostgreSQL schema supports primary indexing and foreign keys. As transaction ledger volume grows (millions of transactions over multiple years), the following composite indices must be applied:

### Recommended PostgreSQL Production Indices
```sql
-- 1. Fast ledger aggregation by product and date range (Turnover & Demand calculations)
CREATE INDEX idx_inventory_txns_occurred_lot ON inventory_transactions(occurred_at DESC, lot_id);

-- 2. Accelerated FEFO pick list lookups
CREATE INDEX idx_lots_expiry_sku ON lots(expiry_date ASC NULLS LAST, sku_id);

-- 3. Cycle count history & audit analysis
CREATE INDEX idx_cycle_counts_sku_status ON cycle_counts(sku_id, status, is_flagged);

-- 4. Fast audit log queries by entity
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id, occurred_at DESC);

-- 5. Purchase Order items by PO & SKU
CREATE INDEX idx_po_items_po_sku ON purchase_order_items(po_id, sku_id);
```

### Vacuum & Partitioning Strategy
- **Partitioning `inventory_transactions`:** For massive scale (>10M rows), partition the table by range on `occurred_at` (e.g. yearly or quarterly partitions) to keep active working sets in memory.
- **Autovacuum Tuning:** Decrease `autovacuum_vacuum_scale_factor` to `0.05` on `inventory_transactions` and `inventory_snapshots` to maintain low table bloat during high write volume.

---

## 3. Scaling Considerations & Architectural Evolution

### Caching Classification & Reorder Analytics
- **Current State:** ABC/XYZ classifications and reorder point computations query the ledger dynamically.
- **Scaling Recommendation:**
  - Cache classification summaries in Redis with a 24-hour TTL or recompute on a nightly scheduled command (`php artisan inventory:classify`).
  - Cache alert counters on the Dashboard so heavy multi-join analytical queries are not executed on every page refresh.

### Asynchronous Ledger Processing
- **Queueing Side-Effects:** Although `InventoryTransactionService` updates snapshots synchronously inside DB transactions to guarantee concurrency safety (`lockForUpdate`), non-critical side effects (such as external notifications or search index syncing) should be dispatched to Laravel Queues (e.g. `sqs` or `redis`).

### Read-Write Database Separation
- For larger branch deployments, configure Laravel DB read replicas (`config/database.php` read/write connections).
- Route analytical queries (`ReportService`, `ClassificationService`) to read replicas, leaving the primary database dedicated to row-locked ledger transactions.

---

## 4. Deployment & Infrastructure Migration (AWS EC2 / Docker)

### Target Architecture (AWS EC2)
- **Compute:** AWS EC2 `t3.medium` or `t4g.medium` running Ubuntu 24.04 LTS.
- **Containerization:** Docker Compose running:
  1. `app`: PHP 8.5-FPM + Laravel runtime with Nginx reverse proxy.
  2. `queue`: Dedicated worker container for background jobs.
  3. `db`: Managed AWS RDS PostgreSQL (or containerized PostgreSQL 16 volume for standalone demo).
  4. `cache`: AWS ElastiCache Redis (or lightweight Redis container).
- **Environment Synchronization:**
  - Store environment variables (`APP_KEY`, `DB_PASSWORD`, `SANCTUM_STATEFUL_DOMAINS`) in AWS Systems Manager Parameter Store or AWS Secrets Manager.
  - Automatically inject during container startup via Docker Compose `.env`.
