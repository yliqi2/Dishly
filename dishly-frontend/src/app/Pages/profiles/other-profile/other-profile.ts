import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthServices } from '../../../Core/Services/Auth/auth-services';
import { LucideAngularModule } from 'lucide-angular';
import { Profile as ProfileService, PublicProfileResponse } from '../../../Core/Services/Profile/profile-services';
import { RecipeCardComponent } from '../../../Core/Components/recipe-card/recipe-card';
import { RecetaOriginal } from '../../../Core/Interfaces/RecetaOriginal';
import { Breadcrumbs } from '../../../Core/Components/breadcrumbs/breadcrumbs';

@Component({
  selector: 'app-other-profile',
  imports: [CommonModule, LucideAngularModule, RecipeCardComponent, Breadcrumbs],
  templateUrl: './other-profile.html',
  styleUrl: './other-profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OtherProfile implements OnInit {
  private authService = inject(AuthServices);
  private profileService = inject(ProfileService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Sirve para obtener el usuario
  protected readonly user = signal<PublicProfileResponse['user'] | null>(null);
  protected readonly recipes = signal<RecetaOriginal[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  // Sirve para obtener el ID del usuario autenticado
  protected readonly currentUserId = computed(() => {
    const user = this.authService.getUser() as Record<string, unknown> | null;
    return Number(user?.['id_usuario'] ?? 0);
  });

  // Sirve para obtener la URL del icono del usuario
  protected readonly iconUrl = computed(() => {
    const u = this.user();
    if (!u?.icon_path) return null;
    return this.authService.getAssetUrl(u.icon_path, u.updated_at ?? undefined);
  });

  // Sirve para obtener el nombre de usuario
  protected get displayName(): string {
    const u = this.user();
    return (u?.nombre ?? 'User') as string;
  }

  // Sirve para obtener la fecha de membresía
  protected get memberSince(): string {
    const u = this.user();
    const dateStr = u?.created_at;
    if (dateStr && typeof dateStr === 'string') {
      const date = new Date(dateStr);
      // Sirve para validar si la fecha es válida
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

  // Sirve para iniciar el componente
  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const targetId = Number(idParam ?? 0);

    // Sirve para validar si el usuario existe
    if (!targetId) {
      this.error.set('User not found.');
      this.loading.set(false);
      return;
    }

    // Sirve para validar si el usuario es el mismo que el autenticado
    if (this.currentUserId() === targetId) {
      this.router.navigateByUrl('/profile');
      return;
    }

    // Sirve para obtener el perfil público del usuario
    this.profileService.getPublicProfile(targetId).subscribe({
      next: (response) => {
        this.user.set(response.user);
        this.recipes.set(response.recipes);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load this profile.');
        this.loading.set(false);
      },
    });
  }
}
