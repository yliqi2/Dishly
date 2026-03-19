import { ChangeDetectionStrategy, Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthServices } from '../../Core/Services/Auth/auth-services';
import { LucideAngularModule } from 'lucide-angular';
import { toSignal } from '@angular/core/rxjs-interop';
import { Profile as ProfileService } from '../../Core/Services/Recipes/profile-services';
import { RecipeCardComponent } from '../../Core/Components/recipe-card/recipe-card';

type User = {
  nombre?: string;
  name?: string;
  email?: string;
  created_at?: string;
  icon_path?: string | null;
  updated_at?: string;
  chef?: boolean;
};

@Component({
  selector: 'app-profile',
  imports: [CommonModule, RouterLink, LucideAngularModule, RecipeCardComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Profile {
  private authService = inject(AuthServices);
  private profileService = inject(ProfileService);

  protected readonly user = toSignal<User | null>(this.authService.user$, { initialValue: null });
  protected readonly isLoggingOut = signal(false);

  protected readonly iconUrl = computed(() => {
    const u = this.user() ?? (this.authService.getUser() as User | null);
    if (!u?.icon_path) return null;
    return this.authService.getAssetUrl(u.icon_path, u.updated_at);
  });

  protected get displayName(): string {
    const u = this.user();
    return (u?.nombre ?? u?.name ?? 'User') as string;
  }

  protected readonly myRecipesCount = toSignal(this.profileService.getCountRecipes(), { initialValue: 0 });
  protected readonly myRecipes = toSignal(this.profileService.getMyRecipes(), { initialValue: [] });
  protected readonly boughtRecipesCount = computed(() => 0);

  protected get memberSince(): string {
    const u = this.user();
    const dateStr = (u as Record<string, unknown>)?.['created_at'] ?? (u as Record<string, unknown>)?.['fecha_registro'];
    if (dateStr && typeof dateStr === 'string') {
      const date = new Date(dateStr);
      if (!Number.isNaN(date.getTime())) {
        const formatted = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        return `Member since ${formatted}`;
      }
    }
    return 'Member since —';
  }

  protected logout(): void {
    this.isLoggingOut.set(true);
    this.authService.logout();
  }
}
