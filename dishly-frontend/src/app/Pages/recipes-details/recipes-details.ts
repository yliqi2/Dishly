import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RecetaDetailsService } from '../../Core/Services/Core/receta-details-service';
import { RecetaOriginal } from '../../Core/Interfaces/RecetaOriginal';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { LoadingPage } from '../loading-page/loading-page';

@Component({
  selector: 'app-recipes-details',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, LoadingPage],
  templateUrl: './recipes-details.html',
  styleUrl: './recipes-details.css',
})
export class RecipesDetails implements OnInit {
  recipe: RecetaOriginal | null = null;
  loading: boolean = true;
  error: string | null = null;
  selectedThumbnailIndex = 0;
  hoverRating = 0;
  userRating = 0;

  constructor(
    private route: ActivatedRoute,
    private recetaService: RecetaDetailsService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.recetaService.getRecipeById(id).subscribe({
        next: (data) => {
          this.recipe = data;
          console.log(this.recipe);
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.error = 'No se pudo cargar la receta.';
          this.loading = false;
        }
      });
    } else {
      this.error = 'ID de receta no proporcionado.';
      this.loading = false;
    }
  }

  getInitials(name: string): string {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getThumbnails(recipe: RecetaOriginal): string[] {
    const thumbs: string[] = [];
    if (recipe.imagen_1) thumbs.push('http://localhost:8000/' + recipe.imagen_1);
    if (recipe.imagen_2) thumbs.push('http://localhost:8000/' + recipe.imagen_2);
    if (recipe.imagen_3) thumbs.push('http://localhost:8000/' + recipe.imagen_3);
    if (recipe.imagen_4) thumbs.push('http://localhost:8000/' + recipe.imagen_4);
    if (recipe.imagen_5) thumbs.push('http://localhost:8000/' + recipe.imagen_5);

    if (thumbs.length === 0) thumbs.push('assets/placeholder.jpg');
    return thumbs;
  }

  getInstructions(text: string): string[] {
    if (!text) return [];
    return text.split('\n').map(s => s.trim()).filter(s => s.length > 0);
  }

  prevImage() {
    if (this.recipe) {
      const len = this.getThumbnails(this.recipe).length;
      this.selectedThumbnailIndex = (this.selectedThumbnailIndex - 1 + len) % len;
    }
  }

  nextImage() {
    if (this.recipe) {
      const len = this.getThumbnails(this.recipe).length;
      this.selectedThumbnailIndex = (this.selectedThumbnailIndex + 1) % len;
    }
  }

  selectThumbnail(index: number) {
    this.selectedThumbnailIndex = index;
  }

  setHoverRating(r: number) {
    this.hoverRating = r;
  }

  setRating(r: number) {
    this.userRating = r;
  }
}
