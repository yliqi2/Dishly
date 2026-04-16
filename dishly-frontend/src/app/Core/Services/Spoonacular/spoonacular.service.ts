import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface SpoonacularRecipe {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  summary: string;
  instructions: string;
  analyzedInstructions: Array<{
    name: string;
    steps: Array<{
      number: number;
      step: string;
      ingredients: Array<{ id: number; name: string; image: string }>;
      equipment: Array<{ id: number; name: string; image: string }>;
    }>;
  }>;
  extendedIngredients: Array<{
    id: number;
    name: string;
    amount: number;
    unit: string;
    original: string;
  }>;
  diets: string[];
  cuisines: string[];
  dishTypes: string[];
  cheap: boolean;
  vegan: boolean;
  vegetarian: boolean;
  glutenFree: boolean;
  dairyFree: boolean;
  healthScore: number;
  sourceUrl: string;
}

export interface SpoonacularSearchResponse {
  results: SpoonacularRecipe[];
  offset: number;
  number: number;
  totalResults: number;
}

const SPOONACULAR_BASE_URL = 'https://api.spoonacular.com';

@Injectable({
  providedIn: 'root',
})
export class SpoonacularService {
  private http = inject(HttpClient);

  searchRecipes(query: string, number: number = 1): Observable<SpoonacularSearchResponse> {
    const params = new HttpParams()
      .set('query', query)
      .set('number', number.toString())
      .set('addRecipeInformation', 'true')
      .set('addRecipeInstructions', 'true')
      .set('fillIngredients', 'true')
      .set('apiKey', environment.spoonacularApiKey);

    return this.http.get<SpoonacularSearchResponse>(
      `${SPOONACULAR_BASE_URL}/recipes/complexSearch`,
      { params, observe: 'response' }
    ).pipe(
      tap(res => {
        const left = res.headers.get('X-API-Quota-Left');
        const used = res.headers.get('X-API-Quota-Used');
        console.log(`[Spoonacular] Tokens usados: ${used} | Tokens restantes: ${left}`);
      }),
      map(res => res.body!)
    );
  }
}
