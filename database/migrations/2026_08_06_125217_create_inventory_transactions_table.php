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
            $table->foreignUuid("lot_id")->constrained("lots");
            $table->foreignUuid("user_id")->constrained("users");
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
