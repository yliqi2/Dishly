import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeroHome } from '../../Core/Layout/hero-home/hero-home';
import { AboutUs } from '../../Core/Components/about-us/about-us';
import { Feature } from '../../Core/Components/feature/feature';

@Component({
  selector: 'app-homepage',
  imports: [HeroHome, AboutUs, Feature],
  templateUrl: './homepage.html',
  styleUrl: './homepage.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Homepage {

}
