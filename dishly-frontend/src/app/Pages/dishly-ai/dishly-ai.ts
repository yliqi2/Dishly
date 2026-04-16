import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { SpoonacularService, SpoonacularRecipe } from '../../Core/Services/Spoonacular/spoonacular.service';
import { debounceTime, Subject, switchMap, catchError, of, finalize } from 'rxjs';

@Component({
  selector: 'app-dishly-ai',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './dishly-ai.html',
  styleUrl: './dishly-ai.css',
})
export class DishlyAi {
  private spoonacular = inject(SpoonacularService);

  searchQuery = '';
  recipes = signal<SpoonacularRecipe[]>([]);
  selectedRecipe = signal<SpoonacularRecipe | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  hasSearched = signal(false);

  private searchSubject = new Subject<string>();

  onSearch(): void {
    const query = this.searchQuery.trim();
    if (!query) return;

    this.loading.set(true);
    this.error.set(null);
    this.hasSearched.set(true);
    this.selectedRecipe.set(null);

    this.spoonacular.searchRecipes(query).pipe(
      catchError(() => {
        this.error.set('Failed to fetch recipes. Please check your API key or try again later.');
        return of({ results: [], offset: 0, number: 0, totalResults: 0 });
      }),
      finalize(() => this.loading.set(false))
    ).subscribe(res => {
      this.recipes.set(res.results);
    });
  }

  selectRecipe(recipe: SpoonacularRecipe): void {
    this.selectedRecipe.set(recipe === this.selectedRecipe() ? null : recipe);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.recipes.set([]);
    this.selectedRecipe.set(null);
    this.hasSearched.set(false);
    this.error.set(null);
  }

  stripHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.onSearch();
  }
}

