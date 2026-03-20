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
            $table->text('instrucciones');
            $table->integer('tiempo_preparacion');
            $table->enum('tiempo_preparacion_unidad', ['minutes', 'hours'])->default('minutes');
            $table->enum('dificultad', ['easy', 'medium', 'hard'])->default('easy');
            $table->unsignedSmallInteger('porciones')->default(1);
            $table->decimal('price', 20, 2)->nullable();
            $table->string('imagen_1')->nullable();
            $table->string('imagen_2')->nullable();
            $table->string('imagen_3')->nullable();
            $table->string('imagen_4')->nullable();
            $table->string('imagen_5')->nullable();
            $table->date('fecha_creacion');
            $table->unsignedInteger('id_autor');
            $table->boolean('estado')->default(true);

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
