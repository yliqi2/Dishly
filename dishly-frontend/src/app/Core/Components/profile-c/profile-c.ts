import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-profile-c',
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './profile-c.html',
  styleUrl: './profile-c.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileC {
  displayName = input.required<string>();
  memberSince = input<string>('Member');
  email = input<string>('—');
  iconUrl = input<string | null>(null);
  chef = input<boolean>(false);
  protected readonly iconLoadError = signal(false);
}
