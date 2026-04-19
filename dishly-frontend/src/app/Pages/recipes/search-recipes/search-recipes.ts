import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { RecipeCardComponent } from '../../../Core/Components/recipe-card/recipe-card';
import { RecipeService } from '../../../Core/Services/Recipes/recipe.service';
import { RecetaCard } from '../../../Core/Interfaces/RecetaCard';
import { DishlySelectComponent, SelectOption } from '../../../Core/Components/dishly-select/dishly-select';

@Component({
  selector: 'app-search-recipes',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule, RecipeCardComponent, DishlySelectComponent],
  templateUrl: './search-recipes.html',
  styleUrl: './search-recipes.css',
})
export class SearchRecipes implements OnInit {
  private recipeService = inject(RecipeService);
  private route = inject(ActivatedRoute);

  recipes = signal<RecetaCard[]>([]);
  loading = signal(true);
  error = signal(false);

  searchQuery = signal('');
  selectedCategory = signal('');
  selectedDifficulty = signal('');
  minRating = signal(0);
  hoveredRating = signal(0);
  priceMin = signal(0);
  priceMax = signal(200);

  ingredientPickerValue = signal('');
  personsPickerValue = signal('');
  tagsPickerValue = signal('');
  ingredientCatalog = signal<string[]>([]);

  selectedTags = signal<string[]>([]);
  selectedIngredients = signal<string[]>([]);
  selectedPersons = signal<string[]>([]);

  categories = computed(() => {
    const cats = new Set<string>();
    this.recipes().forEach(r => r.categorias?.forEach(c => cats.add(c.nombre)));
    return Array.from(cats).sort();
  });

  difficultyOptions = computed<SelectOption[]>(() => {
    const levels = Array.from(
      new Set(
        this.recipes()
          .map(r => (r.dificultad ?? '').toString().trim())
          .filter(v => v !== ''),
      ),
    ).sort((a, b) => a.localeCompare(b));

    return [
      { value: '', label: 'All Levels' },
      ...levels.map(level => ({
        value: level,
        label: level.charAt(0).toUpperCase() + level.slice(1),
      })),
    ];
  });

  categoryOptions = computed<SelectOption[]>(() => [
    { value: '', label: 'All Categories' },
    ...this.categories().map(c => ({ value: c, label: c })),
  ]);

  ingredientOptions = computed<SelectOption[]>(() => {
    return [
      { value: '', label: 'Select ingredient...' },
      ...this.ingredientCatalog()
        .filter(i => !this.selectedIngredients().includes(i))
        .map(i => ({ value: i, label: i })),
    ];
  });

  personsOptions = computed<SelectOption[]>(() => {
    const portions = Array.from(
      new Set(
        this.recipes()
          .map(r => Number(r.porciones))
          .filter(v => Number.isFinite(v) && v > 0),
      ),
    ).sort((a, b) => a - b);

    const values = portions
      .filter(v => v < 4)
      .map(v => String(v));

    if (portions.some(v => v >= 4)) {
      values.push('4+');
    }

    return [
      { value: '', label: 'Select persons...' },
      ...values
        .filter(p => !this.selectedPersons().includes(p))
        .map(p => ({ value: p, label: p })),
    ];
  });

  tagsOptions = computed<SelectOption[]>(() => {
    return [
      { value: '', label: 'Select tag...' },
      ...this.categories()
        .filter(t => !this.selectedTags().includes(t))
        .map(t => ({ value: t, label: t })),
    ];
  });

  displayRating = computed(() => this.hoveredRating() || this.minRating());

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
        matchesPersons = personsList.includes(String(recipe.porciones)) || (personsList.includes('4+') && recipe.porciones >= 4);
      }

      return matchesSearch && matchesCategory && matchesDifficulty && matchesRating && matchesPrice && matchesTags && matchesIngredients && matchesPersons;
    });
  });

  hasActiveFilters = computed(() => {
    return !!this.searchQuery().trim()
      || !!this.selectedCategory()
      || !!this.selectedDifficulty()
      || this.minRating() > 0
      || this.priceMin() > 0
      || this.priceMax() < 200
      || this.selectedTags().length > 0
      || this.selectedIngredients().length > 0
      || this.selectedPersons().length > 0;
  });

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['q']) this.searchQuery.set(params['q']);
    });
    this.loadIngredients();
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

  loadIngredients() {
    this.recipeService.getIngredients().subscribe({
      next: (data) => {
        this.ingredientCatalog.set(data);
      },
      error: () => {
        this.ingredientCatalog.set([]);
      },
    });
  }

  setRating(r: number) {
    this.minRating.set(this.minRating() === r ? 0 : r);
  }

  setHoverRating(r: number) {
    this.hoveredRating.set(r);
  }

  clearHoverRating() {
    this.hoveredRating.set(0);
  }

  validateRange() {
    if (this.priceMin() > this.priceMax()) {
      const tmp = this.priceMin();
      this.priceMin.set(this.priceMax());
      this.priceMax.set(tmp);
    }
  }

  addTag(t: string) {
    if (!t) return;
    if (!this.selectedTags().includes(t)) this.selectedTags.update(arr => [...arr, t]);
    this.tagsPickerValue.set('');
  }
  removeTag(t: string) {
    this.selectedTags.update(arr => arr.filter(x => x !== t));
  }

  addIngredient(i: string) {
    if (!i) return;
    if (!this.selectedIngredients().includes(i)) this.selectedIngredients.update(arr => [...arr, i]);
    this.ingredientPickerValue.set('');
  }
  removeIngredient(i: string) {
    this.selectedIngredients.update(arr => arr.filter(x => x !== i));
  }

  addPerson(p: string) {
    if (!p) return;
    if (!this.selectedPersons().includes(p)) this.selectedPersons.update(arr => [...arr, p]);
    this.personsPickerValue.set('');
  }
  removePerson(p: string) {
    this.selectedPersons.update(arr => arr.filter(x => x !== p));
  }

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
    this.tagsPickerValue.set('');
    this.ingredientPickerValue.set('');
    this.personsPickerValue.set('');
  }

  updateSearch(query: string) {
    this.searchQuery.set(query);
  }
}

