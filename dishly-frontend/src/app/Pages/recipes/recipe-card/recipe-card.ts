import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { RecetaCard } from '../../../Core/Interfaces/RecetaCard';

@Component({
  selector: 'app-recipe-card',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './recipe-card.html',
  styleUrl: './recipe-card.css',
})
export class RecipeCard {
  @Input() recipe!: RecetaCard;

  get imageUrl(): string {
    if (!this.recipe.imagen_1) return 'assets/images/placeholder.png';
    if (this.recipe.imagen_1.startsWith('http')) return this.recipe.imagen_1;
    return `/img-proxy/${this.recipe.imagen_1}`;
  }

  get formattedTime(): string {
    const val = this.recipe.tiempo_preparacion;
    const unit = this.recipe.tiempo_preparacion_unidad;
    return unit === 'hours' ? `${val}h` : `${val} min`;
  }

  get difficultyLabel(): string {
    const map: Record<string, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
    return map[this.recipe.dificultad] ?? this.recipe.dificultad;
  }

  get rating(): string {
    const r = this.recipe.media_valoraciones;
    if (r === null || r === undefined) return '—';
    const num = parseFloat(String(r));
    if (isNaN(num) || num === 0) return '—';
    return num.toFixed(1);
  }
}
