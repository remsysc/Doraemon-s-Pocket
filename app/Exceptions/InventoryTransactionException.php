<?php

namespace App\Exceptions;

use RuntimeException;

class InventoryTransactionException extends RuntimeException
{
    public function __construct(
        public readonly string $errorCode,
        string $message,
    ) {
        parent::__construct($message);
    }
}
