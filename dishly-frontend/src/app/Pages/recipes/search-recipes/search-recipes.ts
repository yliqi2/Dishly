import { Component, OnInit, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { RecipeCard } from '../recipe-card/recipe-card';
import { RecipeService } from '../../../Core/Services/Recipes/recipe.service';
import { RecetaCard } from '../../../Core/Interfaces/RecetaCard';

@Component({
  selector: 'app-search-recipes',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, FormsModule, RecipeCard],
  templateUrl: './search-recipes.html',
  styleUrl: './search-recipes.css',
})
export class SearchRecipes implements OnInit {
  private recipeService = inject(RecipeService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  recipes = signal<RecetaCard[]>([]);
  loading = signal(true);
  error = signal(false);

  searchQuery = signal('');
  selectedCategory = signal('');
  selectedDifficulty = signal('');
  minRating = signal(0);
  priceMin = signal(0);
  priceMax = signal(200);

  // New signals for Tags, Ingredients, Persons
  selectedTags = signal<string[]>([]);
  showTagsDropdown = signal(false);
  tagSearch = signal('');

  selectedIngredients = signal<string[]>([]);
  showIngredientDropdown = signal(false);
  ingredientSearch = signal('');

  selectedPersons = signal<string[]>([]);
  showPersonsDropdown = signal(false);
  personsSearch = signal('');

  categories = computed(() => {
    const cats = new Set<string>();
    this.recipes().forEach(r => r.categorias?.forEach(c => cats.add(c.nombre)));
    return Array.from(cats).sort();
  });

  // Filtered dropdown options
  filteredTagsOptions = computed(() => {
    return this.categories().filter(t => t.toLowerCase().includes(this.tagSearch().toLowerCase()) && !this.selectedTags().includes(t));
  });

  filteredIngredientsOptions = computed(() => {
    const defaultIngs = ['Chicken', 'Beef', 'Pork', 'Fish', 'Rice', 'Pasta', 'Tomato', 'Onion', 'Garlic', 'Cheese'];
    return defaultIngs.filter(i => i.toLowerCase().includes(this.ingredientSearch().toLowerCase()) && !this.selectedIngredients().includes(i));
  });

  filteredPersonsOptions = computed(() => {
    const defaultPersons = ['1', '2', '3', '4', '5', '6+'];
    return defaultPersons.filter(p => p.includes(this.personsSearch()) && !this.selectedPersons().includes(p));
  });

  filteredRecipes = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const cat = this.selectedCategory();
    const diff = this.selectedDifficulty();
    const rating = this.minRating();
    const min = this.priceMin();
    const max = this.priceMax();
    const tags = this.selectedTags();
    const ingredients = this.selectedIngredients();
    const personsList = this.selectedPersons();

    return this.recipes().filter(recipe => {
      const q = this.searchQuery().toLowerCase();
      const titulo = recipe.titulo ? recipe.titulo.toLowerCase() : '';
      const desc = recipe.descripcion ? recipe.descripcion.toLowerCase() : '';
      
      const matchesSearch = !q ||
        titulo.includes(q) ||
        desc.includes(q) ||
        recipe.categorias?.some(c => c.nombre && c.nombre.toLowerCase().includes(q));

      const matchesCategory = !cat ||
        recipe.categorias?.some(c => c.nombre === cat);

      const matchesDifficulty = !diff || recipe.dificultad === diff;

      const matchesRating = rating === 0 ||
        (recipe.media_valoraciones !== null &&
          parseFloat(String(recipe.media_valoraciones)) >= rating);

      let matchesPrice = true;
      if (recipe.price !== null && recipe.price !== undefined) {
        const price = parseFloat(String(recipe.price));
        matchesPrice = price >= min && price <= max;
      }

      // Arrays matching
      const matchesTags = tags.length === 0 || tags.every(t => recipe.categorias?.some(c => c.nombre === t));
      const matchesIngredients = ingredients.length === 0 || ingredients.some(i => {
        const queryLower = i.toLowerCase();
        return titulo.includes(queryLower) || desc.includes(queryLower);
      });
      
      let matchesPersons = true;
      if (personsList.length > 0) {
        matchesPersons = personsList.includes(String(recipe.porciones)) || (personsList.includes('6+') && recipe.porciones >= 6);
      }

      return matchesSearch && matchesCategory && matchesDifficulty && matchesRating && matchesPrice && matchesTags && matchesIngredients && matchesPersons;
    });
  });

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['q']) this.searchQuery.set(params['q']);
    });
    this.loadRecipes();
  }

  loadRecipes() {
    this.loading.set(true);
    this.error.set(false);
    this.recipeService.getRecipes().subscribe({
      next: (data) => {
        this.recipes.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  setRating(r: number) {
    this.minRating.set(this.minRating() === r ? 0 : r);
  }

  validateRange() {
    if (this.priceMin() > this.priceMax()) {
      const tmp = this.priceMin();
      this.priceMin.set(this.priceMax());
      this.priceMax.set(tmp);
    }
  }

  addTag(t: string) {
    if (!this.selectedTags().includes(t)) this.selectedTags.update(arr => [...arr, t]);
    this.tagSearch.set('');
    this.showTagsDropdown.set(false);
  }
  removeTag(t: string) {
    this.selectedTags.update(arr => arr.filter(x => x !== t));
  }
  closeTagsDropdown() { setTimeout(() => this.showTagsDropdown.set(false), 200); }

  addIngredient(i: string) {
    if (!this.selectedIngredients().includes(i)) this.selectedIngredients.update(arr => [...arr, i]);
    this.ingredientSearch.set('');
    this.showIngredientDropdown.set(false);
  }
  removeIngredient(i: string) {
    this.selectedIngredients.update(arr => arr.filter(x => x !== i));
  }
  closeIngredientDropdown() { setTimeout(() => this.showIngredientDropdown.set(false), 200); }

  addPerson(p: string) {
    if (!this.selectedPersons().includes(p)) this.selectedPersons.update(arr => [...arr, p]);
    this.personsSearch.set('');
    this.showPersonsDropdown.set(false);
  }
  removePerson(p: string) {
    this.selectedPersons.update(arr => arr.filter(x => x !== p));
  }
  closePersonsDropdown() { setTimeout(() => this.showPersonsDropdown.set(false), 200); }

  clearFilters() {
    this.searchQuery.set('');
    this.selectedCategory.set('');
    this.selectedDifficulty.set('');
    this.minRating.set(0);
    this.priceMin.set(0);
    this.priceMax.set(200);
    this.selectedTags.set([]);
    this.selectedIngredients.set([]);
    this.selectedPersons.set([]);
    this.tagSearch.set('');
    this.ingredientSearch.set('');
    this.personsSearch.set('');
  }

  updateSearch(query: string) {
    this.searchQuery.set(query);
  }
}

