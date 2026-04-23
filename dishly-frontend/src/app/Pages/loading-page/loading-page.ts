import { Component } from '@angular/core';
import { ChefAnimation } from '../../Core/Components/chef-animation/chef-animation';

@Component({
  selector: 'app-loading-page',
  standalone: true,
  imports: [ChefAnimation],
  templateUrl: './loading-page.html',
  styleUrl: './loading-page.css',
})
export class LoadingPage {

}
