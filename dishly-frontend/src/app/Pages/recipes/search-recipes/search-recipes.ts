import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { RecipeCard } from '../recipe-card/recipe-card';
import { SearchingBar } from '../../../Core/Components/searching-bar/searching-bar';

@Component({
  selector: 'app-search-recipes',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, FormsModule, RecipeCard, SearchingBar],
  templateUrl: './search-recipes.html',
  styleUrl: './search-recipes.css',
})
export class SearchRecipes {
  searchQuery: string = '';
  
  categories = ['Pasta', 'Vegetarian', 'Seafood', 'Quick', 'Dessert', 'Healthy'];
  selectedIngredients: string[] = ['Tomate', 'Queso'];
  selectedPersons: string[] = ['2 personas'];
  selectedTags: string[] = ['Pasta', 'Italiano'];
  
  priceMin: number = 0;
  priceMax: number = 100;
  minRating: number = 4;

  // Search state for dropdowns
  ingredientSearch: string = '';
  personsSearch: string = '';
  tagSearch: string = '';

  // Visibility state for dropdowns
  showIngredientDropdown: boolean = false;
  showPersonsDropdown: boolean = false;
  showTagsDropdown: boolean = false;

  // Mock data for available options
  allIngredients = ['Tomate', 'Queso', 'Cebolla', 'Ajo', 'Pasta', 'Pollo', 'Albahaca', 'Champiñones'];
  allPersons = ['1 persona', '2 personas', '3 personas', '4 personas', '5+ personas'];
  allTags = ['Pasta', 'Italiano', 'Vegetariano', 'Rápido', 'Saludable', 'Gourmet'];

  get filteredIngredientsOptions() {
    return this.allIngredients.filter(ing => 
      ing.toLowerCase().includes(this.ingredientSearch.toLowerCase()) && 
      !this.selectedIngredients.includes(ing)
    );
  }

  get filteredPersonsOptions() {
    return this.allPersons.filter(p => 
      p.toLowerCase().includes(this.personsSearch.toLowerCase()) && 
      !this.selectedPersons.includes(p)
    );
  }

  get filteredTagsOptions() {
    return this.allTags.filter(t => 
      t.toLowerCase().includes(this.tagSearch.toLowerCase()) && 
      !this.selectedTags.includes(t)
    );
  }

  addIngredient(ing: string) {
    if (!this.selectedIngredients.includes(ing)) {
      this.selectedIngredients.push(ing);
    }
    this.ingredientSearch = '';
    this.showIngredientDropdown = false;
  }

  addPerson(p: string) {
    if (!this.selectedPersons.includes(p)) {
      this.selectedPersons.push(p);
    }
    this.personsSearch = '';
    this.showPersonsDropdown = false;
  }

  addTag(t: string) {
    if (!this.selectedTags.includes(t)) {
      this.selectedTags.push(t);
    }
    this.tagSearch = '';
    this.showTagsDropdown = false;
  }

  // Wrapper for template access to setTimeout
  protected readonly setTimeout = setTimeout;

  recipes = [
    {
      id: 1,
      title: 'Truffle Pasta Carbonara',
      description: 'Classic Italian pasta with a gourmet twist, featuring rich truffle butter, crispy pancetta, and a creamy sauce that will transport you to Rome.',
      image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?q=80&w=2071&auto=format&fit=crop',
      rating: 4.8,
      time: '30 min',
      kcal: '320 kcal',
      badges: ['Premium', 'Medium'],
      price: 12.50
    },
    {
      id: 2,
      title: 'Creamy Mushroom Pasta',
      description: 'A rich and velvety pasta dish with sautéed mushrooms, garlic, and a luxurious cream sauce. Perfect for a cozy dinner at home.',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2000&auto=format&fit=crop',
      rating: 4.6,
      time: '25 min',
      kcal: '320 kcal',
      badges: ['Vegetarian', 'Easy'],
      price: 10.00
    },
    {
      id: 3,
      title: 'Seafood Linguine',
      description: 'Fresh seafood tossed with al dente linguine in a light white wine and tomato sauce. A taste of the Mediterranean coast.',
      image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=2132&auto=format&fit=crop',
      rating: 4.9,
      time: '35 min',
      kcal: '320 kcal',
      badges: ['Seafood', 'Hard'],
      price: 18.00
    },
    {
      id: 4,
      title: 'Pesto Gnocchi',
      description: 'Pillowy soft potato gnocchi coated in a vibrant homemade basil pesto with pine nuts and parmesan. Simply irresistible.',
      image: 'https://images.unsplash.com/photo-1558985250-27a406d64cb3?q=80&w=2070&auto=format&fit=crop',
      rating: 4.7,
      time: '20 min',
      kcal: '320 kcal',
      badges: ['Quick', 'Easy'],
      price: 9.50
    }
  ];

  clearFilters() {
    this.selectedIngredients = [];
    this.selectedPersons = [];
    this.selectedTags = [];
    this.priceMin = 0;
    this.priceMax = 100;
    this.minRating = 0;
  }

  removeIngredient(ing: string) {
    this.selectedIngredients = this.selectedIngredients.filter(i => i !== ing);
  }

  removePerson(p: string) {
    this.selectedPersons = this.selectedPersons.filter(i => i !== p);
  }

  removeTag(t: string) {
    this.selectedTags = this.selectedTags.filter(i => i !== t);
  }

  setRating(r: number) {
    this.minRating = r;
  }

  updateSearch(query: string) {
    this.searchQuery = query;
  }

  get filteredRecipes() {
    return this.recipes.filter(recipe => {
      const matchesSearch = recipe.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                          recipe.description.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      const matchesPrice = recipe.price <= this.priceMax;
      const matchesRating = recipe.rating >= this.minRating;
      
      // En una implementación real, aquí filtraríamos por ingredientes, personas y tags
      // Para este mock, devolvemos los que cumplen búsqueda, precio y rating
      return matchesSearch && matchesPrice && matchesRating;
    });
  }
}
