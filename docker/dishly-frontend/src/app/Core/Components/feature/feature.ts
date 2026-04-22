import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HomepageService } from '../../Services/Homepage/homepage-service';
import { RecetaCard } from '../../Interfaces/RecetaCard';
import { RecipeCardComponent } from '../recipe-card/recipe-card';
import { LoadingPage } from '../../../Pages/loading-page/loading-page';

@Component({
  selector: 'app-feature',
  imports: [CommonModule, RouterLink, RecipeCardComponent, LoadingPage],
  templateUrl: './feature.html',
  styleUrl: './feature.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Feature implements OnInit {
  private readonly homepageService = inject(HomepageService);

  protected readonly isLoading = signal(true);
  protected readonly recipes = signal<RecetaCard[]>([]);

  ngOnInit(): void {
    this.homepageService.getRecipes().subscribe({
      next: (data) => {
        this.recipes.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  protected onRecipeDeactivated(recipeId: number): void {
    this.recipes.update((recipes) => recipes.filter((recipe) => recipe.id_receta !== recipeId));
  }
}
