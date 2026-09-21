<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Reorder demand window (days)
    |--------------------------------------------------------------------------
    | Trailing window used to derive average daily demand and demand variance
    | from the append-only ledger (SALE + PICK outflow). Drives ROP, safety
    | stock, EOQ annual demand, and ABC/XYZ classification.
    */
    'reorder_demand_window_days' => (int) env('REORDER_DEMAND_WINDOW_DAYS', 90),

    /*
    |--------------------------------------------------------------------------
    | Expiry alert window (days)
    |--------------------------------------------------------------------------
    | Default look-ahead window for the expiry alert endpoint (SPEC FR-25).
    | Overridable per-request via ?days=.
    */
    'expiry_alert_window_days' => (int) env('EXPIRY_ALERT_WINDOW_DAYS', 30),

    /*
    |--------------------------------------------------------------------------
    | Variance alert threshold percentage
    |--------------------------------------------------------------------------
    | Variance above this percentage (absolute value) is flagged for review
    | in cycle counts (SPEC FR-30). Default 5.0%.
    */
    'variance_alert_threshold_percentage' => (float) env('VARIANCE_ALERT_THRESHOLD_PERCENTAGE', 5.0),

    /*
    |--------------------------------------------------------------------------
    | Turnover window (days)
    |--------------------------------------------------------------------------
    | Trailing window used to calculate inventory turnover ratio from outflow
    | units and average on-hand quantity (SPEC FR-18).
    */
    'turnover_window_days' => (int) env('TURNOVER_WINDOW_DAYS', 90),
];
