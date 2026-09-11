<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reorder_configs', function (Blueprint $table) {
            $table->foreignUuid('sku_id')
                ->primary()
                ->constrained('products', 'sku_id')
                ->cascadeOnDelete();

            // Manual overrides. Null means "use the derived value".
            $table->integer('reorder_point')->nullable();
            $table->integer('safety_stock')->nullable();

            $table->integer('lead_time_days')->default(0);

            // Non-price operational costs for EOQ (OQ-6). These are NOT unit
            // price, COGS, or valuation and never live on Product (FR-14).
            $table->decimal('order_cost', 12, 2)->nullable();
            $table->decimal('holding_cost_per_unit', 12, 2)->nullable();

            // Service-level Z for statistical safety stock (default ~95%).
            $table->decimal('service_level_z', 5, 2)->default(1.65);

            $table->timestamps();
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement(
                'ALTER TABLE reorder_configs ADD CONSTRAINT reorder_configs_nonnegative CHECK (
                    (reorder_point IS NULL OR reorder_point >= 0)
                    AND (safety_stock IS NULL OR safety_stock >= 0)
                    AND lead_time_days >= 0
                    AND (order_cost IS NULL OR order_cost >= 0)
                    AND (holding_cost_per_unit IS NULL OR holding_cost_per_unit >= 0)
                    AND service_level_z >= 0
                )'
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('reorder_configs');
    }
};
