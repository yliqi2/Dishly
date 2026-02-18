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
        Schema::create('receta_original', function (Blueprint $table) {
            $table->increments('id_receta');
            $table->string('titulo');
            $table->text('descripcion');
            $table->integer('tiempo_preparacion');
            $table->date('fecha_creacion');
            $table->unsignedInteger('id_autor');

            $table->foreign('id_autor')->references('id_usuario')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('receta_original');
    }
};
