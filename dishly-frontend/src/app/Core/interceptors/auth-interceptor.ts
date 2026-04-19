import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthServices } from '../Services/Auth/auth-services';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthServices);
  const token = authService.getToken();
  const isAuthRequest = /\/(login|register|logout)(\?|$)/.test(req.url);

  const request = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(request).pipe(
    catchError((error) => {
      const shouldRedirectToLogin = (error.status === 401 || error.status === 403) && !isAuthRequest;
      if (shouldRedirectToLogin) {
        authService.logout().subscribe({
          error: () => {},
        });
      }
      return throwError(() => error);
    })
  );
};
