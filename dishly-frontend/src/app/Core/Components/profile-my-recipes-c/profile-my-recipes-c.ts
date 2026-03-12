import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-profile-my-recipes-c',
  imports: [LucideAngularModule],
  templateUrl: './profile-my-recipes-c.html',
  styleUrl: './profile-my-recipes-c.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileMyRecipesC {
  count = input<number>(0);
}
