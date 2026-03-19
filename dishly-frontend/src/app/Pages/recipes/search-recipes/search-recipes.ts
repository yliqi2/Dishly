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
  selectedIngredients: string[] = ['Tomato', 'Cheese'];
  selectedPersons: string[] = ['2 people'];
  selectedTags: string[] = ['Pasta', 'Italian'];
  
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
  allIngredients = ['Tomato', 'Cheese', 'Onion', 'Garlic', 'Pasta', 'Chicken', 'Basil', 'Mushrooms'];
  allPersons = ['1 person', '2 people', '3 people', '4 people', '5+ people'];
  allTags = ['Pasta', 'Italian', 'Vegetarian', 'Quick', 'Healthy', 'Gourmet'];

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

  closeIngredientDropdown() {
    setTimeout(() => (this.showIngredientDropdown = false), 200);
  }

  closePersonsDropdown() {
    setTimeout(() => (this.showPersonsDropdown = false), 200);
  }

  closeTagsDropdown() {
    setTimeout(() => (this.showTagsDropdown = false), 200);
  }

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

  validateRange() {
    if (this.priceMin > this.priceMax) {
      const temp = this.priceMin;
      this.priceMin = this.priceMax;
      this.priceMax = temp;
    }
  }

  updateSearch(query: string) {
    this.searchQuery = query;
  }

  get filteredRecipes() {
    return this.recipes.filter(recipe => {
      // Search query filter
      const matchesSearch = !this.searchQuery || 
                          recipe.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                          recipe.description.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      // Price range filter
      const matchesPrice = recipe.price >= this.priceMin && recipe.price <= this.priceMax;
      
      // Rating filter
      const matchesRating = recipe.rating >= this.minRating;

      // Ingredients filter (mock logic: if any selected ingredient is in the title/description or if we had an ingredients array)
      // Since mock recipes don't have an ingredients array, we'll simulate it
      const matchesIngredients = this.selectedIngredients.length === 0 || 
                                 this.selectedIngredients.some(ing => 
                                   recipe.title.toLowerCase().includes(ing.toLowerCase()) ||
                                   recipe.description.toLowerCase().includes(ing.toLowerCase())
                                 );

      // Persons filter (mock logic: matching the badge or description)
      const matchesPersons = this.selectedPersons.length === 0 ||
                            this.selectedPersons.some(p => 
                              recipe.description.toLowerCase().includes(p.toLowerCase()) ||
                              recipe.badges.some(b => b.toLowerCase().includes(p.toLowerCase()))
                            );

      // Tags filter (matching badges)
      const matchesTags = this.selectedTags.length === 0 ||
                         this.selectedTags.some(tag => 
                           recipe.badges.some(b => b.toLowerCase() === tag.toLowerCase())
                         );
      
      return matchesSearch && matchesPrice && matchesRating && matchesIngredients && matchesPersons && matchesTags;
    });
  }
}
