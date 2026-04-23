import { Component, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Header } from './Core/Layout/header/header';
import { filter } from 'rxjs';
import { Footer } from './Core/Layout/footer/footer';
import { LoadingService } from './Core/Services/loading.service';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Header, Footer, RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  private router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly loadingService = inject(LoadingService);
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly title = signal('Dishly');
  protected readonly showHeader = signal(true);
  protected readonly isGlobalLoading = this.loadingService.isLoading;

  constructor() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const authRoutes = ['/login', '/register', '/forgot-password'];
        this.showHeader.set(!authRoutes.some(route => event.url.startsWith(route)));
        this.updateRouteMeta(event.urlAfterRedirects || event.url);
        if (this.showHeader() && isPlatformBrowser(this.platformId)) {
          setTimeout(() => {
            const b = document.body;
            b.setAttribute('tabindex', '-1');
            b.focus();
            b.removeAttribute('tabindex');
          }, 0);
        }
      });
  }

  private updateRouteMeta(currentUrl: string): void {
    const route = this.getDeepestRoute(this.activatedRoute);
    const routeTitle = route.snapshot.title ?? 'Dishly';
    const routeDescription = route.snapshot.data['metaDescription'] as string | undefined;
    const description = routeDescription ?? `Discover ${routeTitle} on Dishly.`;
    const fullTitle = routeTitle === 'Dishly' ? 'Dishly' : `${routeTitle} | Dishly`;

    this.titleService.setTitle(fullTitle);
    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({ property: 'og:title', content: fullTitle });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    const origin = isPlatformBrowser(this.platformId) ? window.location.origin : '';
    this.metaService.updateTag({ property: 'og:url', content: `${origin}${currentUrl}` });
  }

  private getDeepestRoute(route: ActivatedRoute): ActivatedRoute {
    let current = route;
    while (current.firstChild) {
      current = current.firstChild;
    }
    return current;
  }
}
