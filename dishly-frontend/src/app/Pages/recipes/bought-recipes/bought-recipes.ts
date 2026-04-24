import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { RecipeCardComponent } from '../../../Core/Components/recipe-card/recipe-card';
import { RecetaOriginal } from '../../../Core/Interfaces/RecetaOriginal';
import { RecipeService } from '../../../Core/Services/Recipes/recipe.service';
import { DishlySelectComponent, SelectOption } from '../../../Core/Components/dishly-select/dishly-select';
import { AuthServices } from '../../../Core/Services/Auth/auth-services';
import { Breadcrumbs } from '../../../Core/Components/breadcrumbs/breadcrumbs';

@Component({
  selector: 'app-bought-recipes',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, RecipeCardComponent, DishlySelectComponent, Breadcrumbs],
  templateUrl: './bought-recipes.html',
  styleUrl: './bought-recipes.css',
})
export class BoughtRecipes implements OnInit {
  private recipeService = inject(RecipeService);
  private authService = inject(AuthServices);

  recipes = signal<RecetaOriginal[]>([]);
  loading = signal(true);
  error = signal(false);

  searchQuery = signal('');
  selectedCategory = signal('');
  selectedDifficulty = signal('');
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

  // Sirve para filtrar las recetas
  filteredRecipes = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const cat = this.selectedCategory();
    const diff = this.selectedDifficulty();
    const tags = this.selectedTags();
    const ingredients = this.selectedIngredients();
    const personsList = this.selectedPersons();

    return this.recipes().filter(r => {
      const titulo = r.titulo?.toLowerCase() ?? '';
      const desc = r.descripcion?.toLowerCase() ?? '';

      const matchesSearch = !q || titulo.includes(q) || desc.includes(q) ||
        r.categorias?.some(c => c.nombre.toLowerCase().includes(q));

      const matchesCategory = !cat || r.categorias?.some(c => c.nombre === cat);

      const matchesDifficulty = !diff || r.dificultad === diff;

      const matchesTags = tags.length === 0 || tags.every(t => r.categorias?.some(c => c.nombre === t));

      const matchesIngredients = ingredients.length === 0 || ingredients.some(i => {
        const queryLower = i.toLowerCase();
        return titulo.includes(queryLower) || desc.includes(queryLower);
      });

      let matchesPersons = true;
      // Sirve para validar si las personas coinciden con la receta
      if (personsList.length > 0) {
        matchesPersons = personsList.includes(String(r.porciones)) || (personsList.includes('4+') && r.porciones >= 4);
      }

      return matchesSearch && matchesCategory && matchesDifficulty && matchesTags && matchesIngredients && matchesPersons;
    });
  });

  // Sirve para validar si hay filtros activos
  hasActiveFilters = computed(() =>
    !!this.searchQuery() || !!this.selectedCategory() || !!this.selectedDifficulty() ||
    this.selectedTags().length > 0 || this.selectedIngredients().length > 0 || this.selectedPersons().length > 0
  );

  // Sirve para limpiar los filtros
  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('');
    this.selectedDifficulty.set('');
    this.selectedTags.set([]);
    this.selectedIngredients.set([]);
    this.selectedPersons.set([]);
    this.tagsPickerValue.set('');
    this.ingredientPickerValue.set('');
    this.personsPickerValue.set('');
  }

  // Sirve para agregar una etiqueta
  addTag(t: string): void {
    if (!t) return;
    if (!this.selectedTags().includes(t)) this.selectedTags.update(arr => [...arr, t]);
    this.tagsPickerValue.set('');
  }

  // Sirve para eliminar una etiqueta
  removeTag(t: string): void {
    this.selectedTags.update(arr => arr.filter(x => x !== t));
  }

  // Sirve para agregar un ingrediente
  addIngredient(i: string): void {
    if (!i) return;
    if (!this.selectedIngredients().includes(i)) this.selectedIngredients.update(arr => [...arr, i]);
    this.ingredientPickerValue.set('');
  }

  // Sirve para eliminar un ingrediente
  removeIngredient(i: string): void {
    this.selectedIngredients.update(arr => arr.filter(x => x !== i));
  }

  // Sirve para agregar una persona
  addPerson(p: string): void {
    if (!p) return;
    if (!this.selectedPersons().includes(p)) this.selectedPersons.update(arr => [...arr, p]);
    this.personsPickerValue.set('');
  }

  // Sirve para eliminar una persona
  removePerson(p: string): void {
    this.selectedPersons.update(arr => arr.filter(x => x !== p));
  }

  // Sirve para validar si el usuario es administrador
  isAdminUser(): boolean {
    const user = this.authService.getUser() as { rol?: string } | null;
    return user?.rol === 'admin';
  }

  // Sirve para iniciar el componente
  ngOnInit(): void {
    this.loadIngredients();
    if (this.isAdminUser()) {
      this.recipeService.getAllRecipesAdmin().subscribe({
        next: (data) => {
          this.recipes.set(data as unknown as RecetaOriginal[]);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        }
      });
    } else {
      this.recipeService.getAcquiredRecipes().subscribe({
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
  }

  // Sirve para cargar los ingredientes
  private loadIngredients(): void {
    this.recipeService.getIngredients().subscribe({
      next: (data) => {
        this.ingredientCatalog.set(data);
      },
      error: () => {
        this.ingredientCatalog.set([]);
      },
    });
  }
}
