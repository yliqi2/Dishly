import { ChangeDetectionStrategy, Component, computed, signal, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthServices } from '../../../Pages/auth/Services/auth-services';
import { toSignal } from '@angular/core/rxjs-interop';

type AuthUser = {
  nombre?: string;
  name?: string;
  email?: string;
};

@Component({
  selector: 'app-header',
  imports: [RouterLink, NgOptimizedImage],
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  private authService = inject(AuthServices);

  protected readonly menuOpen = signal(false);

  private readonly user = toSignal<AuthUser | null>(this.authService.user$, { initialValue: null });

  protected readonly isAuthenticated = computed(() => !!this.user());
  protected readonly displayName = computed(() => this.user()?.nombre || this.user()?.name || 'User');
  protected readonly userInitial = computed(() => this.displayName().charAt(0).toUpperCase());

  protected readonly navItems = [
    { label: 'Home', route: '/' },
    { label: 'Recipes', route: '/recipes' },
    { label: 'Dishly AI', route: '/dishly-ai' },
    { label: 'Forum', route: '/forum' },
  ];

  protected toggleMenu(): void {
    this.menuOpen.update(value => !value);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected logout(): void {
    this.closeMenu();
    this.authService.logout();
  }
}
