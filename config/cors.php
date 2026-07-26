<?php

return [
    "paths" => ["api/*", "sanctum/csrf-cookie"],
    "allowed_origins_methods" => ["*"],
    "allowed_origins" => ["http://localhost:5173", "http://localhost:8000"],
    "supports_credentials" => true,
    "allowed_headers" => ["*"],
    "exposed_headers" => [],
    "max_age " => 0,
];
