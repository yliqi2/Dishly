import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { CategoriaItem } from '../../Interfaces/CategoriaItem';
import { ApiBaseService } from '../api-base.service';

@Injectable({
  providedIn: 'root',
})
export class Categoria extends ApiBaseService {
  private readonly categoriesCache$ = new BehaviorSubject<CategoriaItem[] | null>(null);

  // Sirve para obtener todas las categorias
  getAll(forceRefresh = false): Observable<CategoriaItem[]> {
    const cached = this.categoriesCache$.value;
    if (!forceRefresh && cached) {
      return of(cached);
    }

    return this.http.get<CategoriaItem[]>(`${this.apiUrl}/recetas/categorias`).pipe(
      // Sirve para actualizar el cache de categorias
      tap(categories => this.categoriesCache$.next(categories)),
    );
  }
}
