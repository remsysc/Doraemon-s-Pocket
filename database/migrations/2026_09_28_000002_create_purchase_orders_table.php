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
        Schema::create('purchase_orders', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('po_number')->unique();
            $table->uuid('supplier_id');
            $table->string('status')->default('draft');
            $table->date('order_date')->nullable();
            $table->date('expected_delivery_date')->nullable();
            $table->text('notes')->nullable();
            $table->decimal('total_amount', 12, 2)->default(0.00);
            $table->unsignedBigInteger('created_by');
            $table->timestamps();

            $table->index('supplier_id');
            $table->index('status');
            $table->index('order_date');

            $table->foreign('supplier_id')->references('id')->on('suppliers')->onDelete('restrict');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_orders');
    }
};
