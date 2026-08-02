<?php

namespace App\Http\Controllers;

use App\Http\Requests\Categories\IndexCategoryRequest;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(IndexCategoryRequest $request) {}
}
