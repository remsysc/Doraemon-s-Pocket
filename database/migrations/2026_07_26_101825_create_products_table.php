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
        Schema::create("products", function (Blueprint $table) {
            $table->uuid("sku_id")->primary();
            $table->foreignUuid("category_id")->references("category_id")->on("categories");
            $table->index("category_id");
            $table->string("name");
            $table->string("description")->nullable();
            $table->string("barcode")->nullable();
            $table->string("unit_of_measure");
            $table->boolean("is_seasonal")->default(false);
            $table->integer("shelf_life_days")->nullable();
            $table->boolean("is_active")->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists("products");
    }
};
