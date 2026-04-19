import { Injectable, inject } from '@angular/core';
import { ApiBaseService } from '../api-base.service';
import { RecetaCard } from '../../Interfaces/RecetaCard';
import { Observable, of } from 'rxjs';
import { RecetaOriginal } from '../../Interfaces/RecetaOriginal';
import { AuthServices } from '../Auth/auth-services';

@Injectable({
  providedIn: 'root',
})
export class RecipeService extends ApiBaseService {
  private auth = inject(AuthServices);

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

}
