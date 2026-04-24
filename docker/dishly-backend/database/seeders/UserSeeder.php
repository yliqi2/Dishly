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

        DB::table('users')->insertOrIgnore([
            [
                'nombre' => 'Pau',
                'email' => 'pau@gmail.com',
                'password' => Hash::make('12345678'),
                'chef' => false,
                'rol' => 'cliente',
                'icon_path' => null,
                'created_at' => $now,
                'updated_at' => $now,
                'usuario_verificado' => true,
            ],
            [
                'nombre' => 'Liqi',
                'email' => '1871649909yang@gmail.com',
                'password' => Hash::make('12345678'),
                'chef' => false,
                'rol' => 'admin',
                'icon_path' => 'users/icons/2.png',
                'created_at' => $now,
                'updated_at' => $now,
                'usuario_verificado' => true,
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
                'usuario_verificado' => true,
            ],
            [
                'nombre' => 'Alex',
                'email' => 'alex@gmail.com',
                'password' => Hash::make('12345678'),
                'chef' => false,
                'rol' => 'cliente',
                'icon_path' => null,
                'created_at' => $now,
                'updated_at' => $now,
                'usuario_verificado' => true,
            ],
            [
                'nombre' => 'Mia',
                'email' => 'mia@gmail.com',
                'password' => Hash::make('12345678'),
                'chef' => false,
                'rol' => 'cliente',
                'icon_path' => null,
                'created_at' => $now,
                'updated_at' => $now,
                'usuario_verificado' => true,
            ],
            [
                'nombre' => 'Noah',
                'email' => 'noah@gmail.com',
                'password' => Hash::make('12345678'),
                'chef' => false,
                'rol' => 'cliente',
                'icon_path' => null,
                'created_at' => $now,
                'updated_at' => $now,
                'usuario_verificado' => true,
            ],
            [
                'nombre' => 'Sofia',
                'email' => 'sofia@gmail.com',
                'password' => Hash::make('12345678'),
                'chef' => false,
                'rol' => 'cliente',
                'icon_path' => null,
                'created_at' => $now,
                'updated_at' => $now,
                'usuario_verificado' => true,
            ],
            [
                'nombre' => 'Emma',
                'email' => 'emma@gmail.com',
                'password' => Hash::make('12345678'),
                'chef' => false,
                'rol' => 'cliente',
                'icon_path' => null,
                'created_at' => $now,
                'updated_at' => $now,
                'usuario_verificado' => true,
            ],
            [
                'nombre' => 'Leo',
                'email' => 'leo@gmail.com',
                'password' => Hash::make('12345678'),
                'chef' => false,
                'rol' => 'cliente',
                'icon_path' => null,
                'created_at' => $now,
                'updated_at' => $now,
                'usuario_verificado' => true,
            ],
            [
                'nombre' => 'Chloe',
                'email' => 'chloe@gmail.com',
                'password' => Hash::make('12345678'),
                'chef' => false,
                'rol' => 'cliente',
                'icon_path' => null,
                'created_at' => $now,
                'updated_at' => $now,
                'usuario_verificado' => true,
            ],
            [
                'nombre' => 'Hugo',
                'email' => 'hugo@gmail.com',
                'password' => Hash::make('12345678'),
                'chef' => false,
                'rol' => 'cliente',
                'icon_path' => null,
                'created_at' => $now,
                'updated_at' => $now,
                'usuario_verificado' => true,
            ],
            [
                'nombre' => 'Nora',
                'email' => 'nora@gmail.com',
                'password' => Hash::make('12345678'),
                'chef' => false,
                'rol' => 'cliente',
                'icon_path' => null,
                'created_at' => $now,
                'updated_at' => $now,
                'usuario_verificado' => true,
            ],
            [
                'nombre' => 'Lucas',
                'email' => 'lucas@gmail.com',
                'password' => Hash::make('12345678'),
                'chef' => false,
                'rol' => 'cliente',
                'icon_path' => null,
                'created_at' => $now,
                'updated_at' => $now,
                'usuario_verificado' => true,
            ],
        ]);
    }
}
