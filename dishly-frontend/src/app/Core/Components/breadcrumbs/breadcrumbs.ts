import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

interface BreadcrumbItem {
  label: string;
  path: string;
}

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './breadcrumbs.html',
  styleUrl: './breadcrumbs.css',
})
export class Breadcrumbs implements OnInit, OnDestroy {
  items: BreadcrumbItem[] = [];
  private sub!: Subscription;
  private previousUrl: string | null = null;
  private static readonly PREVIOUS_URL_KEY = 'dishly.previousUrl';

  private readonly labels: Record<string, string> = {
    '': 'Home',
    'my-recipes': 'Recipes',
    'recipes': 'Recipes',
    'dishly-ai': 'Dishly AI',
    'forum': 'Forum',
    'upload': 'Upload',
    'cart': 'Cart',
    'payment': 'Payment',
    'profile': 'Profile',
    'edit-profile': 'Edit Profile',
    'edit': 'Edit Profile',
    'cookies': 'Cookies',
    'terms-and-conditions': 'Terms and Conditions',
    'termsa-and-conditions': 'Terms and Conditions',
    'bought-recipes': 'Adquired Recipes',
    'search-recipes': 'Search Recipes',
    'recipe-detail': 'Recipe Detail',
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.previousUrl = sessionStorage.getItem(Breadcrumbs.PREVIOUS_URL_KEY);
    this.buildBreadcrumb(this.router.url);
    sessionStorage.setItem(Breadcrumbs.PREVIOUS_URL_KEY, this.router.url);
    this.sub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => {
        const currentUrl = e.urlAfterRedirects;
        this.buildBreadcrumb(currentUrl);
        sessionStorage.setItem(Breadcrumbs.PREVIOUS_URL_KEY, currentUrl);
        this.previousUrl = currentUrl;
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private buildBreadcrumb(url: string): void {
    const pathOnly = url.split('?')[0];
    const segments = pathOnly.split('/').filter(s => s);

    if (segments.length === 0) {
      this.items = [{ label: 'Home', path: '/' }];
      return;
    }

    if (segments.length === 1 && segments[0] === 'recipes') {
      const previousPath = (this.previousUrl ?? '').split('?')[0];
      const cameFromHome = previousPath === '/';
      this.items = cameFromHome
        ? [{ label: 'Home', path: '/' }, { label: 'Recipes', path: '/recipes' }]
        : [{ label: 'Recipes', path: '/recipes' }];
      return;
    }

    if (segments[0] === 'dishly-ai') {
      this.items = [{ label: 'Dishly AI', path: '/dishly-ai' }];
      return;
    }

    if (segments[0] === 'profile' && segments.length >= 2 && /^\d+$/.test(segments[1])) {
      this.items = [{ label: 'Profile', path: '/profile' }];
      return;
    }

    if (segments[0] === 'recipes' && segments.length >= 2 && /^\d+$/.test(segments[1])) {
      const recipeId = segments[1];
      const cachedTitle = sessionStorage.getItem(`dishly.recipeTitle.${recipeId}`);
      this.items = [
        { label: 'Recipes', path: '/recipes' },
        { label: cachedTitle || `Recipe ${recipeId}`, path: `/recipes/${recipeId}` }
      ];
      return;
    }

    let acc = '';
    const pathItems: BreadcrumbItem[] = [];
    for (const seg of segments) {
      acc += `/${seg}`;
      const label = this.labels[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1);
      pathItems.push({ label, path: acc });
    }
    this.items = pathItems;
  }

  isLast(index: number): boolean {
    return index === this.items.length - 1;
  }
}
