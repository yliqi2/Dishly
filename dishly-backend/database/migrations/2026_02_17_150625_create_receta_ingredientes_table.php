<?php

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
        Schema::create('receta_ingrediente', function (Blueprint $table) {
            $table->unsignedInteger('id_receta');
            $table->unsignedInteger('id_ingrediente');
            $table->decimal('cantidad');
            $table->enum('unidad', ['g', 'kg', 'mg', 'l', 'ml']);

            $table->primary(['id_receta', 'id_ingrediente']);
            $table->foreign('id_receta')->references('id_receta')->on('receta_original');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('receta_ingrediente');
    }
};
