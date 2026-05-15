import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { RecetaCard } from '../../Interfaces/RecetaCard';
import { AuthServices } from '../../Services/Auth/auth-services';
import { DeleteRecipeModal } from '../modals/delete-recipe-modal/delete-recipe-modal';

@Component({
  selector: 'app-recipe-card',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, DeleteRecipeModal],
  templateUrl: './recipe-card.html',
  styleUrl: './recipe-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecipeCardComponent {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthServices);

  receta = input.required<RecetaCard>();
  showPrice = input(true);
  recipeDeactivated = output<number>();
  protected readonly isDeactivating = signal(false);
  protected readonly showDeleteModal = signal(false);
  private readonly currentUser = toSignal(this.authService.user$, {
    initialValue: null as Record<string, unknown> | null,
  });

  protected readonly displayedCategories = computed(() => {
    return (this.receta().categorias ?? []).slice(0, 2);
  });

  protected readonly extraCategoriesCount = computed(() => {
    const cats = this.receta().categorias ?? [];
    return cats.length > 2 ? cats.length - 2 : 0;
  });

  protected readonly publishedDate = computed(() => {
    const dateStr = this.receta().fecha_creacion;
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  });

  protected readonly displayPrice = computed(() => {
    if (!this.showPrice()) {
      return null;
    }
    const p = this.receta().price;
    if (p !== null && Number(p) > 0) {
      return Number(p);
    }
    return null;
  });

  // Sirve para mostrar el badge de adquirida solo si no es el autor
  protected readonly shouldShowAcquiredBadge = computed(() => {
    const r = this.receta();
    if (!r.purchased) {
      return false;
    }
    const user = this.currentUser();
    const myId = Number(user?.['id_usuario'] ?? 0);
    if (!myId) {
      return false;
    }
    return Number(r.id_autor) !== myId;
  });

  protected readonly displayTime = computed(() => {
    const r = this.receta();
    const time = r.tiempo_preparacion;
    const unit = r.tiempo_preparacion_unidad === 'hours' ? 'h' : 'm';
    return `${time}${unit}`;
  });

  protected readonly difficultyLabel = computed(() => {
    const diff = this.receta().dificultad;
    if (!diff) return 'Easy';
    return diff.charAt(0).toUpperCase() + diff.slice(1);
  });

  protected readonly difficultyBars = computed(() => {
    const diff = this.receta().dificultad;
    return {
      bar1: true,
      bar2: diff === 'medium' || diff === 'hard',
      bar3: diff === 'hard'
    };
  });

  // Sirve para formatear la media de valoraciones de la receta
  protected readonly mediaValoraciones = computed(() => {
    const media = this.receta().media_valoraciones;
    const numericMedia = Number(media);

    if (!Number.isFinite(numericMedia) || numericMedia <= 0) {
      return 'NA';
    }

    const roundedUp = Math.ceil(numericMedia * 10) / 10;
    const fixed = roundedUp.toFixed(1);
    return fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
  });

  protected readonly mainImage = computed(() => {
    return this.authService.getAssetUrl(this.receta().imagen_1 ?? '', this.receta().updated_at ?? undefined);
  });

  protected readonly chefName = computed(() => {
    return this.receta().autor_nombre;
  });

  // Sirve para saber si el usuario puede editar o eliminar la receta
  protected readonly canManageRecipe = computed(() => {
    const user = this.currentUser();
    const currentUserId = Number(user?.['id_usuario'] ?? 0);
    const currentUserRole = String(user?.['rol'] ?? '');

    if (!currentUserId && currentUserRole !== 'admin') {
      return false;
    }

    return currentUserRole === 'admin' || currentUserId === this.receta().id_autor;
  });

  // Sirve para abrir el modal de confirmación de borrado
  protected openDeleteModal(): void {
    if (!this.isDeactivating()) {
      this.showDeleteModal.set(true);
    }
  }

  // Sirve para cerrar el modal de borrado sin eliminar
  protected cancelDelete(): void {
    this.showDeleteModal.set(false);
  }

  // Sirve para desactivar la receta en el backend
  protected confirmDelete(): void {
    this.showDeleteModal.set(false);
    this.isDeactivating.set(true);
    this.http.put(`/api/recetas/desactivar/${this.receta().id_receta}`, {}).subscribe({
      next: () => {
        this.recipeDeactivated.emit(this.receta().id_receta);
        this.isDeactivating.set(false);
      },
      error: () => {
        this.isDeactivating.set(false);
      },
    });
  }
}
