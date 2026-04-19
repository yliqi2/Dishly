import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { RecipeCardComponent } from '../../../Core/Components/recipe-card/recipe-card';
import { RecetaOriginal } from '../../../Core/Interfaces/RecetaOriginal';
import { RecipeService } from '../../../Core/Services/Recipes/recipe.service';
import { DishlySelectComponent, SelectOption } from '../../../Core/Components/dishly-select/dishly-select';
import { AuthServices } from '../../../Core/Services/Auth/auth-services';

@Component({
  selector: 'app-bought-recipes',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, RecipeCardComponent, DishlySelectComponent],
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
  priceMin = signal(0);
  priceMax = signal(200);

  readonly difficultyOptions: SelectOption[] = [
    { value: '', label: 'All Levels' },
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
  ];

  categories = computed(() => {
    const cats = new Set<string>();
    this.recipes().forEach(r => r.categorias?.forEach(c => cats.add(c.nombre)));
    return Array.from(cats).sort();
  });

  categoryOptions = computed<SelectOption[]>(() => [
    { value: '', label: 'All Categories' },
    ...this.categories().map(c => ({ value: c, label: c })),
  ]);

  filteredRecipes = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const cat = this.selectedCategory();
    const diff = this.selectedDifficulty();
    const min = this.priceMin();
    const max = this.priceMax();

    return this.recipes().filter(r => {
      const titulo = r.titulo?.toLowerCase() ?? '';
      const desc = r.descripcion?.toLowerCase() ?? '';

      const matchesSearch = !q || titulo.includes(q) || desc.includes(q) ||
        r.categorias?.some(c => c.nombre.toLowerCase().includes(q));

      const matchesCategory = !cat || r.categorias?.some(c => c.nombre === cat);

      const matchesDifficulty = !diff || r.dificultad === diff;

      let matchesPrice = true;
      if (r.price !== null && r.price !== undefined) {
        const price = parseFloat(String(r.price));
        matchesPrice = price >= min && price <= max;
      }

      return matchesSearch && matchesCategory && matchesDifficulty && matchesPrice;
    });
  });

  hasActiveFilters = computed(() =>
    !!this.searchQuery() || !!this.selectedCategory() || !!this.selectedDifficulty() ||
    this.priceMin() > 0 || this.priceMax() < 200
  );

  validateRange(): void {
    if (this.priceMin() > this.priceMax()) {
      const tmp = this.priceMin();
      this.priceMin.set(this.priceMax());
      this.priceMax.set(tmp);
    }
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('');
    this.selectedDifficulty.set('');
    this.priceMin.set(0);
    this.priceMax.set(200);
  }

  isAdminUser(): boolean {
    const user = this.authService.getUser() as { rol?: string } | null;
    return user?.rol === 'admin';
  }

  ngOnInit(): void {
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
}
