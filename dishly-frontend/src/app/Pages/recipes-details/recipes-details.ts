import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RecetaDetailsService } from '../../Core/Services/Core/receta-details-service';
import { RecetaOriginal } from '../../Core/Interfaces/RecetaOriginal';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recipes-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recipes-details.html',
  styleUrl: './recipes-details.css',
})
export class RecipesDetails implements OnInit {
  recipe: RecetaOriginal | null = null;
  loading: boolean = true;
  error: string | null = null;

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
}
