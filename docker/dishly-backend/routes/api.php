<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CarritoController;
use App\Http\Controllers\ForumController;
use App\Http\Controllers\MailController;
use App\Http\Controllers\RecetaController;
use App\Http\Controllers\UserController;

Route::post('/register', [AuthController::class , 'register']);
Route::post('/login', [AuthController::class , 'login']);
Route::get('/verify-email', [AuthController::class, 'verifyEmailApi']);
Route::post('/send-email', [MailController::class, 'send']);
Route::post('/reset-password', [MailController::class, 'resetPassword']);
Route::get('/recipes', [RecetaController::class , 'getAllRecetas']);
Route::get('/chatbot/recipes/catalog', [\App\Http\Controllers\ChatbotController::class, 'catalog']);
Route::post('/chatbot/receta/buscar', [\App\Http\Controllers\ChatbotController::class, 'buscar']);
Route::get('/recipes/{id}', [RecetaController::class , 'getRecetaById']);
Route::get('/recipes/{id}/reviews', [RecetaController::class , 'getReviewsForRecipe']);
Route::get('/forums', [ForumController::class, 'index']);
Route::get('/forums/{forumId}', [ForumController::class, 'show']);


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
        Route::post('/carrito/pagar', [CarritoController::class, 'pagar']);
        Route::delete('/carrito/recipe/{idReceta}', [CarritoController::class, 'removeFromCart']);
        Route::delete('/carrito', [CarritoController::class, 'clearCart']);

        Route::get('/recipes/{id}/check-purchase', [RecetaController::class , 'checkPurchase']);

        Route::post('/forums', [ForumController::class, 'store']);
        Route::post('/forums/{forumId}/comments', [ForumController::class, 'storeComment']);
        Route::put('/forums/{forumId}/comments/{commentId}', [ForumController::class, 'updateComment']);
        Route::delete('/forums/{forumId}/comments/{commentId}', [ForumController::class, 'destroyComment']);


    });
