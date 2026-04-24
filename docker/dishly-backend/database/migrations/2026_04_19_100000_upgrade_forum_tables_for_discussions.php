<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('foro', function (Blueprint $table) {
            $table->dropForeign(['id_receta']);
        });

        Schema::table('foro', function (Blueprint $table) {
            $table->text('descripcion')->nullable()->after('titulo');
            $table->unsignedInteger('id_usuario')->nullable()->after('fecha_creacion');
            $table->unsignedInteger('id_receta')->nullable()->change();
            $table->timestamps();

            $table->foreign('id_usuario')->references('id_usuario')->on('users');
            $table->foreign('id_receta')->references('id_receta')->on('receta_original');
        });

        Schema::table('linea_foro', function (Blueprint $table) {
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::table('linea_foro', function (Blueprint $table) {
            $table->dropColumn(['created_at', 'updated_at']);
        });

        Schema::table('foro', function (Blueprint $table) {
            $table->dropForeign(['id_usuario']);
            $table->dropForeign(['id_receta']);
        });

        Schema::table('foro', function (Blueprint $table) {
            $table->dropColumn(['descripcion', 'id_usuario', 'created_at', 'updated_at']);
            $table->unsignedInteger('id_receta')->nullable(false)->change();
            $table->foreign('id_receta')->references('id_receta')->on('receta_original');
        });
    }
};
