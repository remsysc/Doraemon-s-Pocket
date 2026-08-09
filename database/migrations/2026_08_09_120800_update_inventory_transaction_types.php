<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    private const TYPES = "'RECEIPT', 'RESERVE', 'PICK', 'SALE', 'ADJUSTMENT', 'WRITE_OFF'";

    public function up(): void
    {
        if (DB::getDriverName() !== "pgsql") {
            return;
        }

        DB::statement(
            "ALTER TABLE inventory_transactions DROP CONSTRAINT IF EXISTS inventory_transactions_txn_type_check"
        );
        DB::statement(
            "ALTER TABLE inventory_transactions ALTER COLUMN txn_type TYPE VARCHAR(20)"
        );
        // Preserve existing ledger rows from the temporary in/out contract.
        DB::statement(
            "UPDATE inventory_transactions SET txn_type = CASE txn_type WHEN 'in' THEN 'RECEIPT' WHEN 'out' THEN 'ADJUSTMENT' ELSE txn_type END"
        );
        DB::statement(
            "ALTER TABLE inventory_transactions ADD CONSTRAINT inventory_transactions_txn_type_check CHECK (txn_type IN (" . self::TYPES . "))"
        );
    }

    public function down(): void
    {
        if (DB::getDriverName() !== "pgsql") {
            return;
        }

        DB::statement(
            "ALTER TABLE inventory_transactions DROP CONSTRAINT IF EXISTS inventory_transactions_txn_type_check"
        );
        DB::statement(
            "ALTER TABLE inventory_transactions ADD CONSTRAINT inventory_transactions_txn_type_check CHECK (txn_type IN ('in', 'out'))"
        );
    }
};
