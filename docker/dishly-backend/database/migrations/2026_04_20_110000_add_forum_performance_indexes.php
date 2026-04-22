<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('foro', function (Blueprint $table) {
            $table->index(['id_usuario', 'created_at'], 'foro_user_created_idx');
            $table->index('created_at', 'foro_created_idx');
        });

        Schema::table('linea_foro', function (Blueprint $table) {
            $table->index(['id_foro', 'created_at'], 'linea_foro_forum_created_idx');
            $table->index(['id_usuario', 'created_at'], 'linea_foro_user_created_idx');
        });
    }

    public function down(): void
    {
        Schema::table('linea_foro', function (Blueprint $table) {
            $table->dropIndex('linea_foro_forum_created_idx');
            $table->dropIndex('linea_foro_user_created_idx');
        });

        Schema::table('foro', function (Blueprint $table) {
            $table->dropIndex('foro_user_created_idx');
            $table->dropIndex('foro_created_idx');
        });
    }
};
