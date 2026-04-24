import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SpoonacularSearchResponse } from '../../Interfaces/Spoonacular';

const SPOONACULAR_BASE_URL = 'https://api.spoonacular.com';

@Injectable({
  providedIn: 'root',
})
export class SpoonacularService {
  private http = inject(HttpClient);

  // Sirve para buscar recetas en Spoonacular
  searchRecipes(query: string, number: number = 1): Observable<SpoonacularSearchResponse> {
    const params = new HttpParams()
      .set('query', query)
      .set('number', number.toString())
      .set('addRecipeInformation', 'true')
      .set('addRecipeInstructions', 'true')
      .set('fillIngredients', 'true')
      .set('apiKey', environment.spoonacularApiKey);

  // Realiza la busqueda de recetas en Spoonacular y devuelve la respuesta tipada.
    return this.http.get<SpoonacularSearchResponse>(
      `${SPOONACULAR_BASE_URL}/recipes/complexSearch`,
      { params, observe: 'response' }
    ).pipe(
      // Registra en consola el consumo de cuota de la API para monitoreo.
      tap(res => {
        const left = res.headers.get('X-API-Quota-Left');
        const used = res.headers.get('X-API-Quota-Used');
        console.log(`[Spoonacular] Tokens usados: ${used} | Tokens restantes: ${left}`);
      }),
      
      // Extrae el body del HttpResponse para exponer solo los datos utiles.
      map(res => res.body!)
    );
  }
}
