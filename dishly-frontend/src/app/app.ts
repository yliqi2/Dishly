import { Component, signal, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { Header } from './Core/Layout/header/header';
import { filter } from 'rxjs';
import { Footer } from './Core/Layout/footer/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Header, Footer, RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  private router = inject(Router);
  protected readonly title = signal('Dishly');
  protected readonly showHeader = signal(true);

  constructor() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const authRoutes = ['/login', '/register'];
        this.showHeader.set(!authRoutes.some(route => event.url.startsWith(route)));
        if (this.showHeader()) {
          setTimeout(() => {
            const b = document.body;
            b.setAttribute('tabindex', '-1');
            b.focus();
            b.removeAttribute('tabindex');
          }, 0);
        }
      });
  }
}
