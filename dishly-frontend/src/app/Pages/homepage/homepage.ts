import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeroHome } from '../../Core/Layout/hero-home/hero-home';

@Component({
  selector: 'app-homepage',
  imports: [HeroHome],
  templateUrl: './homepage.html',
  styleUrl: './homepage.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Homepage {

}
