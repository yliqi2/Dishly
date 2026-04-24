import { Injectable } from '@angular/core';
import { inject } from '@angular/core';
import { AuthServices } from '../Auth/auth-services';
import { ApiBaseService } from '../api-base.service';
import { RecetaCard } from '../../Interfaces/RecetaCard';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HomepageService extends ApiBaseService {
  protected readonly auth = inject(AuthServices);

  // Sirve para obtener las recetas
  getRecipes(): Observable<RecetaCard[]> {
    return this.http.get<RecetaCard[]>(`${this.apiUrl}/recipes`).pipe(
      // Sirve para manejar el resultado de la obtención de recetas
      tap(res => console.log('getRecipes response:', res))
    );
  }
}
