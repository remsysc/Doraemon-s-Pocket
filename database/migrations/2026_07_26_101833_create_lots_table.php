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
        Schema::create("lots", function (Blueprint $table) {
            $table->uuid("lot_id")->primary();
            $table
                ->foreignUuid("sku_id")
                ->constrained(table: "products", column: "sku_id");
            $table->index("sku_id");
            $table->dateTime("received_date");
            $table->date("expiry_date")->nullable();
            $table->string("bin_location");
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists("lots");
    }
};
