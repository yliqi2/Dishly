<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $duplicates = DB::table('receta_adquirida')
            ->select(
                'id_usuario',
                'id_receta',
                DB::raw('MIN(id_adquirida) as keep_id'),
                DB::raw('COUNT(*) as duplicate_count')
            )
            ->groupBy('id_usuario', 'id_receta')
            ->having('duplicate_count', '>', 1)
            ->get();

        foreach ($duplicates as $duplicate) {
            DB::table('receta_adquirida')
                ->where('id_usuario', $duplicate->id_usuario)
                ->where('id_receta', $duplicate->id_receta)
                ->where('id_adquirida', '!=', $duplicate->keep_id)
                ->delete();
        }

        Schema::table('receta_adquirida', function (Blueprint $table) {
            $table->unique(['id_usuario', 'id_receta'], 'receta_adquirida_user_recipe_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('receta_adquirida', function (Blueprint $table) {
            $table->dropUnique('receta_adquirida_user_recipe_unique');
        });
    }
};
