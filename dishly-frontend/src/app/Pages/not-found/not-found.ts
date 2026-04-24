import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChefAnimation } from '../../Core/Components/chef-animation/chef-animation';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, ChefAnimation],
  templateUrl: './not-found.html',
  styleUrls: ['./not-found.css'],
})
export class NotFound {}
