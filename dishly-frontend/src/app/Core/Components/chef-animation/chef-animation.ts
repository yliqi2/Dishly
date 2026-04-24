import { Component, input } from '@angular/core';

@Component({
  selector: 'app-chef-animation',
  imports: [],
  templateUrl: './chef-animation.html',
  styleUrl: './chef-animation.css',
})
export class ChefAnimation {
  readonly happy = input(false);
}
