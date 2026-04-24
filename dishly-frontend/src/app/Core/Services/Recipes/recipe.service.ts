import { Injectable, inject } from '@angular/core';
import { ApiBaseService } from '../api-base.service';
import { RecetaCard } from '../../Interfaces/RecetaCard';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { RecetaOriginal } from '../../Interfaces/RecetaOriginal';
import { AuthServices } from '../Auth/auth-services';

@Injectable({
  providedIn: 'root',
})
export class RecipeService extends ApiBaseService {
  private auth = inject(AuthServices);
  private readonly ingredientsCache$ = new BehaviorSubject<string[] | null>(null);

  getRecipes(): Observable<RecetaCard[]> {
    return this.http.get<RecetaCard[]>(`${this.apiUrl}/recipes`);
  }

  getAcquiredRecipes(): Observable<RecetaOriginal[]> {
    if (!this.auth.isAuthenticated()) return of([]);
    return this.http.get<RecetaOriginal[]>(`${this.apiUrl}/owned-recipes`);
  }

  getAllRecipesAdmin(): Observable<RecetaCard[]> {
    if (!this.auth.isAuthenticated()) return of([]);
    return this.http.get<RecetaCard[]>(`${this.apiUrl}/admin/recipes`);
  }

  getIngredients(forceRefresh = false): Observable<string[]> {
    const cached = this.ingredientsCache$.value;
    if (!forceRefresh && cached) {
      return of(cached);
    }

    return this.http.get<string[]>(`${this.apiUrl}/recetas/ingredientes`).pipe(
      tap((ingredients) => this.ingredientsCache$.next(ingredients)),
    );
  }

}
