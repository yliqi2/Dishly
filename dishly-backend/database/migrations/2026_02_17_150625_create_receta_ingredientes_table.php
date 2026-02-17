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

            $table->primary(['id_receta', 'id_ingrediente']);
            $table->foreign('id_receta')->references('id_receta')->on('receta_original');
            $table->foreign('id_ingrediente')->references('id_ingrediente')->on('ingrediente');
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
