<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create("inventory_snapshots", function (Blueprint $table) {
            $table->foreignUuid("sku_id")
                ->primary()
                ->constrained("products", "sku_id")
                ->cascadeOnDelete();
            $table->integer("qty_on_hand")->default(0);
            $table->integer("qty_reserved")->default(0);
            $table->integer("qty_available")->default(0);
            $table->timestamps();
        });

        if (DB::getDriverName() === "pgsql") {
            DB::statement(
                "ALTER TABLE inventory_snapshots ADD CONSTRAINT inventory_snapshots_quantities_nonnegative CHECK (qty_on_hand >= 0 AND qty_reserved >= 0 AND qty_available >= 0)"
            );
            DB::statement(
                "ALTER TABLE inventory_snapshots ADD CONSTRAINT inventory_snapshots_available_matches_quantities CHECK (qty_available = qty_on_hand - qty_reserved)"
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists("inventory_snapshots");
    }
};
