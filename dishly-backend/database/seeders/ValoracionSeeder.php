<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ValoracionSeeder extends Seeder
{
    public function run(): void
    {
        $userId = function (string $email): ?int {
            $id = DB::table('users')
                ->whereRaw('LOWER(email) = ?', [strtolower(trim($email))])
                ->value('id_usuario');

            return $id ? (int) $id : null;
        };

        $recipeId = function (string $title): ?int {
            $id = DB::table('receta_original')
                ->where('titulo', $title)
                ->value('id_receta');

            return $id ? (int) $id : null;
        };

        $reviews = [
            ['recipe' => 'Fettuccine Alfredo', 'email' => 'pau@gmail.com', 'puntuacion' => 5, 'comentario' => 'Amazing! Will cook again.', 'fecha' => now()],
            ['recipe' => 'Fettuccine Alfredo', 'email' => 'marc@gmail.com', 'puntuacion' => 4, 'comentario' => 'A bit heavy, but very tasty cream sauce.', 'fecha' => now()],

            ['recipe' => 'Spaghetti alla Puttanesca', 'email' => '1871649909yang@gmail.com', 'puntuacion' => 5, 'comentario' => 'Incredible flavors. The olives give it such a great punch.', 'fecha' => now()],

            ['recipe' => 'Ultimate Smash Burger', 'email' => '1871649909yang@gmail.com', 'puntuacion' => 4, 'comentario' => 'Great burger, though I prefer more cheddar.', 'fecha' => '2026-04-07'],
            ['recipe' => 'Ultimate Smash Burger', 'email' => 'marc@gmail.com', 'puntuacion' => 5, 'comentario' => 'Best smash burger recipe out there.', 'fecha' => '2026-04-07'],
            ['recipe' => 'Ultimate Smash Burger', 'email' => 'alex@gmail.com', 'puntuacion' => 5, 'comentario' => 'Super juicy and perfectly balanced.', 'fecha' => '2026-04-06'],
            ['recipe' => 'Ultimate Smash Burger', 'email' => 'mia@gmail.com', 'puntuacion' => 4, 'comentario' => 'Loved the crispy edges on the patty.', 'fecha' => '2026-04-06'],
            ['recipe' => 'Ultimate Smash Burger', 'email' => 'noah@gmail.com', 'puntuacion' => 5, 'comentario' => 'Restaurant quality burger at home.', 'fecha' => '2026-04-07'],
            ['recipe' => 'Ultimate Smash Burger', 'email' => 'sofia@gmail.com', 'puntuacion' => 4, 'comentario' => 'The guacamole twist works really well.', 'fecha' => '2026-04-06'],
            ['recipe' => 'Ultimate Smash Burger', 'email' => 'emma@gmail.com', 'puntuacion' => 5, 'comentario' => 'Crispy bacon and cheddar made it amazing.', 'fecha' => '2026-04-07'],
            ['recipe' => 'Ultimate Smash Burger', 'email' => 'leo@gmail.com', 'puntuacion' => 4, 'comentario' => 'Easy to follow and very satisfying.', 'fecha' => '2026-04-06'],
            ['recipe' => 'Ultimate Smash Burger', 'email' => 'chloe@gmail.com', 'puntuacion' => 5, 'comentario' => 'My family asked me to make these again.', 'fecha' => now()],
            ['recipe' => 'Ultimate Smash Burger', 'email' => 'hugo@gmail.com', 'puntuacion' => 4, 'comentario' => 'Very tasty, especially with the toasted bun.', 'fecha' => now()],
            ['recipe' => 'Ultimate Smash Burger', 'email' => 'nora@gmail.com', 'puntuacion' => 5, 'comentario' => 'Definitely one of the best burger recipes here.', 'fecha' => now()],
            ['recipe' => 'Ultimate Smash Burger', 'email' => 'lucas@gmail.com', 'puntuacion' => 4, 'comentario' => 'Great texture and lots of flavor in every bite.', 'fecha' => now()],

            ['recipe' => 'Gourmet Smash Burger', 'email' => 'pau@gmail.com', 'puntuacion' => 3, 'comentario' => 'It was okay. Took a while to prep.', 'fecha' => now()],
        ];

        $rows = [];
        foreach ($reviews as $review) {
            $idReceta = $recipeId($review['recipe']);
            $idUsuario = $userId($review['email']);
            if (!$idReceta || !$idUsuario) {
                continue;
            }

            $rows[] = [
                'id_receta' => $idReceta,
                'id_usuario' => $idUsuario,
                'puntuacion' => $review['puntuacion'],
                'comentario' => $review['comentario'],
                'fecha' => $review['fecha'],
            ];
        }

        if ($rows !== []) {
            DB::table('valoracion')->insert($rows);
        }
    }
}

