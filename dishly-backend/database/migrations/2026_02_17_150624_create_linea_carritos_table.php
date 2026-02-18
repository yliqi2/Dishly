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
        Schema::create('linea_carrito', function (Blueprint $table) {
            $table->increments('id_linea_carrito');
            $table->integer('cantidad');
            $table->float('precio_unitario');
            $table->unsignedInteger('id_carrito');
            $table->unsignedInteger('id_receta');

            $table->foreign('id_carrito')->references('id_carrito')->on('carrito');
            $table->foreign('id_receta')->references('id_receta')->on('receta_original');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('linea_carrito');
    }
};
