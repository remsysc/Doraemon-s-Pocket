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
        Schema::create("audit_logs", function (Blueprint $table) {
            $table->uuid("audit_id")->primary();
            $table->foreignId("actor_id")->constrained("users");
            $table->string("action");
            $table->string("entity_id");
            $table->string("entity_type");
            $table->jsonb("old_values")->nullable();
            $table->jsonb("new_values")->nullable();
            $table->timestamp("occurred_at");

            $table->index(["entity_type", "entity_id"]);
            $table->index("occurred_at");
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists("audit_logs");
    }
};
