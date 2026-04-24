import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SearchingBar } from '../../Components/searching-bar/searching-bar';

@Component({
  selector: 'app-hero-home',
  imports: [SearchingBar],
  templateUrl: './hero-home.html',
  styleUrl: './hero-home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroHome {
  private router = inject(Router);

  // Sirve para buscar una receta
  onSearch(query: string): void {
    this.router.navigate(['/recipes'], { queryParams: { q: query } });
  }
}
