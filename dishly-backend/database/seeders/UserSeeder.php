<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = now();

        DB::table('users')->insert([
            [
                'nombre' => 'Pau',
                'email' => 'pau@gmail.com',
                'password' => Hash::make('12345678'),
                'chef' => false,
                'rol' => 'cliente',
                'icon_path' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'nombre' => 'Liqi',
                'email' => 'liqi@gmail.com',
                'password' => Hash::make('12345678'),
                'chef' => false,
                'rol' => 'admin',
                'icon_path' => 'users/icons/2.png',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'nombre' => 'Marc',
                'email' => 'marc@gmail.com',
                'password' => Hash::make('12345678'),
                'chef' => true,
                'rol' => 'admin',
                'icon_path' => 'users/icons/3.png',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }
}
