import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { RecipeCardComponent } from '../../../Core/Components/recipe-card/recipe-card';
import { RecipeService } from '../../../Core/Services/Recipes/recipe.service';
import { RecetaCard } from '../../../Core/Interfaces/RecetaCard';
import { DishlySelectComponent, SelectOption } from '../../../Core/Components/dishly-select/dishly-select';
import { Breadcrumbs } from '../../../Core/Components/breadcrumbs/breadcrumbs';

@Component({
  selector: 'app-search-recipes',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule, RecipeCardComponent, DishlySelectComponent, Breadcrumbs],
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

  // Sirve para obtener las categorías de las recetas
  categories = computed(() => {
    const cats = new Set<string>();
    this.recipes().forEach(r => r.categorias?.forEach(c => cats.add(c.nombre)));
    return Array.from(cats).sort();
  });

  // Sirve para obtener las dificultades de las recetas
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

  // Sirve para obtener las categorías de las recetas
  categoryOptions = computed<SelectOption[]>(() => [
    { value: '', label: 'All Categories' },
    ...this.categories().map(c => ({ value: c, label: c })),
  ]);

  // Sirve para obtener los ingredientes de las recetas
  ingredientOptions = computed<SelectOption[]>(() => {
    return [
      { value: '', label: 'Select ingredient...' },
      ...this.ingredientCatalog()
        .filter(i => !this.selectedIngredients().includes(i))
        .map(i => ({ value: i, label: i })),
    ];
  });

  // Sirve para obtener las personas de las recetas
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

  // Sirve para obtener las etiquetas de las recetas
  tagsOptions = computed<SelectOption[]>(() => {
    return [
      { value: '', label: 'Select tag...' },
      ...this.categories()
        .filter(t => !this.selectedTags().includes(t))
        .map(t => ({ value: t, label: t })),
    ];
  });

  // Sirve para obtener la calificación mostrada
  displayRating = computed(() => this.hoveredRating() || this.minRating());

  // Sirve para filtrar las recetas
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

      // Sirve para validar si las etiquetas, ingredientes y personas coinciden con la receta
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

  // Sirve para validar si hay filtros activos
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

  // Sirve para inicializar el componente
  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['q']) this.searchQuery.set(params['q']);
    });
    this.loadIngredients();
    this.loadRecipes();
  }

  // Sirve para cargar las recetas
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

  // Sirve para cargar los ingredientes
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

  // Sirve para establecer la calificación
  setRating(r: number) {
    this.minRating.set(this.minRating() === r ? 0 : r);
  }

  // Sirve para establecer la calificación al pasar el mouse
  setHoverRating(r: number) {
    this.hoveredRating.set(r);
  }

  // Sirve para limpiar la calificación al pasar el mouse
  clearHoverRating() {
    this.hoveredRating.set(0);
  }

  // Sirve para validar el rango de precios
  validateRange() {
    if (this.priceMin() > this.priceMax()) {
      const tmp = this.priceMin();
      this.priceMin.set(this.priceMax());
      this.priceMax.set(tmp);
    }
  }

  // Sirve para agregar una etiqueta
  addTag(t: string) {
    if (!t) return;
    if (!this.selectedTags().includes(t)) this.selectedTags.update(arr => [...arr, t]);
    this.tagsPickerValue.set('');
  }

  // Sirve para eliminar una etiqueta
  removeTag(t: string) {
    this.selectedTags.update(arr => arr.filter(x => x !== t));
  }

  // Sirve para agregar un ingrediente
  addIngredient(i: string) {
    if (!i) return;
    if (!this.selectedIngredients().includes(i)) this.selectedIngredients.update(arr => [...arr, i]);
    this.ingredientPickerValue.set('');
  }

  // Sirve para eliminar un ingrediente
  removeIngredient(i: string) {
    this.selectedIngredients.update(arr => arr.filter(x => x !== i));
  }

  // Sirve para agregar una persona
  addPerson(p: string) {
    if (!p) return;
    if (!this.selectedPersons().includes(p)) this.selectedPersons.update(arr => [...arr, p]);
    this.personsPickerValue.set('');
  }

  // Sirve para eliminar una persona
  removePerson(p: string) {
    this.selectedPersons.update(arr => arr.filter(x => x !== p));
  }

  // Sirve para limpiar los filtros
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

  // Sirve para actualizar la búsqueda
  updateSearch(query: string) {
    this.searchQuery.set(query);
  }
}

