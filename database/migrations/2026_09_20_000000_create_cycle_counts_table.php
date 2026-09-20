<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('cycle_counts', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('sku_id');
            $table->uuid('lot_id')->nullable();
            // users.id is an auto-incrementing bigint, so actor references
            // must be unsignedBigInteger to satisfy PostgreSQL FK type matching.
            $table->unsignedBigInteger('counted_by');
            $table->string('counter_name');
            $table->unsignedInteger('expected_qty');
            $table->unsignedInteger('counted_qty');
            $table->integer('variance_qty');
            $table->decimal('variance_pct', 5, 2);
            $table->boolean('is_flagged')->default(false);
            $table->string('status')->default('pending');
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('reconciled_by')->nullable();
            $table->timestamp('reconciled_at')->nullable();
            $table->uuid('reconciliation_txn_id')->nullable();
            $table->timestamp('counted_at');
            $table->timestamps();

            $table->index('sku_id');
            $table->index('status');
            $table->index('is_flagged');

            // Foreign keys. On PostgreSQL these are enforced; SQLite ignores
            // FK constraints unless explicitly enabled.
            $table->foreign('sku_id')->references('sku_id')->on('products')->onDelete('cascade');
            $table->foreign('lot_id')->references('lot_id')->on('lots')->onDelete('set null');
            $table->foreign('counted_by')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('reconciled_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cycle_counts');
    }
};
