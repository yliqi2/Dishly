import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HomepageService } from '../../Services/Homepage/homepage-service';
import { RecetaCard } from '../../Interfaces/RecetaCard';
import { RecipeCardComponent } from '../recipe-card/recipe-card';

@Component({
  selector: 'app-feature',
  imports: [CommonModule, RouterLink, RecipeCardComponent],
  templateUrl: './feature.html',
  styleUrl: './feature.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Feature implements OnInit {
  private readonly homepageService = inject(HomepageService);

  protected readonly recipes = signal<RecetaCard[]>([]);

  ngOnInit(): void {
    this.homepageService.getRecipes().subscribe(data => this.recipes.set(data));
    console.log(this.homepageService.getRecipes());
  }

  protected onRecipeDeactivated(recipeId: number): void {
    this.recipes.update((recipes) => recipes.filter((recipe) => recipe.id_receta !== recipeId));
  }
}
