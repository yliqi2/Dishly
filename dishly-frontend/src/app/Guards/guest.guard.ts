import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthServices } from '../Core/Services/Auth/auth-services';

@Injectable({ providedIn: 'root' })
export class GuestGuard implements CanActivate {
  private auth = inject(AuthServices);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  canActivate(): boolean | UrlTree {
    if (!isPlatformBrowser(this.platformId)) {
      return true;
    }

    if (this.auth.isAuthenticated()) {
      return this.router.parseUrl('/');
    }

    return true;
  }
}
