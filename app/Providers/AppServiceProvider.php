<?php

namespace App\Providers;

use App\Models\Category;
use App\Models\Lot;
use App\Models\Product;
use App\Models\User;
use App\Observers\AuditObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Category::observe(AuditObserver::class);
        Product::observe(AuditObserver::class);
        Lot::observe(AuditObserver::class);
        User::observe(AuditObserver::class);
    }
}
