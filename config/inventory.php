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
];
