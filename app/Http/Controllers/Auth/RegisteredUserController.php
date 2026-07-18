<?php


namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules;
use Illuminate\Support\Facades\Auth;



class RegisteredUserController extends Controller{

    public function store(Request $request): JsonResponse{
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string' , 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => ['required', 'in:admin,purchasing_manager,warehouse_staff']
        ]);

        $user = User::create($validated);
        Auth::login($user);

        return response()->json($user, 201);
    }

}
