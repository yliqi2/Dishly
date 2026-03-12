import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-profile-bought-recipes-c',
  imports: [LucideAngularModule],
  templateUrl: './profile-bought-recipes-c.html',
  styleUrl: './profile-bought-recipes-c.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileBoughtRecipesC {
  count = input<number>(0);
}
