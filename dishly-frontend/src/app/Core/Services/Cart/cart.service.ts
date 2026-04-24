import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { RecetaOriginal } from '../../Interfaces/RecetaOriginal';
import { AuthServices } from '../Auth/auth-services';
import { CartItem } from '../../Interfaces/CartItem';
import { CartApiItem, CartResponse } from '../../Interfaces/CartResponse';
import { PayCartResponse } from '../../Interfaces/PayCartResponse';
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

    // Sirve para suscribirse al usuario y cargar el carrito
    this.authService.user$.subscribe((user) => {
      if (user && this.authService.isAuthenticated()) {
        this.loadCart().subscribe();
        return;
      }

      this.itemsSubject.next([]);
    });
  }

  // Sirve para obtener los items del carrito
  getItems(): CartItem[] {
    return this.itemsSubject.value;
  }

  // Sirve para verificar si una receta está en el carrito
  hasRecipe(recipeId: number): boolean {
    return this.getItems().some((item) => item.id_receta === recipeId);
  }

  // Sirve para cargar el carrito
  loadCart(): Observable<CartItem[]> {
    if (!this.authService.isAuthenticated()) {
      this.itemsSubject.next([]);
      return of([]);
    }

    // Sirve para obtener el carrito
    return this.http.get<CartResponse>(`${this.apiUrl}/carrito`).pipe(
      // Sirve para mapear los items del carrito
      map((response) => (response.items ?? []).map((item) => this.mapCartItem(item))),
      // Sirve para actualizar el cache de items del carrito
      tap((items) => this.itemsSubject.next(items)),
      catchError(() => {
        this.itemsSubject.next([]);
        return of([]);
      })
    );
  }

  // Sirve para agregar una receta al carrito
  addRecipe(recipe: RecetaOriginal): Observable<{ added: boolean; duplicate: boolean }> {
    if (!this.authService.isAuthenticated()) {
      return of({ added: false, duplicate: false });
    }

    // Sirve para agregar una receta al carrito
    return this.http.post(`${this.apiUrl}/carrito`, { id_receta: recipe.id_receta }).pipe(
      // Sirve para actualizar el cache de items del carrito
      tap(() => {
        const items = this.getItems();
        if (!items.some((item) => item.id_receta === recipe.id_receta)) {
          this.itemsSubject.next([...items, this.toCartItem(recipe)]);
        }
      }),
      // Sirve para mapear el resultado de la adición de la receta al carrito
      map(() => ({ added: true, duplicate: false })),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 409) {
          return of({ added: false, duplicate: true });
        }

        return throwError(() => error);
      })
    );
  }

  // Sirve para eliminar una receta del carrito
  removeRecipe(recipeId: number): Observable<boolean> {
    if (!this.authService.isAuthenticated()) {
      return of(false);
    }

    // Sirve para eliminar una receta del carrito
    return this.http.delete(`${this.apiUrl}/carrito/recipe/${recipeId}`).pipe(
      tap(() => this.itemsSubject.next(this.getItems().filter((item) => item.id_receta !== recipeId))),
      map(() => true),
      catchError(() => of(false))
    );
  }

  // Sirve para limpiar el carrito
  clearCart(): Observable<boolean> {
    if (!this.authService.isAuthenticated()) {
      this.itemsSubject.next([]);
      return of(true);
    }

    // Sirve para limpiar el carrito
    return this.http.delete(`${this.apiUrl}/carrito`).pipe(
      tap(() => this.itemsSubject.next([])),
      map(() => true),
      catchError(() => of(false))
    );
  }

  // Sirve para pagar el carrito
  payCart(): Observable<PayCartResponse> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('Unauthenticated.'));
    }

    // Sirve para pagar el carrito
    return this.http.post<PayCartResponse>(`${this.apiUrl}/carrito/pagar`, {}).pipe(
      // Sirve para mapear el resultado de la pago del carrito
      map((response) => ({
        ...response,
        purchased_items: (response.purchased_items ?? []).map((item) => ({
          ...item,
          imagen_1: item.imagen_1 ? this.authService.getAssetUrl(item.imagen_1, item.updated_at ?? undefined) : null,
        })),
      })),
      // Sirve para actualizar el cache de items del carrito
      tap(() => this.itemsSubject.next([]))
    );
  }

  // Sirve para mapear un item del carrito
  private mapCartItem(item: CartApiItem): CartItem {
    const imagePath = item.imagen_1 ?? item.imagen_2 ?? item.imagen_3 ?? item.imagen_4 ?? item.imagen_5 ?? '';
    const price = Number(item.precio_unitario ?? item.price ?? 0);

    // Sirve para mapear un item del carrito
    return {
      id_receta: item.id_receta,
      title: item.titulo ?? 'Recipe',
      author: item.autor_nombre ?? 'Dishly Chef',
      description: item.descripcion ?? 'A premium recipe ready to complete your next meal.',
      price: Number.isFinite(price) ? price : 0,
      imageUrl: this.authService.getAssetUrl(imagePath, item.updated_at ?? undefined),
    };
  }

  // Sirve para convertir una receta a un item del carrito
  private toCartItem(recipe: RecetaOriginal): CartItem {
    const imagePath = recipe.imagen_1 ?? recipe.imagen_2 ?? recipe.imagen_3 ?? recipe.imagen_4 ?? recipe.imagen_5 ?? '';
    const price = Number(recipe.price ?? 0);

    // Sirve para convertir una receta a un item del carrito
    return {
      id_receta: recipe.id_receta,
      title: recipe.titulo,
      author: recipe.autor_nombre,
      description: recipe.descripcion ?? 'A premium recipe ready to complete your next meal.',
      price: Number.isFinite(price) ? price : 0,
      imageUrl: this.authService.getAssetUrl(imagePath, recipe.updated_at ?? undefined),
    };
  }
}
