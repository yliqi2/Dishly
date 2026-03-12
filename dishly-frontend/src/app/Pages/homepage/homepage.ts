import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeroHome } from '../../Core/Layout/hero-home/hero-home';
import { AboutUs } from './Components/about-us/about-us';

@Component({
  selector: 'app-homepage',
  imports: [HeroHome, AboutUs],
  templateUrl: './homepage.html',
  styleUrl: './homepage.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Homepage {

}
