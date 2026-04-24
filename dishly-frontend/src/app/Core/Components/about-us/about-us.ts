import { Component } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { Breadcrumbs } from '../breadcrumbs/breadcrumbs';

@Component({
  selector: 'app-about-us',
  imports: [LucideAngularModule, Breadcrumbs],
  templateUrl: './about-us.html',
  styleUrls: ['./about-us.css'],
})
export class AboutUs {

}
