import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { CartService } from '../../../Core/Services/Cart/cart.service';
import { ChefAnimation } from '../../../Core/Components/chef-animation/chef-animation';
import { Breadcrumbs } from '../../../Core/Components/breadcrumbs/breadcrumbs';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, ChefAnimation, Breadcrumbs],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart implements OnInit {
  private readonly cartService = inject(CartService);

  protected readonly items = toSignal(this.cartService.items$, {
    initialValue: this.cartService.getItems(),
  });

  protected readonly total = computed(() => {
    return this.items().reduce((sum, item) => sum + item.price, 0);
  });

  protected readonly itemCount = computed(() => this.items().length);
  protected readonly taxes = computed(() => Number((this.total() * 0.21).toFixed(2)));

  ngOnInit(): void {
    this.cartService.loadCart().subscribe();
  }

  protected removeItem(recipeId: number): void {
    this.cartService.removeRecipe(recipeId).subscribe();
  }

  protected clearCart(): void {
    this.cartService.clearCart().subscribe();
  }
}
