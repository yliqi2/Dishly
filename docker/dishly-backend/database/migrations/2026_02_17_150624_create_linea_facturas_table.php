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
        Schema::create('linea_factura', function (Blueprint $table) {
            $table->increments('id_linea_factura');
            $table->integer('cantidad');
            $table->float('subtotal');
            $table->unsignedInteger('id_factura');
            $table->unsignedInteger('id_receta');

            $table->foreign('id_factura')->references('id_factura')->on('factura');
            $table->foreign('id_receta')->references('id_receta')->on('receta_original');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('linea_factura');
    }
};
