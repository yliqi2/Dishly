import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { RecipeCardComponent } from '../../../Core/Components/recipe-card/recipe-card';
import { RecetaOriginal } from '../../../Core/Interfaces/RecetaOriginal';
import { RecipeService } from '../../../Core/Services/Recipes/recipe.service';

@Component({
  selector: 'app-bought-recipes',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, RecipeCardComponent],
  templateUrl: './bought-recipes.html',
  styleUrl: './bought-recipes.css',
})
export class BoughtRecipes implements OnInit {
  private recipeService = inject(RecipeService);

  recipes = signal<RecetaOriginal[]>([]);
  loading = signal(true);
  error = signal(false);

  searchQuery = signal('');

  filteredRecipes = computed(() => {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.recipes();
    return this.recipes().filter(r =>
      r.titulo.toLowerCase().includes(q) ||
      r.descripcion.toLowerCase().includes(q) ||
      r.categorias?.some(c => c.nombre.toLowerCase().includes(q))
    );
  });

  ngOnInit(): void {
    this.recipeService.getAcquiredRecipes().subscribe({
      next: (data) => {
        this.recipes.set(data);
        console.log('Acquired recipes:', data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }
}
