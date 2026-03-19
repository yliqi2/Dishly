import { ChangeDetectionStrategy, Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { RecetaOriginal } from '../../Interfaces/RecetaOriginal';

@Component({
  selector: 'app-recipe-card',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './recipe-card.html',
  styleUrl: './recipe-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecipeCardComponent {
  receta = input.required<RecetaOriginal>();

  protected readonly displayedCategories = computed(() => {
    return this.receta().categorias ?? [];
  });

  protected readonly displayPrice = computed(() => {
    const p = this.receta().price;
    if (p !== null && Number(p) > 0) {
      return Number(p);
    }
    return null;
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

  protected readonly mainImage = computed(() => {
    const img = this.receta().imagen_1;
    if (!img) return '/assets/placeholder-recipe.jpg'; // Assuming a placeholder exists
    return img.startsWith('/') || img.startsWith('http') ? img : `/${img}`;
  });

  protected readonly chefName = computed(() => {
    return this.receta().autor_nombre;
  });
}
