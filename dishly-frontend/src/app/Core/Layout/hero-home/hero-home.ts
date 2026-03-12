import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SearchingBar } from '../../Components/searching-bar/searching-bar';

@Component({
  selector: 'app-hero-home',
  imports: [SearchingBar],
  templateUrl: './hero-home.html',
  styleUrl: './hero-home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroHome {
  onSearch(query: string) {
    console.log('Search query:', query);
    // TODO: Implement search functionality
  }
}
