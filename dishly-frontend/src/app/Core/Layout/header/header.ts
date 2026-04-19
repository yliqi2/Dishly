import { ChangeDetectionStrategy, Component, computed, signal, inject, HostListener } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthServices } from '../../Services/Auth/auth-services';
import { CartService } from '../../Services/Cart/cart.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';

type AuthUser = {
  nombre?: string;
  name?: string;
  email?: string;
  icon_path?: string | null;
  updated_at?: string;
  chef?: boolean;
};

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, NgOptimizedImage, LucideAngularModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  private authService = inject(AuthServices);
  private cartService = inject(CartService);

  protected readonly menuOpen = signal(false);
  protected readonly mobileMenuOpen = signal(false);
  protected readonly isLoggingOut = signal(false);

  private readonly user = toSignal<AuthUser | null>(this.authService.user$, { initialValue: null });
  private readonly cartItems = toSignal(this.cartService.items$, { initialValue: [] });

  protected readonly isAuthenticated = computed(() => !!this.user());
  protected readonly cartCount = computed(() => this.cartItems().length);
  protected readonly cartBadgeText = computed(() => this.cartCount() > 99 ? '99+' : String(this.cartCount()));
  protected readonly displayName = computed(() => this.user()?.nombre || this.user()?.name || 'User');
  protected readonly chef = computed(() => this.user()?.chef ?? false);
  protected readonly userInitial = computed(() => this.displayName().charAt(0).toUpperCase());
  protected readonly iconUrl = computed(() => {
    const u = this.user() ?? (this.authService.getUser() as AuthUser | null);
    if (!u?.icon_path) return null;
    return this.authService.getAssetUrl(u.icon_path, u.updated_at);
  });

  protected readonly navItems = [
    { label: 'Home', route: '/' },
    { label: 'Recipes', route: '/my-recipes' },
    { label: 'Dishly AI', route: '/dishly-ai' },
    { label: 'Forum', route: '/forum' },
  ];

  protected toggleMenu(): void {
    this.menuOpen.update(value => !value);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected onMenuFocusOut(event: FocusEvent): void {
    const wrapper = event.currentTarget as HTMLElement | null;
    const next = event.relatedTarget as Node | null;
    if (!wrapper || (next && wrapper.contains(next))) return;
    this.closeMenu();
  }

  @HostListener('document:keydown.escape')
  protected onEscapeKey(): void {
    if (this.menuOpen()) this.closeMenu();
  }

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.update(value => !value);
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  protected logout(): void {
    this.isLoggingOut.set(true);
    this.closeMenu();
    this.closeMobileMenu();
    this.authService.logout().subscribe({
      error: () => this.isLoggingOut.set(false),
    });
  }
}
