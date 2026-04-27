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
                    'imagen_2'                => 'recipes/533agrsfqxqspdueyno58d9p.jpg',
                    'imagen_3'                => 'recipes/asdasjfghwuiegfuighjaskfhkj.jpg',
                    'imagen_4'                => 'recipes/asdasjfghwuiegfuighjaskfhkj.jpg',
                    'imagen_5'                => 'recipes/asdasjfghwuiegfuighjaskfhkj.jpg',
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
                    'imagen_1'                => 'recipes/Classic Spaghetti.webp',
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
                    'imagen_1'                => 'recipes/Gourmet Smash Burger.webp',
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
                    'imagen_1'                => 'recipes/Classic Spaghetti.webp',
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
                    'imagen_1'                => 'recipes/Gourmet Smash Burger.webp',
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
                    'imagen_1'                => 'recipes/Creamy Fettuccine Alfredo.webp',
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

            // 7 · Lemon Herb Roast Chicken -> Marc (id_autor: 3)
            [
                'recipe' => [
                    'titulo'                  => 'Lemon Herb Roast Chicken',
                    'descripcion'             => 'Juicy roast chicken perfumed with lemon, garlic and rosemary, served with crispy golden potatoes. A classic family-style main course with fresh, bright flavour.',
                    'instrucciones'           => "1. Pat the chicken dry and rub with olive oil, salt, pepper, minced garlic, lemon zest and chopped rosemary.\n2. Stuff the cavity with half a lemon and a few rosemary sprigs.\n3. Toss baby potatoes with olive oil, salt and pepper, then spread them in a roasting tray.\n4. Place the chicken on top and roast at 200 C for 55 to 65 minutes, basting once halfway through.\n5. Rest the chicken for 10 minutes before carving and serving with the roasted potatoes and pan juices.",
                    'tiempo_preparacion'      => 75,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad'              => 'medium',
                    'porciones'               => 4,
                    'price'                   => '11.50',
                    'imagen_1'                => 'recipes/Lemon Herb Roast Chicken.webp',
                    'fecha_creacion'          => '2026-02-18',
                    'id_autor'                => 3,
                ],
                'categorias' => ['Main Course', 'Poultry', 'Comfort Food'],
                'ingredientes' => [
                    ['nombre' => 'Whole chicken', 'cantidad' => 1500, 'unidad' => 'g'],
                    ['nombre' => 'Baby potatoes', 'cantidad' => 700, 'unidad' => 'g'],
                    ['nombre' => 'Lemon', 'cantidad' => 2, 'unidad' => 'unit'],
                    ['nombre' => 'Garlic', 'cantidad' => 20, 'unidad' => 'g'],
                    ['nombre' => 'Fresh rosemary', 'cantidad' => 12, 'unidad' => 'g'],
                ],
            ],

            // 8 · Thai Coconut Shrimp Curry -> Pau (id_autor: 1)
            [
                'recipe' => [
                    'titulo'                  => 'Thai Coconut Shrimp Curry',
                    'descripcion'             => 'A fragrant coconut curry with shrimp, bell peppers and a silky red curry broth. Fast, vibrant and perfect for a weeknight dinner.',
                    'instrucciones'           => "1. Heat oil in a saucepan and cook red curry paste for 1 minute until aromatic.\n2. Stir in coconut milk and fish sauce, then bring to a gentle simmer.\n3. Add sliced bell peppers and cook for 4 minutes.\n4. Add shrimp and cook for 3 to 4 minutes until pink and just tender.\n5. Finish with lime juice, fresh basil and a pinch of brown sugar if needed.\n6. Serve with steamed jasmine rice.",
                    'tiempo_preparacion'      => 25,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad'              => 'medium',
                    'porciones'               => 3,
                    'price'                   => '9.80',
                    'imagen_1'                => 'recipes/Thai Coconut Shrimp Curry.webp',
                    'fecha_creacion'          => '2026-02-20',
                    'id_autor'                => 1,
                ],
                'categorias' => ['Seafood', 'Thai', 'One-Pot Meals'],
                'ingredientes' => [
                    ['nombre' => 'Shrimp', 'cantidad' => 350, 'unidad' => 'g'],
                    ['nombre' => 'Coconut milk', 'cantidad' => 400, 'unidad' => 'ml'],
                    ['nombre' => 'Red curry paste', 'cantidad' => 35, 'unidad' => 'g'],
                    ['nombre' => 'Red bell pepper', 'cantidad' => 180, 'unidad' => 'g'],
                    ['nombre' => 'Jasmine rice', 'cantidad' => 240, 'unidad' => 'g'],
                ],
            ],

            // 9 · Wild Mushroom Risotto -> Liqi (id_autor: 2)
            [
                'recipe' => [
                    'titulo'                  => 'Wild Mushroom Risotto',
                    'descripcion'             => 'Creamy arborio rice with sauteed mushrooms, white wine and Parmesan. Rich and comforting, with a deep savoury finish.',
                    'instrucciones'           => "1. Warm the stock in a separate pot and keep it at a gentle simmer.\n2. Saute mushrooms in olive oil and butter until browned, then set aside half for garnish.\n3. In the same pan cook shallot until soft, add arborio rice and toast for 1 minute.\n4. Deglaze with white wine and stir until absorbed.\n5. Add hot stock one ladle at a time, stirring often, until the rice is creamy and al dente.\n6. Fold in Parmesan, butter and the mushrooms, then serve immediately.",
                    'tiempo_preparacion'      => 40,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad'              => 'medium',
                    'porciones'               => 4,
                    'price'                   => '7.40',
                    'imagen_1'                => 'recipes/Wild Mushroom Risotto.webp',
                    'fecha_creacion'          => '2026-02-23',
                    'id_autor'                => 2,
                ],
                'categorias' => ['Rice & Grains', 'Vegetarian', 'Comfort Food'],
                'ingredientes' => [
                    ['nombre' => 'Arborio rice', 'cantidad' => 320, 'unidad' => 'g'],
                    ['nombre' => 'Mixed mushrooms', 'cantidad' => 400, 'unidad' => 'g'],
                    ['nombre' => 'Vegetable stock', 'cantidad' => 1200, 'unidad' => 'ml'],
                    ['nombre' => 'Parmesan cheese', 'cantidad' => 80, 'unidad' => 'g'],
                    ['nombre' => 'Shallot', 'cantidad' => 60, 'unidad' => 'g'],
                ],
            ],

            // 10 · Shakshuka Skillet -> Pau (id_autor: 1)
            [
                'recipe' => [
                    'titulo'                  => 'Shakshuka Skillet',
                    'descripcion'             => 'Eggs gently poached in a smoky tomato and pepper sauce with cumin and paprika. A brilliant brunch dish that is also great for a light dinner.',
                    'instrucciones'           => "1. Cook onion and sliced peppers in olive oil until softened.\n2. Add garlic, paprika and cumin, then stir for 30 seconds.\n3. Add crushed tomatoes and simmer until thickened slightly.\n4. Make small wells in the sauce and crack in the eggs.\n5. Cover and cook until the whites are just set and the yolks remain runny.\n6. Finish with parsley and serve with crusty bread.",
                    'tiempo_preparacion'      => 22,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad'              => 'easy',
                    'porciones'               => 2,
                    'price'                   => '4.90',
                    'imagen_1'                => 'recipes/Shakshuka Skillet.webp',
                    'fecha_creacion'          => '2026-02-25',
                    'id_autor'                => 1,
                ],
                'categorias' => ['Breakfast', 'Mediterranean', 'Vegetarian'],
                'ingredientes' => [
                    ['nombre' => 'Eggs', 'cantidad' => 4, 'unidad' => 'unit'],
                    ['nombre' => 'Crushed tomatoes', 'cantidad' => 400, 'unidad' => 'g'],
                    ['nombre' => 'Red bell pepper', 'cantidad' => 160, 'unidad' => 'g'],
                    ['nombre' => 'Onion', 'cantidad' => 120, 'unidad' => 'g'],
                    ['nombre' => 'Paprika', 'cantidad' => 8, 'unidad' => 'g'],
                ],
            ],

            // 11 · Chocolate Lava Cake -> Marc (id_autor: 3)
            [
                'recipe' => [
                    'titulo'                  => 'Chocolate Lava Cake',
                    'descripcion'             => 'A rich individual chocolate cake with a molten centre and a crisp edge. Elegant enough for dinner parties but simple to prepare ahead.',
                    'instrucciones'           => "1. Melt dark chocolate and butter together over a bain-marie.\n2. Whisk eggs, egg yolks and sugar until pale and slightly thick.\n3. Fold in the melted chocolate mixture, then sift in flour and a pinch of salt.\n4. Divide into buttered ramekins and chill for 15 minutes.\n5. Bake at 220 C for 9 to 10 minutes until the edges are set and the centre stays soft.\n6. Rest for 1 minute, unmould and serve immediately.",
                    'tiempo_preparacion'      => 20,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad'              => 'medium',
                    'porciones'               => 4,
                    'price'                   => '6.20',
                    'imagen_1'                => 'recipes/Chocolate Lava Cake.webp',
                    'fecha_creacion'          => '2026-02-28',
                    'id_autor'                => 3,
                ],
                'categorias' => ['Baking & Desserts', 'French', 'Comfort Food'],
                'ingredientes' => [
                    ['nombre' => 'Dark chocolate', 'cantidad' => 180, 'unidad' => 'g'],
                    ['nombre' => 'Butter', 'cantidad' => 120, 'unidad' => 'g'],
                    ['nombre' => 'Eggs', 'cantidad' => 2, 'unidad' => 'unit'],
                    ['nombre' => 'Egg yolks', 'cantidad' => 2, 'unidad' => 'unit'],
                    ['nombre' => 'Sugar', 'cantidad' => 90, 'unidad' => 'g'],
                ],
            ],

            // 12 · Vegan Buddha Bowl -> Liqi (id_autor: 2)
            [
                'recipe' => [
                    'titulo'                  => 'Vegan Buddha Bowl',
                    'descripcion'             => 'A colourful bowl packed with quinoa, roasted chickpeas, avocado, crunchy vegetables and a creamy tahini dressing. Nutritious, fresh and meal-prep friendly.',
                    'instrucciones'           => "1. Cook quinoa according to package instructions and let it cool slightly.\n2. Roast chickpeas with olive oil, smoked paprika and salt until crisp.\n3. Slice avocado, cucumber and carrots, then shred red cabbage.\n4. Whisk tahini, lemon juice, maple syrup and water into a pourable dressing.\n5. Assemble the bowl with quinoa, vegetables, chickpeas and avocado.\n6. Drizzle with dressing and finish with sesame seeds.",
                    'tiempo_preparacion'      => 30,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad'              => 'easy',
                    'porciones'               => 2,
                    'price'                   => '5.80',
                    'imagen_1'                => 'recipes/Vegan Buddha Bowl.webp',
                    'fecha_creacion'          => '2026-03-03',
                    'id_autor'                => 2,
                ],
                'categorias' => ['Vegan', 'Healthy & Low-Calorie', 'Meal Prep & Storage'],
                'ingredientes' => [
                    ['nombre' => 'Quinoa', 'cantidad' => 180, 'unidad' => 'g'],
                    ['nombre' => 'Chickpeas', 'cantidad' => 240, 'unidad' => 'g'],
                    ['nombre' => 'Avocado', 'cantidad' => 1, 'unidad' => 'unit'],
                    ['nombre' => 'Red cabbage', 'cantidad' => 120, 'unidad' => 'g'],
                    ['nombre' => 'Tahini', 'cantidad' => 45, 'unidad' => 'g'],
                ],
            ],

            // 13 · Spanish Seafood Paella -> Pau (id_autor: 1)
            [
                'recipe' => [
                    'titulo'                  => 'Spanish Seafood Paella',
                    'descripcion'             => 'Saffron rice loaded with mussels, shrimp and squid, cooked in one pan for a festive Spanish-style meal full of deep seafood flavour.',
                    'instrucciones'           => "1. Saute onion, garlic and grated tomato in olive oil until the mixture turns jammy.\n2. Add paprika, saffron and rice, stirring to coat every grain.\n3. Pour in hot fish stock and spread the rice evenly without stirring further.\n4. Arrange squid, shrimp and mussels on top.\n5. Simmer until the rice is tender and most of the liquid is absorbed.\n6. Rest the paella for 5 minutes, then finish with lemon wedges and parsley.",
                    'tiempo_preparacion'      => 45,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad'              => 'hard',
                    'porciones'               => 4,
                    'price'                   => '13.90',
                    'imagen_1'                => 'recipes/Spanish Seafood Paella.webp',
                    'fecha_creacion'          => '2026-03-06',
                    'id_autor'                => 1,
                ],
                'categorias' => ['Spanish', 'Seafood', 'Rice & Grains'],
                'ingredientes' => [
                    ['nombre' => 'Bomba rice', 'cantidad' => 320, 'unidad' => 'g'],
                    ['nombre' => 'Shrimp', 'cantidad' => 220, 'unidad' => 'g'],
                    ['nombre' => 'Mussels', 'cantidad' => 400, 'unidad' => 'g'],
                    ['nombre' => 'Squid', 'cantidad' => 180, 'unidad' => 'g'],
                    ['nombre' => 'Fish stock', 'cantidad' => 900, 'unidad' => 'ml'],
                ],
            ],

            // 14 · Creamy Pumpkin Soup -> Marc (id_autor: 3)
            [
                'recipe' => [
                    'titulo'                  => 'Creamy Pumpkin Soup',
                    'descripcion'             => 'Velvety pumpkin soup with onion, carrot and a touch of cream. Smooth, comforting and perfect for cooler evenings.',
                    'instrucciones'           => "1. Saute onion and carrot in olive oil until softened.\n2. Add pumpkin cubes, season with salt, pepper and a pinch of nutmeg.\n3. Pour in vegetable stock and simmer until the pumpkin is completely tender.\n4. Blend until smooth and return to the pot.\n5. Stir in cream and adjust seasoning.\n6. Serve with toasted seeds and a drizzle of olive oil.",
                    'tiempo_preparacion'      => 35,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad'              => 'easy',
                    'porciones'               => 4,
                    'price'                   => '4.60',
                    'imagen_1'                => 'recipes/Creamy Pumpkin Soup.webp',
                    'fecha_creacion'          => '2026-03-09',
                    'id_autor'                => 3,
                ],
                'categorias' => ['Soups', 'Vegetarian', 'Comfort Food'],
                'ingredientes' => [
                    ['nombre' => 'Pumpkin', 'cantidad' => 900, 'unidad' => 'g'],
                    ['nombre' => 'Onion', 'cantidad' => 120, 'unidad' => 'g'],
                    ['nombre' => 'Carrot', 'cantidad' => 120, 'unidad' => 'g'],
                    ['nombre' => 'Vegetable stock', 'cantidad' => 800, 'unidad' => 'ml'],
                    ['nombre' => 'Cooking cream', 'cantidad' => 120, 'unidad' => 'ml'],
                ],
            ],

            // 15 · Chicken Tacos with Lime Slaw -> Pau (id_autor: 1)
            [
                'recipe' => [
                    'titulo'                  => 'Chicken Tacos with Lime Slaw',
                    'descripcion'             => 'Juicy spiced chicken tucked into warm tortillas with crunchy lime slaw and a cooling yogurt sauce. Fresh, punchy and easy to share.',
                    'instrucciones'           => "1. Season chicken thighs with cumin, paprika, garlic powder, salt and olive oil.\n2. Sear in a hot pan until browned and cooked through, then slice.\n3. Toss shredded cabbage with lime juice, coriander and a pinch of salt.\n4. Stir yogurt with lime zest and a little hot sauce.\n5. Warm tortillas in a dry pan.\n6. Fill with chicken, slaw and yogurt sauce, then serve immediately.",
                    'tiempo_preparacion'      => 28,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad'              => 'easy',
                    'porciones'               => 3,
                    'price'                   => '7.90',
                    'imagen_1'                => 'recipes/Chicken Tacos with Lime Slaw.webp',
                    'fecha_creacion'          => '2026-03-12',
                    'id_autor'                => 1,
                ],
                'categorias' => ['Mexican', 'Street Food', 'Poultry'],
                'ingredientes' => [
                    ['nombre' => 'Chicken thighs', 'cantidad' => 450, 'unidad' => 'g'],
                    ['nombre' => 'Corn tortillas', 'cantidad' => 9, 'unidad' => 'unit'],
                    ['nombre' => 'White cabbage', 'cantidad' => 180, 'unidad' => 'g'],
                    ['nombre' => 'Greek yogurt', 'cantidad' => 120, 'unidad' => 'g'],
                    ['nombre' => 'Lime', 'cantidad' => 2, 'unidad' => 'unit'],
                ],
            ],

            // 16 · Teriyaki Salmon Rice Bowl -> Liqi (id_autor: 2)
            [
                'recipe' => [
                    'titulo'                  => 'Teriyaki Salmon Rice Bowl',
                    'descripcion'             => 'Glazed salmon served over fluffy rice with steamed broccoli and cucumber. Balanced, colourful and ideal for a fast nourishing dinner.',
                    'instrucciones'           => "1. Mix soy sauce, honey, ginger and garlic to make a quick teriyaki glaze.\n2. Brush salmon fillets with the glaze and bake at 210 C for 10 to 12 minutes.\n3. Steam broccoli until just tender and slice the cucumber.\n4. Cook rice and divide between bowls.\n5. Top with salmon, broccoli and cucumber, then spoon over any remaining glaze.\n6. Finish with sesame seeds and spring onion.",
                    'tiempo_preparacion'      => 30,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad'              => 'easy',
                    'porciones'               => 2,
                    'price'                   => '10.20',
                    'imagen_1'                => 'recipes/Teriyaki Salmon Rice Bowl.webp',
                    'fecha_creacion'          => '2026-03-15',
                    'id_autor'                => 2,
                ],
                'categorias' => ['Japanese', 'Seafood', 'Healthy & Low-Calorie'],
                'ingredientes' => [
                    ['nombre' => 'Salmon fillet', 'cantidad' => 320, 'unidad' => 'g'],
                    ['nombre' => 'White rice', 'cantidad' => 200, 'unidad' => 'g'],
                    ['nombre' => 'Broccoli', 'cantidad' => 220, 'unidad' => 'g'],
                    ['nombre' => 'Soy sauce', 'cantidad' => 45, 'unidad' => 'ml'],
                    ['nombre' => 'Honey', 'cantidad' => 25, 'unidad' => 'g'],
                ],
            ],

            // 17 · Margherita Flatbread -> Pau (id_autor: 1)
            [
                'recipe' => [
                    'titulo' => 'Margherita Flatbread',
                    'descripcion' => 'A crisp flatbread layered with tomato sauce, mozzarella and basil for a fast pizza-style dinner with clean Italian flavour.',
                    'instrucciones' => "1. Preheat the oven with a tray inside until very hot.\n2. Spread tomato sauce over the flatbread, leaving a small border.\n3. Scatter torn mozzarella evenly over the top.\n4. Bake for 8 to 10 minutes until crisp and bubbly.\n5. Finish with fresh basil, olive oil and black pepper before slicing.",
                    'tiempo_preparacion' => 18,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad' => 'easy',
                    'porciones' => 2,
                    'price' => '4.70',
                    'imagen_1' => 'recipes/Margherita Flatbread.webp',
                    'fecha_creacion' => '2026-03-16',
                    'id_autor' => 1,
                ],
                'categorias' => ['Italian', 'Vegetarian', 'Main Course'],
                'ingredientes' => [
                    ['nombre' => 'Flatbread', 'cantidad' => 2, 'unidad' => 'unit'],
                    ['nombre' => 'Tomato sauce', 'cantidad' => 140, 'unidad' => 'g'],
                    ['nombre' => 'Mozzarella', 'cantidad' => 180, 'unidad' => 'g'],
                    ['nombre' => 'Fresh basil', 'cantidad' => 12, 'unidad' => 'g'],
                    ['nombre' => 'Olive oil', 'cantidad' => 15, 'unidad' => 'ml'],
                ],
            ],

            // 18 · Butter Chicken -> Marc (id_autor: 3)
            [
                'recipe' => [
                    'titulo' => 'Butter Chicken',
                    'descripcion' => 'Tender chicken simmered in a creamy spiced tomato sauce. Rich, warming and ideal with fluffy rice or naan.',
                    'instrucciones' => "1. Marinate chicken with yogurt, garlic, ginger and garam masala.\n2. Sear the chicken until lightly browned and set aside.\n3. Cook onion, tomato puree and butter until thick and aromatic.\n4. Add cream and a splash of water to form the sauce.\n5. Return the chicken to the pan and simmer until fully cooked.\n6. Finish with coriander and serve hot.",
                    'tiempo_preparacion' => 40,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad' => 'medium',
                    'porciones' => 4,
                    'price' => '8.60',
                    'imagen_1' => 'recipes/Butter Chicken.webp',
                    'fecha_creacion' => '2026-03-17',
                    'id_autor' => 3,
                ],
                'categorias' => ['Indian', 'Poultry', 'Comfort Food'],
                'ingredientes' => [
                    ['nombre' => 'Chicken breast', 'cantidad' => 600, 'unidad' => 'g'],
                    ['nombre' => 'Greek yogurt', 'cantidad' => 120, 'unidad' => 'g'],
                    ['nombre' => 'Tomato puree', 'cantidad' => 250, 'unidad' => 'g'],
                    ['nombre' => 'Cooking cream', 'cantidad' => 180, 'unidad' => 'ml'],
                    ['nombre' => 'Garam masala', 'cantidad' => 12, 'unidad' => 'g'],
                ],
            ],

            // 19 · Greek Chicken Salad -> Liqi (id_autor: 2)
            [
                'recipe' => [
                    'titulo' => 'Greek Chicken Salad',
                    'descripcion' => 'A bright salad with grilled chicken, cucumber, tomato, olives and feta, dressed with lemon and oregano.',
                    'instrucciones' => "1. Season chicken and grill until golden on both sides.\n2. Slice cucumber, tomatoes and red onion into a large bowl.\n3. Add olives and crumbled feta.\n4. Slice the chicken and place it over the salad.\n5. Dress with olive oil, lemon juice and oregano just before serving.",
                    'tiempo_preparacion' => 24,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad' => 'easy',
                    'porciones' => 2,
                    'price' => '6.40',
                    'imagen_1' => 'recipes/Greek Chicken Salad.webp',
                    'fecha_creacion' => '2026-03-18',
                    'id_autor' => 2,
                ],
                'categorias' => ['Mediterranean', 'Healthy & Low-Calorie', 'Poultry'],
                'ingredientes' => [
                    ['nombre' => 'Chicken breast', 'cantidad' => 300, 'unidad' => 'g'],
                    ['nombre' => 'Cucumber', 'cantidad' => 180, 'unidad' => 'g'],
                    ['nombre' => 'Tomatoes', 'cantidad' => 220, 'unidad' => 'g'],
                    ['nombre' => 'Feta cheese', 'cantidad' => 80, 'unidad' => 'g'],
                    ['nombre' => 'Black olives', 'cantidad' => 70, 'unidad' => 'g'],
                ],
            ],

            // 20 · Beef Pho Express -> Pau (id_autor: 1)
            [
                'recipe' => [
                    'titulo' => 'Beef Pho Express',
                    'descripcion' => 'A fast take on pho with fragrant broth, rice noodles and thinly sliced beef finished with herbs and lime.',
                    'instrucciones' => "1. Simmer beef stock with ginger, garlic and star anise for 15 minutes.\n2. Cook rice noodles separately until tender.\n3. Strain the broth and season with soy sauce and a little fish sauce.\n4. Divide noodles between bowls and top with sliced beef.\n5. Pour over the hot broth so the beef cooks gently.\n6. Finish with herbs, spring onion and lime.",
                    'tiempo_preparacion' => 30,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad' => 'medium',
                    'porciones' => 3,
                    'price' => '8.20',
                    'imagen_1' => 'recipes/Beef Pho Express.webp',
                    'fecha_creacion' => '2026-03-19',
                    'id_autor' => 1,
                ],
                'categorias' => ['Vietnamese', 'Soups', 'Main Course'],
                'ingredientes' => [
                    ['nombre' => 'Beef stock', 'cantidad' => 1200, 'unidad' => 'ml'],
                    ['nombre' => 'Rice noodles', 'cantidad' => 220, 'unidad' => 'g'],
                    ['nombre' => 'Beef sirloin', 'cantidad' => 250, 'unidad' => 'g'],
                    ['nombre' => 'Fresh ginger', 'cantidad' => 20, 'unidad' => 'g'],
                    ['nombre' => 'Lime', 'cantidad' => 1, 'unidad' => 'unit'],
                ],
            ],

            // 21 · Kimchi Fried Rice -> Marc (id_autor: 3)
            [
                'recipe' => [
                    'titulo' => 'Kimchi Fried Rice',
                    'descripcion' => 'Spicy, savoury fried rice with kimchi and egg. Great for using leftover rice and ready in a flash.',
                    'instrucciones' => "1. Heat oil and cook chopped kimchi until fragrant.\n2. Add cold rice and stir-fry until heated through.\n3. Season with soy sauce and a little sesame oil.\n4. Fry eggs in a separate pan.\n5. Serve the rice topped with eggs and spring onion.",
                    'tiempo_preparacion' => 15,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad' => 'easy',
                    'porciones' => 2,
                    'price' => '4.20',
                    'imagen_1' => 'recipes/Kimchi Fried Rice.webp',
                    'fecha_creacion' => '2026-03-20',
                    'id_autor' => 3,
                ],
                'categorias' => ['Korean', 'Rice & Grains', 'One-Pot Meals'],
                'ingredientes' => [
                    ['nombre' => 'Cooked rice', 'cantidad' => 350, 'unidad' => 'g'],
                    ['nombre' => 'Kimchi', 'cantidad' => 160, 'unidad' => 'g'],
                    ['nombre' => 'Eggs', 'cantidad' => 2, 'unidad' => 'unit'],
                    ['nombre' => 'Soy sauce', 'cantidad' => 20, 'unidad' => 'ml'],
                    ['nombre' => 'Spring onion', 'cantidad' => 20, 'unidad' => 'g'],
                ],
            ],

            // 22 · Baked Cod with Herbs -> Liqi (id_autor: 2)
            [
                'recipe' => [
                    'titulo' => 'Baked Cod with Herbs',
                    'descripcion' => 'Flaky cod baked with lemon, parsley and garlic, served with a light pan sauce.',
                    'instrucciones' => "1. Place cod fillets in a baking dish and season well.\n2. Top with garlic, lemon slices and chopped parsley.\n3. Drizzle with olive oil and add a splash of white wine.\n4. Bake until the fish flakes easily.\n5. Spoon over the cooking juices and serve immediately.",
                    'tiempo_preparacion' => 22,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad' => 'easy',
                    'porciones' => 2,
                    'price' => '9.10',
                    'imagen_1' => 'recipes/Baked Cod with Herbs.webp',
                    'fecha_creacion' => '2026-03-21',
                    'id_autor' => 2,
                ],
                'categorias' => ['Seafood', 'Mediterranean', 'Healthy & Low-Calorie'],
                'ingredientes' => [
                    ['nombre' => 'Cod fillet', 'cantidad' => 320, 'unidad' => 'g'],
                    ['nombre' => 'Lemon', 'cantidad' => 1, 'unidad' => 'unit'],
                    ['nombre' => 'Garlic', 'cantidad' => 10, 'unidad' => 'g'],
                    ['nombre' => 'Fresh parsley', 'cantidad' => 12, 'unidad' => 'g'],
                    ['nombre' => 'White wine', 'cantidad' => 70, 'unidad' => 'ml'],
                ],
            ],

            // 23 · Spinach Ricotta Cannelloni -> Pau (id_autor: 1)
            [
                'recipe' => [
                    'titulo' => 'Spinach Ricotta Cannelloni',
                    'descripcion' => 'Pasta tubes filled with spinach and ricotta, baked in tomato sauce with bubbling cheese on top.',
                    'instrucciones' => "1. Mix ricotta, chopped spinach, nutmeg and Parmesan.\n2. Fill cannelloni tubes with the mixture.\n3. Spread tomato sauce in a baking dish and arrange the filled pasta on top.\n4. Cover with more sauce and mozzarella.\n5. Bake until tender and golden on the surface.\n6. Rest briefly before serving.",
                    'tiempo_preparacion' => 50,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad' => 'medium',
                    'porciones' => 4,
                    'price' => '6.90',
                    'imagen_1' => 'recipes/Spinach Ricotta Cannelloni.webp',
                    'fecha_creacion' => '2026-03-22',
                    'id_autor' => 1,
                ],
                'categorias' => ['Pasta', 'Vegetarian', 'Italian'],
                'ingredientes' => [
                    ['nombre' => 'Cannelloni', 'cantidad' => 250, 'unidad' => 'g'],
                    ['nombre' => 'Ricotta', 'cantidad' => 250, 'unidad' => 'g'],
                    ['nombre' => 'Spinach', 'cantidad' => 220, 'unidad' => 'g'],
                    ['nombre' => 'Tomato sauce', 'cantidad' => 450, 'unidad' => 'g'],
                    ['nombre' => 'Mozzarella', 'cantidad' => 150, 'unidad' => 'g'],
                ],
            ],

            // 24 · Falafel Pita Pocket -> Marc (id_autor: 3)
            [
                'recipe' => [
                    'titulo' => 'Falafel Pita Pocket',
                    'descripcion' => 'Crispy falafel tucked into warm pita with lettuce, tomato and a lemony yogurt sauce.',
                    'instrucciones' => "1. Blend chickpeas with onion, garlic, parsley and spices.\n2. Shape into small balls and fry until crisp and deep golden.\n3. Mix yogurt with lemon juice and salt.\n4. Warm the pita breads and open them carefully.\n5. Fill with lettuce, tomato, falafel and sauce.",
                    'tiempo_preparacion' => 35,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad' => 'medium',
                    'porciones' => 3,
                    'price' => '5.60',
                    'imagen_1' => 'recipes/Falafel Pita Pocket.webp',
                    'fecha_creacion' => '2026-03-23',
                    'id_autor' => 3,
                ],
                'categorias' => ['Middle Eastern', 'Street Food', 'Vegetarian'],
                'ingredientes' => [
                    ['nombre' => 'Chickpeas', 'cantidad' => 400, 'unidad' => 'g'],
                    ['nombre' => 'Pita bread', 'cantidad' => 3, 'unidad' => 'unit'],
                    ['nombre' => 'Greek yogurt', 'cantidad' => 120, 'unidad' => 'g'],
                    ['nombre' => 'Tomatoes', 'cantidad' => 150, 'unidad' => 'g'],
                    ['nombre' => 'Fresh parsley', 'cantidad' => 18, 'unidad' => 'g'],
                ],
            ],

            // 25 · Mango Sticky Rice -> Liqi (id_autor: 2)
            [
                'recipe' => [
                    'titulo' => 'Mango Sticky Rice',
                    'descripcion' => 'Sweet coconut sticky rice served with ripe mango. A simple Thai-inspired dessert with a creamy finish.',
                    'instrucciones' => "1. Cook sticky rice until soft and tender.\n2. Warm coconut milk with sugar and a pinch of salt.\n3. Stir part of the coconut mixture into the hot rice and let it absorb.\n4. Slice the mango neatly.\n5. Serve the rice with mango and spoon over the remaining coconut sauce.",
                    'tiempo_preparacion' => 30,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad' => 'easy',
                    'porciones' => 2,
                    'price' => '4.80',
                    'imagen_1' => 'recipes/Mango Sticky Rice.webp',
                    'fecha_creacion' => '2026-03-24',
                    'id_autor' => 2,
                ],
                'categorias' => ['Thai', 'Baking & Desserts', 'Vegetarian'],
                'ingredientes' => [
                    ['nombre' => 'Sticky rice', 'cantidad' => 180, 'unidad' => 'g'],
                    ['nombre' => 'Coconut milk', 'cantidad' => 250, 'unidad' => 'ml'],
                    ['nombre' => 'Mango', 'cantidad' => 2, 'unidad' => 'unit'],
                    ['nombre' => 'Sugar', 'cantidad' => 50, 'unidad' => 'g'],
                    ['nombre' => 'Salt', 'cantidad' => 2, 'unidad' => 'g'],
                ],
            ],

            // 26 · BBQ Pulled Pork Sliders -> Pau (id_autor: 1)
            [
                'recipe' => [
                    'titulo' => 'BBQ Pulled Pork Sliders',
                    'descripcion' => 'Soft buns filled with tender pulled pork, tangy slaw and barbecue sauce.',
                    'instrucciones' => "1. Season pork and cook slowly until tender enough to shred.\n2. Pull the meat apart with two forks.\n3. Toss the pork with barbecue sauce in a pan.\n4. Mix cabbage with a light dressing for a crisp slaw.\n5. Fill slider buns with pork and slaw, then serve warm.",
                    'tiempo_preparacion' => 90,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad' => 'medium',
                    'porciones' => 4,
                    'price' => '9.70',
                    'imagen_1' => 'recipes/BBQ Pulled Pork Sliders.webp',
                    'fecha_creacion' => '2026-03-25',
                    'id_autor' => 1,
                ],
                'categorias' => ['Grilling & BBQ', 'Street Food', 'Comfort Food'],
                'ingredientes' => [
                    ['nombre' => 'Pork shoulder', 'cantidad' => 900, 'unidad' => 'g'],
                    ['nombre' => 'BBQ sauce', 'cantidad' => 180, 'unidad' => 'g'],
                    ['nombre' => 'Slider buns', 'cantidad' => 8, 'unidad' => 'unit'],
                    ['nombre' => 'White cabbage', 'cantidad' => 180, 'unidad' => 'g'],
                    ['nombre' => 'Apple cider vinegar', 'cantidad' => 25, 'unidad' => 'ml'],
                ],
            ],

            // 27 · Lentil Coconut Dal -> Marc (id_autor: 3)
            [
                'recipe' => [
                    'titulo' => 'Lentil Coconut Dal',
                    'descripcion' => 'Red lentils simmered in coconut milk with warming spices for a simple and comforting plant-based meal.',
                    'instrucciones' => "1. Saute onion, garlic and ginger until soft.\n2. Add curry powder and stir until fragrant.\n3. Add lentils, coconut milk and water.\n4. Simmer until the lentils break down and thicken.\n5. Finish with lime juice and coriander before serving.",
                    'tiempo_preparacion' => 28,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad' => 'easy',
                    'porciones' => 4,
                    'price' => '4.30',
                    'imagen_1' => 'recipes/Lentil Coconut Dal.webp',
                    'fecha_creacion' => '2026-03-26',
                    'id_autor' => 3,
                ],
                'categorias' => ['Indian', 'Vegan', 'One-Pot Meals'],
                'ingredientes' => [
                    ['nombre' => 'Red lentils', 'cantidad' => 260, 'unidad' => 'g'],
                    ['nombre' => 'Coconut milk', 'cantidad' => 300, 'unidad' => 'ml'],
                    ['nombre' => 'Onion', 'cantidad' => 120, 'unidad' => 'g'],
                    ['nombre' => 'Fresh ginger', 'cantidad' => 15, 'unidad' => 'g'],
                    ['nombre' => 'Curry powder', 'cantidad' => 10, 'unidad' => 'g'],
                ],
            ],

            // 28 · Caprese Stuffed Chicken -> Liqi (id_autor: 2)
            [
                'recipe' => [
                    'titulo' => 'Caprese Stuffed Chicken',
                    'descripcion' => 'Chicken breasts filled with mozzarella, tomato and basil, then baked until juicy.',
                    'instrucciones' => "1. Cut a pocket into each chicken breast.\n2. Fill with mozzarella, tomato slices and basil leaves.\n3. Secure with toothpicks and season the chicken.\n4. Sear briefly on both sides.\n5. Finish in the oven until cooked through and melty inside.",
                    'tiempo_preparacion' => 30,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad' => 'medium',
                    'porciones' => 2,
                    'price' => '7.30',
                    'imagen_1' => 'recipes/Caprese Stuffed Chicken.webp',
                    'fecha_creacion' => '2026-03-27',
                    'id_autor' => 2,
                ],
                'categorias' => ['Italian', 'Poultry', 'Main Course'],
                'ingredientes' => [
                    ['nombre' => 'Chicken breast', 'cantidad' => 360, 'unidad' => 'g'],
                    ['nombre' => 'Mozzarella', 'cantidad' => 120, 'unidad' => 'g'],
                    ['nombre' => 'Tomatoes', 'cantidad' => 140, 'unidad' => 'g'],
                    ['nombre' => 'Fresh basil', 'cantidad' => 10, 'unidad' => 'g'],
                    ['nombre' => 'Olive oil', 'cantidad' => 15, 'unidad' => 'ml'],
                ],
            ],

            // 29 · Tuna Poke Bowl -> Pau (id_autor: 1)
            [
                'recipe' => [
                    'titulo' => 'Tuna Poke Bowl',
                    'descripcion' => 'Fresh tuna served over rice with avocado, cucumber and a soy-sesame dressing.',
                    'instrucciones' => "1. Cook the rice and let it cool slightly.\n2. Dice the tuna and toss with soy sauce, sesame oil and lime.\n3. Slice avocado and cucumber.\n4. Build bowls with rice, tuna and vegetables.\n5. Finish with sesame seeds and spring onion.",
                    'tiempo_preparacion' => 20,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad' => 'easy',
                    'porciones' => 2,
                    'price' => '10.80',
                    'imagen_1' => 'recipes/Tuna Poke Bowl.webp',
                    'fecha_creacion' => '2026-03-28',
                    'id_autor' => 1,
                ],
                'categorias' => ['Japanese', 'Seafood', 'Healthy & Low-Calorie'],
                'ingredientes' => [
                    ['nombre' => 'Sushi rice', 'cantidad' => 180, 'unidad' => 'g'],
                    ['nombre' => 'Fresh tuna', 'cantidad' => 240, 'unidad' => 'g'],
                    ['nombre' => 'Avocado', 'cantidad' => 1, 'unidad' => 'unit'],
                    ['nombre' => 'Cucumber', 'cantidad' => 120, 'unidad' => 'g'],
                    ['nombre' => 'Soy sauce', 'cantidad' => 25, 'unidad' => 'ml'],
                ],
            ],

            // 30 · French Onion Soup -> Marc (id_autor: 3)
            [
                'recipe' => [
                    'titulo' => 'French Onion Soup',
                    'descripcion' => 'Sweet caramelised onions in a rich broth topped with toasted bread and bubbling cheese.',
                    'instrucciones' => "1. Cook sliced onions slowly in butter until deeply golden.\n2. Deglaze with a splash of white wine.\n3. Add stock and simmer until rich and savoury.\n4. Ladle into ovenproof bowls.\n5. Top with toasted bread and grated cheese.\n6. Grill until melted and golden.",
                    'tiempo_preparacion' => 55,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad' => 'medium',
                    'porciones' => 4,
                    'price' => '5.40',
                    'imagen_1' => 'recipes/French Onion Soup.webp',
                    'fecha_creacion' => '2026-03-29',
                    'id_autor' => 3,
                ],
                'categorias' => ['French', 'Soups', 'Comfort Food'],
                'ingredientes' => [
                    ['nombre' => 'Onion', 'cantidad' => 700, 'unidad' => 'g'],
                    ['nombre' => 'Butter', 'cantidad' => 40, 'unidad' => 'g'],
                    ['nombre' => 'Beef stock', 'cantidad' => 1200, 'unidad' => 'ml'],
                    ['nombre' => 'Baguette', 'cantidad' => 120, 'unidad' => 'g'],
                    ['nombre' => 'Gruyere cheese', 'cantidad' => 140, 'unidad' => 'g'],
                ],
            ],

            // 31 · Churro Bites -> Liqi (id_autor: 2)
            [
                'recipe' => [
                    'titulo' => 'Churro Bites',
                    'descripcion' => 'Small golden churros rolled in cinnamon sugar, crisp outside and soft inside.',
                    'instrucciones' => "1. Heat water, butter and a pinch of salt until melted.\n2. Stir in flour to form a smooth dough.\n3. Beat in the eggs until glossy.\n4. Pipe small pieces into hot oil and fry until golden.\n5. Toss in cinnamon sugar while still warm.",
                    'tiempo_preparacion' => 25,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad' => 'medium',
                    'porciones' => 4,
                    'price' => '3.90',
                    'imagen_1' => 'recipes/Churro Bites.webp',
                    'fecha_creacion' => '2026-03-30',
                    'id_autor' => 2,
                ],
                'categorias' => ['Spanish', 'Baking & Desserts', 'Snacks'],
                'ingredientes' => [
                    ['nombre' => 'Water', 'cantidad' => 200, 'unidad' => 'ml'],
                    ['nombre' => 'Butter', 'cantidad' => 40, 'unidad' => 'g'],
                    ['nombre' => 'Flour', 'cantidad' => 130, 'unidad' => 'g'],
                    ['nombre' => 'Eggs', 'cantidad' => 2, 'unidad' => 'unit'],
                    ['nombre' => 'Sugar', 'cantidad' => 70, 'unidad' => 'g'],
                ],
            ],

            // 32 · Veggie Fried Noodles -> Pau (id_autor: 1)
            [
                'recipe' => [
                    'titulo' => 'Veggie Fried Noodles',
                    'descripcion' => 'Quick stir-fried noodles with colourful vegetables and a savoury soy-garlic sauce.',
                    'instrucciones' => "1. Cook noodles until just tender and drain well.\n2. Stir-fry carrots, peppers and cabbage over high heat.\n3. Add garlic and the noodles to the wok.\n4. Pour in soy sauce and sesame oil.\n5. Toss everything together until glossy and hot.",
                    'tiempo_preparacion' => 18,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad' => 'easy',
                    'porciones' => 2,
                    'price' => '4.10',
                    'imagen_1' => 'recipes/Veggie Fried Noodles.webp',
                    'fecha_creacion' => '2026-03-31',
                    'id_autor' => 1,
                ],
                'categorias' => ['Chinese', 'Vegetarian', 'One-Pot Meals'],
                'ingredientes' => [
                    ['nombre' => 'Egg noodles', 'cantidad' => 220, 'unidad' => 'g'],
                    ['nombre' => 'Carrot', 'cantidad' => 120, 'unidad' => 'g'],
                    ['nombre' => 'Red bell pepper', 'cantidad' => 140, 'unidad' => 'g'],
                    ['nombre' => 'Cabbage', 'cantidad' => 150, 'unidad' => 'g'],
                    ['nombre' => 'Soy sauce', 'cantidad' => 30, 'unidad' => 'ml'],
                ],
            ],

            // 33 · Roasted Eggplant Couscous -> Marc (id_autor: 3)
            [
                'recipe' => [
                    'titulo' => 'Roasted Eggplant Couscous',
                    'descripcion' => 'Spiced roasted eggplant folded through fluffy couscous with herbs and lemon.',
                    'instrucciones' => "1. Roast eggplant cubes with olive oil and cumin until tender.\n2. Hydrate the couscous with hot stock and cover.\n3. Fluff the couscous with a fork.\n4. Fold in the roasted eggplant and chopped herbs.\n5. Finish with lemon juice and serve warm.",
                    'tiempo_preparacion' => 30,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad' => 'easy',
                    'porciones' => 3,
                    'price' => '4.90',
                    'imagen_1' => 'recipes/Roasted Eggplant Couscous.webp',
                    'fecha_creacion' => '2026-04-01',
                    'id_autor' => 3,
                ],
                'categorias' => ['Middle Eastern', 'Vegan', 'Healthy & Low-Calorie'],
                'ingredientes' => [
                    ['nombre' => 'Eggplant', 'cantidad' => 400, 'unidad' => 'g'],
                    ['nombre' => 'Couscous', 'cantidad' => 220, 'unidad' => 'g'],
                    ['nombre' => 'Vegetable stock', 'cantidad' => 260, 'unidad' => 'ml'],
                    ['nombre' => 'Lemon', 'cantidad' => 1, 'unidad' => 'unit'],
                    ['nombre' => 'Fresh parsley', 'cantidad' => 15, 'unidad' => 'g'],
                ],
            ],

            // 34 · Breakfast Burrito -> Liqi (id_autor: 2)
            [
                'recipe' => [
                    'titulo' => 'Breakfast Burrito',
                    'descripcion' => 'A hearty burrito packed with scrambled eggs, potatoes, cheese and salsa.',
                    'instrucciones' => "1. Cook diced potatoes until crisp and tender.\n2. Scramble the eggs until softly set.\n3. Warm the tortillas briefly.\n4. Fill with eggs, potatoes, cheese and salsa.\n5. Roll tightly and toast the seam side down before serving.",
                    'tiempo_preparacion' => 20,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad' => 'easy',
                    'porciones' => 2,
                    'price' => '4.60',
                    'imagen_1' => 'recipes/Breakfast Burrito.webp',
                    'fecha_creacion' => '2026-04-02',
                    'id_autor' => 2,
                ],
                'categorias' => ['Breakfast', 'Mexican', 'Kid-Friendly'],
                'ingredientes' => [
                    ['nombre' => 'Flour tortillas', 'cantidad' => 2, 'unidad' => 'unit'],
                    ['nombre' => 'Eggs', 'cantidad' => 4, 'unidad' => 'unit'],
                    ['nombre' => 'Potatoes', 'cantidad' => 220, 'unidad' => 'g'],
                    ['nombre' => 'Cheddar cheese', 'cantidad' => 80, 'unidad' => 'g'],
                    ['nombre' => 'Salsa', 'cantidad' => 80, 'unidad' => 'g'],
                ],
            ],

            // 35 · Garlic Butter Steak Bites -> Pau (id_autor: 1)
            [
                'recipe' => [
                    'titulo' => 'Garlic Butter Steak Bites',
                    'descripcion' => 'Quick seared steak cubes with garlic butter and herbs, ideal for a rich high-protein dinner.',
                    'instrucciones' => "1. Pat the steak dry and cut into bite-size cubes.\n2. Sear in a very hot pan until browned on all sides.\n3. Lower the heat and add butter and garlic.\n4. Toss with chopped parsley until glossy.\n5. Rest briefly and serve immediately.",
                    'tiempo_preparacion' => 16,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad' => 'easy',
                    'porciones' => 2,
                    'price' => '11.20',
                    'imagen_1' => 'recipes/Garlic Butter Steak Bites.webp',
                    'fecha_creacion' => '2026-04-03',
                    'id_autor' => 1,
                ],
                'categorias' => ['Main Course', 'Low-Carb & Keto', 'Comfort Food'],
                'ingredientes' => [
                    ['nombre' => 'Beef sirloin', 'cantidad' => 350, 'unidad' => 'g'],
                    ['nombre' => 'Butter', 'cantidad' => 35, 'unidad' => 'g'],
                    ['nombre' => 'Garlic', 'cantidad' => 12, 'unidad' => 'g'],
                    ['nombre' => 'Fresh parsley', 'cantidad' => 10, 'unidad' => 'g'],
                    ['nombre' => 'Black pepper', 'cantidad' => 3, 'unidad' => 'g'],
                ],
            ],

            // 36 · Chicken Parmesan -> Marc (id_autor: 3)
            [
                'recipe' => [
                    'titulo' => 'Chicken Parmesan',
                    'descripcion' => 'Breaded chicken cutlets topped with tomato sauce and melted mozzarella, served golden and crisp.',
                    'instrucciones' => "1. Bread the chicken with flour, egg and breadcrumbs.\n2. Fry until golden on both sides.\n3. Place in a baking dish and spoon over tomato sauce.\n4. Add mozzarella and Parmesan.\n5. Bake until the cheese melts and the chicken is cooked through.",
                    'tiempo_preparacion' => 35,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad' => 'medium',
                    'porciones' => 3,
                    'price' => '8.40',
                    'imagen_1' => 'recipes/Chicken Parmesan.webp',
                    'fecha_creacion' => '2026-04-04',
                    'id_autor' => 3,
                ],
                'categorias' => ['Italian', 'Poultry', 'Comfort Food'],
                'ingredientes' => [
                    ['nombre' => 'Chicken breast', 'cantidad' => 500, 'unidad' => 'g'],
                    ['nombre' => 'Breadcrumbs', 'cantidad' => 120, 'unidad' => 'g'],
                    ['nombre' => 'Tomato sauce', 'cantidad' => 220, 'unidad' => 'g'],
                    ['nombre' => 'Mozzarella', 'cantidad' => 140, 'unidad' => 'g'],
                    ['nombre' => 'Parmesan cheese', 'cantidad' => 50, 'unidad' => 'g'],
                ],
            ],

            // 37 · Coconut Mango Smoothie -> Liqi (id_autor: 2)
            [
                'recipe' => [
                    'titulo' => 'Coconut Mango Smoothie',
                    'descripcion' => 'A creamy tropical smoothie with mango, banana and coconut milk.',
                    'instrucciones' => "1. Add mango, banana and coconut milk to a blender.\n2. Blend until perfectly smooth.\n3. Adjust thickness with ice or more coconut milk.\n4. Pour into glasses and serve cold.",
                    'tiempo_preparacion' => 8,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad' => 'easy',
                    'porciones' => 2,
                    'price' => '3.50',
                    'imagen_1' => 'recipes/Coconut Mango Smoothie.webp',
                    'fecha_creacion' => '2026-04-05',
                    'id_autor' => 2,
                ],
                'categorias' => ['Drinks & Beverages', 'Healthy & Low-Calorie', 'Vegetarian'],
                'ingredientes' => [
                    ['nombre' => 'Mango', 'cantidad' => 250, 'unidad' => 'g'],
                    ['nombre' => 'Banana', 'cantidad' => 1, 'unidad' => 'unit'],
                    ['nombre' => 'Coconut milk', 'cantidad' => 250, 'unidad' => 'ml'],
                    ['nombre' => 'Ice', 'cantidad' => 80, 'unidad' => 'g'],
                    ['nombre' => 'Honey', 'cantidad' => 15, 'unidad' => 'g'],
                ],
            ],

            // 38 · Patatas Bravas -> Pau (id_autor: 1)
            [
                'recipe' => [
                    'titulo' => 'Patatas Bravas',
                    'descripcion' => 'Crispy potatoes topped with a smoky tomato sauce and a cool creamy finish.',
                    'instrucciones' => "1. Roast or fry potato cubes until crisp and golden.\n2. Cook onion, garlic and paprika in olive oil.\n3. Add tomato sauce and simmer until slightly thick.\n4. Pile the potatoes onto a serving plate.\n5. Spoon over the bravas sauce and finish with aioli if desired.",
                    'tiempo_preparacion' => 32,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad' => 'easy',
                    'porciones' => 4,
                    'price' => '3.80',
                    'imagen_1' => 'recipes/Patatas Bravas.webp',
                    'fecha_creacion' => '2026-04-06',
                    'id_autor' => 1,
                ],
                'categorias' => ['Spanish', 'Snacks', 'Vegetarian'],
                'ingredientes' => [
                    ['nombre' => 'Potatoes', 'cantidad' => 700, 'unidad' => 'g'],
                    ['nombre' => 'Tomato sauce', 'cantidad' => 180, 'unidad' => 'g'],
                    ['nombre' => 'Garlic', 'cantidad' => 12, 'unidad' => 'g'],
                    ['nombre' => 'Paprika', 'cantidad' => 8, 'unidad' => 'g'],
                    ['nombre' => 'Mayonnaise', 'cantidad' => 60, 'unidad' => 'g'],
                ],
            ],

            // 39 · Gnocchi Pesto Bake -> Marc (id_autor: 3)
            [
                'recipe' => [
                    'titulo' => 'Gnocchi Pesto Bake',
                    'descripcion' => 'Soft gnocchi baked with basil pesto, cream and bubbling mozzarella for an easy oven dinner.',
                    'instrucciones' => "1. Toss the gnocchi with pesto and cream.\n2. Transfer to a baking dish.\n3. Add mozzarella over the top.\n4. Bake until bubbling and golden around the edges.\n5. Rest briefly and serve hot.",
                    'tiempo_preparacion' => 22,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad' => 'easy',
                    'porciones' => 3,
                    'price' => '5.90',
                    'imagen_1' => 'recipes/Spinach Ricotta Cannelloni.webp',
                    'fecha_creacion' => '2026-04-07',
                    'id_autor' => 3,
                ],
                'categorias' => ['Italian', 'Comfort Food', 'Vegetarian'],
                'ingredientes' => [
                    ['nombre' => 'Gnocchi', 'cantidad' => 500, 'unidad' => 'g'],
                    ['nombre' => 'Basil pesto', 'cantidad' => 120, 'unidad' => 'g'],
                    ['nombre' => 'Cooking cream', 'cantidad' => 140, 'unidad' => 'ml'],
                    ['nombre' => 'Mozzarella', 'cantidad' => 140, 'unidad' => 'g'],
                    ['nombre' => 'Parmesan cheese', 'cantidad' => 35, 'unidad' => 'g'],
                ],
            ],

            // 40 · Moroccan Chickpea Tagine -> Liqi (id_autor: 2)
            [
                'recipe' => [
                    'titulo' => 'Moroccan Chickpea Tagine',
                    'descripcion' => 'A fragrant tomato stew with chickpeas, carrot and warming spices, finished with fresh herbs.',
                    'instrucciones' => "1. Cook onion and carrot until softened.\n2. Add garlic, cumin and cinnamon.\n3. Stir in tomatoes and chickpeas.\n4. Simmer until thick and flavourful.\n5. Finish with coriander and serve with couscous.",
                    'tiempo_preparacion' => 35,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad' => 'easy',
                    'porciones' => 4,
                    'price' => '4.70',
                    'imagen_1' => 'recipes/Moroccan Chickpea Tagine.webp',
                    'fecha_creacion' => '2026-04-08',
                    'id_autor' => 2,
                ],
                'categorias' => ['African', 'Vegan', 'One-Pot Meals'],
                'ingredientes' => [
                    ['nombre' => 'Chickpeas', 'cantidad' => 400, 'unidad' => 'g'],
                    ['nombre' => 'Carrot', 'cantidad' => 160, 'unidad' => 'g'],
                    ['nombre' => 'Tomatoes', 'cantidad' => 300, 'unidad' => 'g'],
                    ['nombre' => 'Onion', 'cantidad' => 120, 'unidad' => 'g'],
                    ['nombre' => 'Cumin', 'cantidad' => 7, 'unidad' => 'g'],
                ],
            ],

            // 41 · Crispy Fish Tacos -> Pau (id_autor: 1)
            [
                'recipe' => [
                    'titulo' => 'Crispy Fish Tacos',
                    'descripcion' => 'Golden fish strips in tortillas with crunchy slaw and lime crema.',
                    'instrucciones' => "1. Coat the fish in seasoned flour.\n2. Fry until crisp and golden.\n3. Mix cabbage with lime juice and salt.\n4. Stir yogurt with lime zest for a quick crema.\n5. Fill warm tortillas with fish, slaw and crema.",
                    'tiempo_preparacion' => 25,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad' => 'easy',
                    'porciones' => 3,
                    'price' => '7.60',
                    'imagen_1' => 'recipes/Crispy Fish Tacos.webp',
                    'fecha_creacion' => '2026-04-09',
                    'id_autor' => 1,
                ],
                'categorias' => ['Mexican', 'Seafood', 'Street Food'],
                'ingredientes' => [
                    ['nombre' => 'White fish fillet', 'cantidad' => 420, 'unidad' => 'g'],
                    ['nombre' => 'Corn tortillas', 'cantidad' => 9, 'unidad' => 'unit'],
                    ['nombre' => 'White cabbage', 'cantidad' => 160, 'unidad' => 'g'],
                    ['nombre' => 'Greek yogurt', 'cantidad' => 110, 'unidad' => 'g'],
                    ['nombre' => 'Lime', 'cantidad' => 2, 'unidad' => 'unit'],
                ],
            ],

            // 42 · Tiramisu Cups -> Marc (id_autor: 3)
            [
                'recipe' => [
                    'titulo' => 'Tiramisu Cups',
                    'descripcion' => 'Layered coffee-soaked biscuits and mascarpone cream served in individual cups.',
                    'instrucciones' => "1. Whisk mascarpone with cream and sugar until smooth.\n2. Dip biscuits briefly into strong coffee.\n3. Layer biscuits and cream into glasses.\n4. Repeat until the cups are filled.\n5. Chill well and finish with cocoa powder.",
                    'tiempo_preparacion' => 25,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad' => 'easy',
                    'porciones' => 4,
                    'price' => '5.80',
                    'imagen_1' => 'recipes/Tiramisu Cups.webp',
                    'fecha_creacion' => '2026-04-10',
                    'id_autor' => 3,
                ],
                'categorias' => ['Italian', 'Baking & Desserts', 'Comfort Food'],
                'ingredientes' => [
                    ['nombre' => 'Mascarpone', 'cantidad' => 250, 'unidad' => 'g'],
                    ['nombre' => 'Cooking cream', 'cantidad' => 180, 'unidad' => 'ml'],
                    ['nombre' => 'Ladyfingers', 'cantidad' => 140, 'unidad' => 'g'],
                    ['nombre' => 'Coffee', 'cantidad' => 180, 'unidad' => 'ml'],
                    ['nombre' => 'Cocoa powder', 'cantidad' => 12, 'unidad' => 'g'],
                ],
            ],

            // 43 · Sesame Chicken Stir Fry -> Liqi (id_autor: 2)
            [
                'recipe' => [
                    'titulo' => 'Sesame Chicken Stir Fry',
                    'descripcion' => 'Tender chicken and crisp vegetables tossed in a glossy sesame-soy sauce.',
                    'instrucciones' => "1. Sear the chicken strips in a hot wok until lightly browned.\n2. Add broccoli and bell pepper and stir-fry quickly.\n3. Mix soy sauce, honey and sesame oil in a small bowl.\n4. Pour the sauce into the wok and toss until shiny.\n5. Finish with sesame seeds and serve over rice.",
                    'tiempo_preparacion' => 20,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad' => 'easy',
                    'porciones' => 3,
                    'price' => '6.80',
                    'imagen_1' => 'recipes/Sesame Chicken Stir Fry.webp',
                    'fecha_creacion' => '2026-04-11',
                    'id_autor' => 2,
                ],
                'categorias' => ['Chinese', 'Poultry', 'One-Pot Meals'],
                'ingredientes' => [
                    ['nombre' => 'Chicken thigh', 'cantidad' => 450, 'unidad' => 'g'],
                    ['nombre' => 'Broccoli', 'cantidad' => 220, 'unidad' => 'g'],
                    ['nombre' => 'Red bell pepper', 'cantidad' => 150, 'unidad' => 'g'],
                    ['nombre' => 'Soy sauce', 'cantidad' => 35, 'unidad' => 'ml'],
                    ['nombre' => 'Sesame oil', 'cantidad' => 12, 'unidad' => 'ml'],
                ],
            ],

            // 44 · Creamy Pesto Salmon Pasta -> Pau (id_autor: 1)
            [
                'recipe' => [
                    'titulo' => 'Creamy Pesto Salmon Pasta',
                    'descripcion' => 'Flaked salmon folded into pasta with basil pesto, cream and Parmesan for a rich but fast dinner.',
                    'instrucciones' => "1. Cook the pasta in salted water until al dente.\n2. Pan-sear the salmon until just cooked, then flake it into large pieces.\n3. Warm cream and pesto together in a wide pan.\n4. Add the cooked pasta with a splash of pasta water.\n5. Fold in the salmon gently and finish with Parmesan before serving.",
                    'tiempo_preparacion' => 25,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad' => 'easy',
                    'porciones' => 3,
                    'price' => '8.90',
                    'imagen_1' => 'recipes/Teriyaki Salmon Rice Bowl.webp',
                    'fecha_creacion' => '2026-04-12',
                    'id_autor' => 1,
                ],
                'categorias' => ['Pasta', 'Seafood', 'Italian'],
                'ingredientes' => [
                    ['nombre' => 'Pasta', 'cantidad' => 300, 'unidad' => 'g'],
                    ['nombre' => 'Salmon fillet', 'cantidad' => 280, 'unidad' => 'g'],
                    ['nombre' => 'Basil pesto', 'cantidad' => 100, 'unidad' => 'g'],
                    ['nombre' => 'Cooking cream', 'cantidad' => 180, 'unidad' => 'ml'],
                    ['nombre' => 'Parmesan cheese', 'cantidad' => 45, 'unidad' => 'g'],
                ],
            ],

            // 45 · Apple Cinnamon Overnight Oats -> Marc (id_autor: 3)
            [
                'recipe' => [
                    'titulo' => 'Apple Cinnamon Overnight Oats',
                    'descripcion' => 'A chilled breakfast jar with oats, yogurt, apple and cinnamon, perfect for meal prep mornings.',
                    'instrucciones' => "1. Combine oats, milk, yogurt and chia seeds in a jar.\n2. Stir in cinnamon and a little honey.\n3. Fold in diced apple, keeping a little aside for topping.\n4. Refrigerate overnight or for at least 6 hours.\n5. Top with the remaining apple and serve cold.",
                    'tiempo_preparacion' => 10,
                    'tiempo_preparacion_unidad' => 'minutes',
                    'dificultad' => 'easy',
                    'porciones' => 1,
                    'price' => '2.90',
                    'imagen_1' => 'recipes/Apple Cinnamon Overnight Oats.webp',
                    'fecha_creacion' => '2026-04-13',
                    'id_autor' => 3,
                ],
                'categorias' => ['Breakfast', 'Healthy & Low-Calorie', 'Meal Prep & Storage'],
                'ingredientes' => [
                    ['nombre' => 'Rolled oats', 'cantidad' => 70, 'unidad' => 'g'],
                    ['nombre' => 'Milk', 'cantidad' => 140, 'unidad' => 'ml'],
                    ['nombre' => 'Greek yogurt', 'cantidad' => 80, 'unidad' => 'g'],
                    ['nombre' => 'Apple', 'cantidad' => 1, 'unidad' => 'unit'],
                    ['nombre' => 'Cinnamon', 'cantidad' => 4, 'unidad' => 'g'],
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
                'active'   => 1,
            ];

            $existingRecipeId = DB::table('receta_original')
                ->whereRaw('LOWER(titulo) = ?', [strtolower(trim((string) $recipeData['titulo']))])
                ->value('id_receta');

            if ($existingRecipeId) {
                $recetaId = (int) $existingRecipeId;
                DB::table('receta_original')
                    ->where('id_receta', $recetaId)
                    ->update($recipeData);
            } else {
                $recetaId = (int) DB::table('receta_original')->insertGetId($recipeData);
            }

            $recetaIds[$index + 1] = $recetaId; // map 1-based index to DB ID

            DB::table('receta_categoria')->where('id_receta', $recetaId)->delete();
            DB::table('receta_ingrediente')->where('id_receta', $recetaId)->delete();

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
        $user = function (string $email): int {
            return (int) DB::table('users')
                ->whereRaw('LOWER(email) = ?', [strtolower(trim($email))])
                ->value('id_usuario');
        };

        $reviews = [
            // Fettuccine Alfredo (Recipe 1, Author: Liqi)
            [
                'id_receta' => $recetaIds[1],
                'id_usuario' => $user('pau@gmail.com'),
                'puntuacion' => 5,
                'comentario' => 'Amazing! Will cook again.',
                'fecha' => now(),
            ],
            [
                'id_receta' => $recetaIds[1],
                'id_usuario' => $user('marc@gmail.com'),
                'puntuacion' => 4,
                'comentario' => 'A bit heavy, but very tasty cream sauce.',
                'fecha' => now(),
            ],

            // Spaghetti alla Puttanesca (Recipe 2, Author: Marc)
            [
                'id_receta' => $recetaIds[2],
                'id_usuario' => $user('1871649909yang@gmail.com'),
                'puntuacion' => 5,
                'comentario' => 'Incredible flavors. The olives give it such a great punch.',
                'fecha' => now(),
            ],

            // Ultimate Smash Burger (Recipe 3, Author: Pau)
            [
                'id_receta' => $recetaIds[3],
                'id_usuario' => $user('1871649909yang@gmail.com'),
                'puntuacion' => 4,
                'comentario' => 'Great burger, though I prefer more cheddar.',
                'fecha' => '2026-04-07',
            ],
            [
                'id_receta' => $recetaIds[3],
                'id_usuario' => $user('marc@gmail.com'),
                'puntuacion' => 5,
                'comentario' => 'Best smash burger recipe out there.',
                'fecha' => '2026-04-07',
            ],
            [
                'id_receta' => $recetaIds[3],
                'id_usuario' => $user('alex@gmail.com'),
                'puntuacion' => 5,
                'comentario' => 'Super juicy and perfectly balanced.',
                'fecha' => '2026-04-06',
            ],
            [
                'id_receta' => $recetaIds[3],
                'id_usuario' => $user('mia@gmail.com'),
                'puntuacion' => 4,
                'comentario' => 'Loved the crispy edges on the patty.',
                'fecha' => '2026-04-06',
            ],
            [
                'id_receta' => $recetaIds[3],
                'id_usuario' => $user('noah@gmail.com'),
                'puntuacion' => 5,
                'comentario' => 'Restaurant quality burger at home.',
                'fecha' => '2026-04-07',
            ],
            [
                'id_receta' => $recetaIds[3],
                'id_usuario' => $user('sofia@gmail.com'),
                'puntuacion' => 4,
                'comentario' => 'The guacamole twist works really well.',
                'fecha' => '2026-04-06',
            ],
            [
                'id_receta' => $recetaIds[3],
                'id_usuario' => $user('emma@gmail.com'),
                'puntuacion' => 5,
                'comentario' => 'Crispy bacon and cheddar made it amazing.',
                'fecha' => '2026-04-07',
            ],
            [
                'id_receta' => $recetaIds[3],
                'id_usuario' => $user('leo@gmail.com'),
                'puntuacion' => 4,
                'comentario' => 'Easy to follow and very satisfying.',
                'fecha' => '2026-04-06',
            ],
            [
                'id_receta' => $recetaIds[3],
                'id_usuario' => $user('chloe@gmail.com'),
                'puntuacion' => 5,
                'comentario' => 'My family asked me to make these again.',
                'fecha' => now(),
            ],
            [
                'id_receta' => $recetaIds[3],
                'id_usuario' => $user('hugo@gmail.com'),
                'puntuacion' => 4,
                'comentario' => 'Very tasty, especially with the toasted bun.',
                'fecha' => now(),
            ],
            [
                'id_receta' => $recetaIds[3],
                'id_usuario' => $user('nora@gmail.com'),
                'puntuacion' => 5,
                'comentario' => 'Definitely one of the best burger recipes here.',
                'fecha' => now(),
            ],
            [
                'id_receta' => $recetaIds[3],
                'id_usuario' => $user('lucas@gmail.com'),
                'puntuacion' => 4,
                'comentario' => 'Great texture and lots of flavor in every bite.',
                'fecha' => now(),
            ],

            // Gourmet Smash Burger (Recipe 5, Author: Liqi)
            [
                'id_receta' => $recetaIds[5],
                'id_usuario' => $user('pau@gmail.com'),
                'puntuacion' => 3,
                'comentario' => 'It was okay. Took a while to prep.',
                'fecha' => now(),
            ],
        ];

        foreach ($reviews as $review) {
            $exists = DB::table('valoracion')
                ->where('id_receta', $review['id_receta'])
                ->where('id_usuario', $review['id_usuario'])
                ->where('comentario', $review['comentario'])
                ->exists();

            if (!$exists) {
                DB::table('valoracion')->insert($review);
            }
        }
    }
}
