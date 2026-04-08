import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { RecetaOriginal } from '../../Interfaces/RecetaOriginal';
import { AuthServices } from '../Auth/auth-services';

export interface CartItem {
  id_receta: number;
  title: string;
  author: string;
  price: number;
  imageUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly storageKey = 'dishly_cart';
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly authService = inject(AuthServices);
  private readonly itemsSubject = new BehaviorSubject<CartItem[]>(this.readItems());

  readonly items$ = this.itemsSubject.asObservable();

  getItems(): CartItem[] {
    return this.itemsSubject.value;
  }

  hasRecipe(recipeId: number): boolean {
    return this.getItems().some(item => item.id_receta === recipeId);
  }

  addRecipe(recipe: RecetaOriginal): { added: boolean; duplicate: boolean } {
    const items = this.getItems();
    if (items.some(item => item.id_receta === recipe.id_receta)) {
      return { added: false, duplicate: true };
    }

    const imagePath = recipe.imagen_1 ?? recipe.imagen_2 ?? recipe.imagen_3 ?? recipe.imagen_4 ?? recipe.imagen_5 ?? '';
    const price = Number(recipe.price ?? 0);

    const newItem: CartItem = {
      id_receta: recipe.id_receta,
      title: recipe.titulo,
      author: recipe.autor_nombre,
      price: Number.isFinite(price) ? price : 0,
      imageUrl: this.authService.getAssetUrl(imagePath),
    };

    this.saveItems([...items, newItem]);
    return { added: true, duplicate: false };
  }

  removeRecipe(recipeId: number): void {
    this.saveItems(this.getItems().filter(item => item.id_receta !== recipeId));
  }

  clearCart(): void {
    this.saveItems([]);
  }

  private readItems(): CartItem[] {
    if (!this.isBrowser) {
      return [];
    }

    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  }

  private saveItems(items: CartItem[]): void {
    if (this.isBrowser) {
      localStorage.setItem(this.storageKey, JSON.stringify(items));
    }

    this.itemsSubject.next(items);
  }
}
