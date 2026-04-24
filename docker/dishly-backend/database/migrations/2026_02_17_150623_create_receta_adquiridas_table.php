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
        Schema::create('receta_adquirida', function (Blueprint $table) {
            $table->increments('id_adquirida');
            $table->date('fecha_compra');
            $table->float('precio');
            $table->unsignedInteger('id_usuario');
            $table->unsignedInteger('id_receta');

            $table->foreign('id_usuario')->references('id_usuario')->on('users');
            $table->foreign('id_receta')->references('id_receta')->on('receta_original');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('receta_adquirida');
    }
};
