import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthServices } from '../Pages/auth/Services/auth-services';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private auth = inject(AuthServices);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  canActivate(): boolean | UrlTree {
    if (!isPlatformBrowser(this.platformId)) {
      return true;
    }
    if (this.auth.isAuthenticated()) {
      return true;
    }
    return this.router.parseUrl('/login');
  }
}
