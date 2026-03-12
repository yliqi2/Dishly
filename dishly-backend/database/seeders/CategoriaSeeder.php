<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategoriaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            ['nombre' => 'Appetizers'],
            ['nombre' => 'Salads'],
            ['nombre' => 'Soups'],
            ['nombre' => 'Main Course'],
            ['nombre' => 'Pasta'],
            ['nombre' => 'Rice & Grains'],
            ['nombre' => 'Seafood'],
            ['nombre' => 'Poultry'],
            ['nombre' => 'Baking & Desserts'],
            ['nombre' => 'Breakfast'],
            ['nombre' => 'Vegan'],
            ['nombre' => 'Vegetarian'],
            ['nombre' => 'Gluten-Free'],
            ['nombre' => 'Snacks'],
            ['nombre' => 'Sauces & Condiments'],
            ['nombre' => 'Drinks & Beverages'],
            ['nombre' => 'Grilling & BBQ'],
            ['nombre' => 'One-Pot Meals'],
            ['nombre' => 'Comfort Food'],
            ['nombre' => 'Kid-Friendly'],
            ['nombre' => 'Holiday & Celebration'],
            ['nombre' => 'Street Food'],
            ['nombre' => 'Healthy & Low-Calorie'],
            ['nombre' => 'Low-Carb & Keto'],
            ['nombre' => 'Paleo'],
            ['nombre' => 'Mediterranean'],
            ['nombre' => 'Indian'],
            ['nombre' => 'Chinese'],
            ['nombre' => 'Japanese'],
            ['nombre' => 'Thai'],
            ['nombre' => 'Middle Eastern'],
            ['nombre' => 'Breads & Baking'],
            ['nombre' => 'Preserves & Jams'],
            ['nombre' => 'Meal Prep & Storage'],
            ['nombre' => 'Fine Dining'],
            ['nombre' => 'Mexican'],
            ['nombre' => 'Spanish'],
            ['nombre' => 'French'],
            ['nombre' => 'Italian'],
            ['nombre' => 'Korean'],
            ['nombre' => 'Vietnamese'],
            ['nombre' => 'Caribbean'],
            ['nombre' => 'African'],
            ['nombre' => 'Latin American'],
            ['nombre' => 'Cocktails'],
            ['nombre' => 'Tea & Coffee'],
            ['nombre' => 'Slow Cooker'],
            ['nombre' => 'Instant Pot'],
            ['nombre' => 'Sous Vide'],
            ['nombre' => 'Fermentation'],
            ['nombre' => 'Raw Food'],
            ['nombre' => 'Fusion'],
        ];

        DB::table('categoria')->insert($categories);
    }
}
