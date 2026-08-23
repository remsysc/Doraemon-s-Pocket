<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create("inventory_transactions", function (Blueprint $table) {
            $table->uuid("txn_id")->primary();
            $table->foreignUuid("lot_id")->constrained("lots", "lot_id");
            $table->foreignId("actor_id")->constrained("users");
            $table->enum("txn_type", [
                "RECEIPT",
                "RESERVE",
                "PICK",
                "SALE",
                "ADJUSTMENT",
                "WRITE_OFF",
            ]);
            $table->integer("qty_delta");
            $table->dateTime("occurred_at");
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists("inventory_transactions");
    }
};
