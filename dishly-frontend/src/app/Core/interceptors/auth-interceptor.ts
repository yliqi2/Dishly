import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { finalize, throwError } from 'rxjs';
import { AuthServices } from '../Services/Auth/auth-services';
import { LoadingService } from '../Services/loading.service';

// Sirve para adjuntar el token JWT, gestionar el loading y redirigir si la sesión expira
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthServices);
  const loadingService = inject(LoadingService);
  const token = authService.getToken();
  const isAuthRequest = /\/(login|register|logout)(\?|$)/.test(req.url);

  const request = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  loadingService.start();

  return next(request).pipe(
    catchError((error) => {
      const shouldRedirectToLogin = (error.status === 401 || error.status === 403) && !isAuthRequest;
      if (shouldRedirectToLogin) {
        authService.handleUnauthorizedSession();
      }
      return throwError(() => error);
    }),
    finalize(() => {
      loadingService.stop();
    }),
  );
};
