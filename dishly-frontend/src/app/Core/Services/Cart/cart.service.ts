import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { RecetaOriginal } from '../../Interfaces/RecetaOriginal';
import { AuthServices } from '../Auth/auth-services';
import { CartItem } from '../../Interfaces/CartItem';
import { CartApiItem, CartResponse } from '../../Interfaces/CartResponse';
import { ApiBaseService } from '../api-base.service';

@Injectable({
  providedIn: 'root'
})
export class CartService extends ApiBaseService {
  private readonly authService = inject(AuthServices);
  private readonly itemsSubject = new BehaviorSubject<CartItem[]>([]);

  readonly items$ = this.itemsSubject.asObservable();

  constructor() {
    super();

    this.authService.user$.subscribe((user) => {
      if (user && this.authService.isAuthenticated()) {
        this.loadCart().subscribe();
        return;
      }

      this.itemsSubject.next([]);
    });
  }

  getItems(): CartItem[] {
    return this.itemsSubject.value;
  }

  hasRecipe(recipeId: number): boolean {
    return this.getItems().some((item) => item.id_receta === recipeId);
  }

  loadCart(): Observable<CartItem[]> {
    if (!this.authService.isAuthenticated()) {
      this.itemsSubject.next([]);
      return of([]);
    }

    return this.http.get<CartResponse>(`${this.apiUrl}/carrito`).pipe(
      map((response) => (response.items ?? []).map((item) => this.mapCartItem(item))),
      tap((items) => this.itemsSubject.next(items)),
      catchError(() => {
        this.itemsSubject.next([]);
        return of([]);
      })
    );
  }

  addRecipe(recipe: RecetaOriginal): Observable<{ added: boolean; duplicate: boolean }> {
    if (!this.authService.isAuthenticated()) {
      return of({ added: false, duplicate: false });
    }

    return this.http.post(`${this.apiUrl}/carrito`, { id_receta: recipe.id_receta }).pipe(
      tap(() => {
        const items = this.getItems();
        if (!items.some((item) => item.id_receta === recipe.id_receta)) {
          this.itemsSubject.next([...items, this.toCartItem(recipe)]);
        }
      }),
      map(() => ({ added: true, duplicate: false })),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 409) {
          return of({ added: false, duplicate: true });
        }

        return throwError(() => error);
      })
    );
  }

  removeRecipe(recipeId: number): Observable<boolean> {
    if (!this.authService.isAuthenticated()) {
      return of(false);
    }

    return this.http.delete(`${this.apiUrl}/carrito/recipe/${recipeId}`).pipe(
      tap(() => this.itemsSubject.next(this.getItems().filter((item) => item.id_receta !== recipeId))),
      map(() => true),
      catchError(() => of(false))
    );
  }

  clearCart(): Observable<boolean> {
    if (!this.authService.isAuthenticated()) {
      this.itemsSubject.next([]);
      return of(true);
    }

    return this.http.delete(`${this.apiUrl}/carrito`).pipe(
      tap(() => this.itemsSubject.next([])),
      map(() => true),
      catchError(() => of(false))
    );
  }

  private mapCartItem(item: CartApiItem): CartItem {
    const imagePath = item.imagen_1 ?? item.imagen_2 ?? item.imagen_3 ?? item.imagen_4 ?? item.imagen_5 ?? '';
    const price = Number(item.precio_unitario ?? item.price ?? 0);

    return {
      id_receta: item.id_receta,
      title: item.titulo ?? 'Recipe',
      author: item.autor_nombre ?? 'Dishly Chef',
      description: item.descripcion ?? 'A premium recipe ready to complete your next meal.',
      price: Number.isFinite(price) ? price : 0,
      imageUrl: this.authService.getAssetUrl(imagePath),
    };
  }

  private toCartItem(recipe: RecetaOriginal): CartItem {
    const imagePath = recipe.imagen_1 ?? recipe.imagen_2 ?? recipe.imagen_3 ?? recipe.imagen_4 ?? recipe.imagen_5 ?? '';
    const price = Number(recipe.price ?? 0);

    return {
      id_receta: recipe.id_receta,
      title: recipe.titulo,
      author: recipe.autor_nombre,
      description: recipe.descripcion ?? 'A premium recipe ready to complete your next meal.',
      price: Number.isFinite(price) ? price : 0,
      imageUrl: this.authService.getAssetUrl(imagePath),
    };
  }
}
