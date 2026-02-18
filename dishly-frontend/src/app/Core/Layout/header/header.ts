import { ChangeDetectionStrategy, Component, computed, signal, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthServices } from '../../../Pages/auth/Services/auth-services';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-header',
  imports: [RouterLink, NgOptimizedImage],
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  private authService = inject(AuthServices);

  protected readonly isAuthenticated = toSignal(
    this.authService.user$.pipe(
      map(user => !!user)
    ),
    { initialValue: false }
  );

  protected readonly navItems = [
    { label: 'Home', route: '/' },
    { label: 'Recipes', route: '/recipes' },
    { label: 'Dishly AI', route: '/dishly-ai' },
  ];

  protected logout(): void {
    this.authService.logout();
  }
}
