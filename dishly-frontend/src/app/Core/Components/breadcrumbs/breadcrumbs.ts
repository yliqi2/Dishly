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
  imports: [CommonModule],
  templateUrl: './breadcrumbs.html',
  styleUrl: './breadcrumbs.css',
})
export class Breadcrumbs implements OnInit, OnDestroy {
  items: BreadcrumbItem[] = [];
  private sub!: Subscription;

  private readonly labels: Record<string, string> = {
    'recipes': 'Recipes',
    'dishly-ai': 'Dishly AI',
    'forum': 'Forum',
    'upload': 'Upload',
    'cart': 'Cart',
    'profile': 'Profile',
    'edit': 'Edit Profile',
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.buildBreadcrumb(this.router.url);
    this.sub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => this.buildBreadcrumb(e.urlAfterRedirects));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private buildBreadcrumb(url: string): void {
    const pathOnly = url.split('?')[0];
    const segments = pathOnly.split('/').filter(s => s);

    if (segments[0] === 'profile') {
      this.items = [{ label: 'Profile', path: '/profile' }];
      let acc = '/profile';
      for (let i = 1; i < segments.length; i++) {
        const seg = segments[i];
        acc += `/${seg}`;
        const label = this.labels[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1);
        this.items.push({ label, path: acc });
      }
    } else {
      if (segments.length === 0) {
        this.items = [{ label: 'Home', path: '/' }];
      } else {
        let acc = '';
        const pathItems: BreadcrumbItem[] = [];
        for (const seg of segments) {
          acc += `/${seg}`;
          const label = this.labels[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1);
          pathItems.push({ label, path: acc });
        }
        this.items = pathItems;
      }
    }
  }

  isLast(index: number): boolean {
    return index === this.items.length - 1;
  }
}
