<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CarritoController;
use App\Http\Controllers\MailController;
use App\Http\Controllers\RecetaController;
use App\Http\Controllers\UserController;

Route::post('/register', [AuthController::class , 'register']);
Route::post('/login', [AuthController::class , 'login']);
Route::post('/send-email', [MailController::class, 'send']);
Route::get('/recipes', [RecetaController::class , 'getAllRecetas']);
Route::get('/recipes/{id}', [RecetaController::class , 'getRecetaById']);
Route::get('/recipes/{id}/reviews', [RecetaController::class , 'getReviewsForRecipe']);


Route::middleware('auth:api')->group(function () {
    // Rutas de Profile
    Route::get('/user', function (Request $request) {
            return $request->user();
        }
        );

        Route::post('/logout', [AuthController::class , 'logout']);

        Route::put('/profile', [AuthController::class , 'updateProfile']);
        Route::put('/profile/personalinfo', [UserController::class , 'updatePersonalInfo']);
        Route::put('/profile/updatePassword', [UserController::class , 'updatePassword']);
        Route::put('/profile/deactivateAccount', [UserController::class , 'deactivateAccount']);
        Route::post('/profile/upload-icon', [AuthController::class , 'uploadIcon']);

        Route::get('/profile/count-recipes', [RecetaController::class , 'getCountRecipes']);
        Route::get('/profile/my-recipes', [RecetaController::class , 'getMyRecipes']);
        Route::get('/profile/media-valoraciones', [RecetaController::class , 'getMediaValoraciones']);
        Route::post('/recetas/valorar', [RecetaController::class , 'setValoracion']);
        Route::delete('/recetas/valorar/{id}', [RecetaController::class , 'deleteValoracion']);

        // Rutas de Recipes
        Route::post('/recetas/upload', [RecetaController::class , 'store']);
        Route::put('/recetas/{id}', [RecetaController::class , 'update']);
        Route::get('/recetas/categorias', [RecetaController::class , 'getCategorias']);
        Route::put('/recetas/desactivar/{id}', [RecetaController::class , 'desactivarReceta']);

        Route::get('/carrito', [CarritoController::class, 'getCarrito']);
        Route::post('/carrito', [CarritoController::class, 'addToCart']);
        Route::delete('/carrito/recipe/{idReceta}', [CarritoController::class, 'removeFromCart']);
        Route::delete('/carrito', [CarritoController::class, 'clearCart']);

        Route::get('/recipes/{id}/check-purchase', [RecetaController::class , 'checkPurchase']);


    }); 