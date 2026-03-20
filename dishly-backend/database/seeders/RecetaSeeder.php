<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RecetaSeeder extends Seeder
{
    public function run(): void
    {
        // ── Helper: get or create ingredient ──────────────────────────────
        $resolveIngredient = function (string $name): int {
            $existing = DB::table('ingrediente')
                ->whereRaw('LOWER(nombre) = ?', [strtolower(trim($name))])
                ->value('id_ingrediente');

            if ($existing) return (int) $existing;

            return (int) DB::table('ingrediente')->insertGetId(['nombre' => trim($name)]);
        };

        // ── Helper: get category id by name ───────────────────────────────
        $cat = function (string $name): int {
            return (int) DB::table('categoria')
                ->whereRaw('LOWER(nombre) = ?', [strtolower($name)])
                ->value('id_categoria');
        };

        // ── Recipes ───────────────────────────────────────────────────────
        $recipes = [

            // 1 · Fettuccine Alfredo -> Liqi (id_autor: 2)
            [
                'recipe' => [
                    'titulo'                  => 'Fettuccine Alfredo',
                    'descripcion'             => 'A classic Italian pasta dish smothered in a silky butter and Parmesan cream sauce, finished with fresh parsley. Simple, indulgent and ready in under 30 minutes.',
                    'instrucciones'           => "1. Bring a large pot of salted water to a boil and cook fettuccine until al dente. Reserve 1 cup of pasta water before draining.\n2. In a wide sauté pan, melt butter over medium-low heat.\n3. Add the heavy cream and let it simmer gently for 2 minutes.\n4. Stir in Parmesan until melted and smooth. Season with salt, white pepper and a pinch of nutmeg.\n5. Add the drained pasta and toss, adding pasta water a splash at a time to loosen the sauce.\n6. Serve immediately sprinkled with extra Parmesan and fresh parsley.",
                    'tiempo_preparacion'      => 30,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad'              => 'easy',
                    'porciones'               => 2,
                    'price'                   => '5.00',
                    'imagen_1'                => 'recipes/533agrsfqxqspdueyno58d9p.jpg',
                    'fecha_creacion'          => '2026-01-10',
                    'id_autor'                => 2,
                ],
                'categorias' => ['Pasta', 'Italian', 'Comfort Food'],
                'ingredientes' => [
                    ['nombre' => 'Fettuccine', 'cantidad' => 320, 'unidad' => 'g'],
                    ['nombre' => 'Butter', 'cantidad' => 60, 'unidad' => 'g'],
                    ['nombre' => 'Heavy cream', 'cantidad' => 200, 'unidad' => 'ml'],
                    ['nombre' => 'Parmesan cheese', 'cantidad' => 100, 'unidad' => 'g'],
                    ['nombre' => 'Fresh parsley', 'cantidad' => 10, 'unidad' => 'g'],
                ],
            ],

            // 2 · Spaghetti alla Puttanesca -> Marc (id_autor: 3)
            [
                'recipe' => [
                    'titulo'                  => 'Spaghetti alla Puttanesca',
                    'descripcion'             => 'A bold, punchy Neapolitan pasta packed with cherry tomatoes, black olives, capers, anchovies and fresh basil. Big Mediterranean flavours in just 25 minutes.',
                    'instrucciones'           => "1. Cook spaghetti in well-salted boiling water until al dente.\n2. Heat olive oil in a large pan over medium heat. Add anchovies and stir until dissolved.\n3. Add garlic and chilli flakes; cook 1 minute.\n4. Add crushed tomatoes and cherry tomatoes; simmer 10 minutes.\n5. Stir in black olives and capers; cook 3 more minutes.\n6. Drain pasta and toss with the sauce over high heat for 1 minute.\n7. Serve topped with fresh basil and grated Parmesan.",
                    'tiempo_preparacion'      => 25,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad'              => 'easy',
                    'porciones'               => 3,
                    'price'                   => '3.00',
                    'imagen_1'                => 'recipes/6cmp9eweoh4miwyk4vx76syk.jpg',
                    'fecha_creacion'          => '2026-01-15',
                    'id_autor'                => 3,
                ],
                'categorias' => ['Pasta', 'Italian', 'Mediterranean'],
                'ingredientes' => [
                    ['nombre' => 'Spaghetti', 'cantidad' => 300, 'unidad' => 'g'],
                    ['nombre' => 'Olive oil', 'cantidad' => 40, 'unidad' => 'ml'],
                    ['nombre' => 'Garlic', 'cantidad' => 15, 'unidad' => 'g'],
                    ['nombre' => 'Cherry tomatoes', 'cantidad' => 150, 'unidad' => 'g'],
                    ['nombre' => 'Black olives', 'cantidad' => 80, 'unidad' => 'g'],
                ],
            ],

            // 3 · Ultimate Smash Burger -> Pau (id_autor: 1)
            [
                'recipe' => [
                    'titulo'                  => 'Ultimate Smash Burger',
                    'descripcion'             => 'A crispy-edged smash burger stacked with melted cheddar, crispy bacon, creamy guacamole, fresh tomato and lettuce — all in a toasted brioche bun. Street-food at its finest.',
                    'instrucciones'           => "1. Make guacamole: mash avocado with lime juice, salt and a pinch of cumin.\n2. Cook bacon strips in a cast-iron skillet until crispy. Set aside.\n3. Divide beef into 150 g balls. Season with salt and pepper.\n4. Heat skillet over high heat until smoking. Add a beef ball and immediately smash flat with a spatula. Cook 2 minutes until edges are deeply browned.\n5. Flip, lay cheddar on top and cook 1 minute more.\n6. Toast brioche bun cut-side down in the same skillet for 30 seconds.\n7. Assemble: mayo on bottom bun, lettuce, tomato, onion, patty with cheddar, bacon, guacamole, top bun.",
                    'tiempo_preparacion'      => 20,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad'              => 'medium',
                    'porciones'               => 2,
                    'price'                   => '8.50',
                    'imagen_1'                => 'recipes/hjkdshgjksdflhgjklsd.jpg',
                    'fecha_creacion'          => '2026-02-01',
                    'id_autor'                => 1,
                ],
                'categorias' => ['Main Course', 'Street Food', 'Comfort Food'],
                'ingredientes' => [
                    ['nombre' => 'Ground beef (80/20)', 'cantidad' => 300, 'unidad' => 'g'],
                    ['nombre' => 'Brioche bun', 'cantidad' => 160, 'unidad' => 'g'],
                    ['nombre' => 'Cheddar cheese', 'cantidad' => 60, 'unidad' => 'g'],
                    ['nombre' => 'Bacon', 'cantidad' => 80, 'unidad' => 'g'],
                    ['nombre' => 'Avocado', 'cantidad' => 150, 'unidad' => 'g'],
                ],
            ],

            // 4 · Classic Spaghetti (Copy for Liqi) -> Liqi (id_autor: 2)
            [
                'recipe' => [
                    'titulo'                  => 'Classic Spaghetti',
                    'descripcion'             => 'A quick and easy re-interpretation of the classic puttanesca, tweaked for a richer flavor profile.',
                    'instrucciones'           => "1. Cook spaghetti until al dente.\n2. In a saucepan, heat olive oil and garlic. \n3. Add olives, tomatoes, and capers. Let it simmer.\n4. Mix with cooked pasta and serve hot with fresh cheese.",
                    'tiempo_preparacion'      => 30,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad'              => 'easy',
                    'porciones'               => 3,
                    'price'                   => '4.00',
                    'imagen_1'                => 'recipes/6cmp9eweoh4miwyk4vx76syk.jpg',
                    'fecha_creacion'          => '2026-02-10',
                    'id_autor'                => 2,
                ],
                'categorias' => ['Pasta', 'Italian', 'Mediterranean'],
                'ingredientes' => [
                    ['nombre' => 'Spaghetti', 'cantidad' => 350, 'unidad' => 'g'],
                    ['nombre' => 'Olive oil', 'cantidad' => 40, 'unidad' => 'ml'],
                    ['nombre' => 'Cherry tomatoes', 'cantidad' => 150, 'unidad' => 'g'],
                    ['nombre' => 'Black olives', 'cantidad' => 80, 'unidad' => 'g'],
                ],
            ],

            // 5 · Gourmet Smash Burger (Copy for Liqi) -> Liqi (id_autor: 2)
            [
                'recipe' => [
                    'titulo'                  => 'Gourmet Smash Burger',
                    'descripcion'             => 'The ultimate burger experience with melted cheddar, bacon, and a secret sauce. Guaranteed to be a crowd pleaser.',
                    'instrucciones'           => "1. Form beef balls and season.\n2. Smash onto a hot cast-iron skillet.\n3. Flip, add cheddar cheese, and cover to melt.\n4. Build the burger with bacon, tomatoes, and fresh lettuce.",
                    'tiempo_preparacion'      => 25,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad'              => 'hard',
                    'porciones'               => 4,
                    'price'                   => '12.00',
                    'imagen_1'                => 'recipes/hjkdshgjksdflhgjklsd.jpg',
                    'fecha_creacion'          => '2026-02-12',
                    'id_autor'                => 2,
                ],
                'categorias' => ['Main Course', 'Street Food'],
                'ingredientes' => [
                    ['nombre' => 'Ground beef (80/20)', 'cantidad' => 500, 'unidad' => 'g'],
                    ['nombre' => 'Brioche bun', 'cantidad' => 200, 'unidad' => 'g'],
                    ['nombre' => 'Cheddar cheese', 'cantidad' => 100, 'unidad' => 'g'],
                    ['nombre' => 'Bacon', 'cantidad' => 100, 'unidad' => 'g'],
                ],
            ],

            // 6 · Fettuccine Alfredo v2 (Copy/Repeat for Liqi) -> Liqi (id_autor: 2)
            [
                'recipe' => [
                    'titulo'                  => 'Creamy Fettuccine Alfredo',
                    'descripcion'             => 'Another variation of my favorite pasta! Extra creamy, extra Parmesan. Best served immediately.',
                    'instrucciones'           => "1. Boil fettuccine until al dente.\n2. Melt butter and cream in a pan.\n3. Toss pasta in sauce, adding Parmesan gradually until fully coated and thick.",
                    'tiempo_preparacion'      => 20,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad'              => 'medium',
                    'porciones'               => 2,
                    'price'                   => '5.50',
                    'imagen_1'                => 'recipes/533agrsfqxqspdueyno58d9p.jpg',
                    'fecha_creacion'          => '2026-02-15',
                    'id_autor'                => 2,
                ],
                'categorias' => ['Pasta', 'Comfort Food'],
                'ingredientes' => [
                    ['nombre' => 'Fettuccine', 'cantidad' => 300, 'unidad' => 'g'],
                    ['nombre' => 'Heavy cream', 'cantidad' => 250, 'unidad' => 'ml'],
                    ['nombre' => 'Parmesan cheese', 'cantidad' => 150, 'unidad' => 'g'],
                ],
            ],
        ];

        // ── Insert each recipe ────────────────────────────────────────────
        $recetaIds = [];

        foreach ($recipes as $index => $entry) {
            $recipeData = $entry['recipe'];

            $recipeData += [
                'imagen_2' => null,
                'imagen_3' => null,
                'imagen_4' => null,
                'imagen_5' => null,
            ];

            $recetaId = DB::table('receta_original')->insertGetId($recipeData);
            $recetaIds[$index + 1] = $recetaId; // map 1-based index to DB ID

            // Categories
            $categoriaRows = [];
            foreach ($entry['categorias'] as $catName) {
                $catId = $cat($catName);
                if ($catId) {
                    $categoriaRows[] = ['id_receta' => $recetaId, 'id_categoria' => $catId];
                }
            }
            if ($categoriaRows) {
                DB::table('receta_categoria')->insert($categoriaRows);
            }

            // Ingredients
            $ingredientRows = [];
            foreach ($entry['ingredientes'] as $ing) {
                $ingId = $resolveIngredient($ing['nombre']);
                $ingredientRows[] = [
                    'id_receta'     => $recetaId,
                    'id_ingrediente' => $ingId,
                    'cantidad'      => $ing['cantidad'],
                    'unidad'        => $ing['unidad'],
                ];
            }
            if ($ingredientRows) {
                DB::table('receta_ingrediente')->insert($ingredientRows);
            }
        }

        // ── Reviews (Valoraciones) ─────────────────────────────────────────
        // Assuming user IDs: Pau=1, Liqi=2, Marc=3

        $reviews = [
            // Fettuccine Alfredo (Recipe 1, Author: Liqi)
            [
                'id_receta' => $recetaIds[1],
                'id_usuario' => 1, // Pau
                'puntuacion' => 5,
                'comentario' => 'Amazing! Will cook again.',
                'fecha' => now(),
            ],
            [
                'id_receta' => $recetaIds[1],
                'id_usuario' => 3, // Marc
                'puntuacion' => 4,
                'comentario' => 'A bit heavy, but very tasty cream sauce.',
                'fecha' => now(),
            ],

            // Spaghetti alla Puttanesca (Recipe 2, Author: Marc)
            [
                'id_receta' => $recetaIds[2],
                'id_usuario' => 2, // Liqi
                'puntuacion' => 5,
                'comentario' => 'Incredible flavors. The olives give it such a great punch.',
                'fecha' => now(),
            ],

            // Ultimate Smash Burger (Recipe 3, Author: Pau)
            [
                'id_receta' => $recetaIds[3],
                'id_usuario' => 2, // Liqi
                'puntuacion' => 4,
                'comentario' => 'Great burger, though I prefer more cheddar.',
                'fecha' => now(),
            ],
            [
                'id_receta' => $recetaIds[3],
                'id_usuario' => 3, // Marc
                'puntuacion' => 5,
                'comentario' => 'Best smash burger recipe out there.',
                'fecha' => now(),
            ],

            // Gourmet Smash Burger (Recipe 5, Author: Liqi)
            [
                'id_receta' => $recetaIds[5],
                'id_usuario' => 1, // Pau
                'puntuacion' => 3,
                'comentario' => 'It was okay. Took a while to prep.',
                'fecha' => now(),
            ],
        ];

        DB::table('valoracion')->insert($reviews);
    }
}
