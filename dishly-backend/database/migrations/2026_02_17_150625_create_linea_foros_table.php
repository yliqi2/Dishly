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
        Schema::create('linea_foro', function (Blueprint $table) {
            $table->increments('id_linea_foro');
            $table->text('mensaje');
            $table->date('fecha');
            $table->unsignedInteger('id_foro');
            $table->unsignedInteger('id_usuario');

            $table->foreign('id_foro')->references('id_foro')->on('foro');
            $table->foreign('id_usuario')->references('id_usuario')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('linea_foro');
    }
};
