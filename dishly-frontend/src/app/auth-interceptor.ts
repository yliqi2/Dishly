import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthServices } from './Pages/auth/Services/auth-services';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthServices);
  const token = authService.getToken();

  if (token) {
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      console.log('JWT en petición:', req.method, req.url);
    }
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(authReq);
  }

  if (typeof ngDevMode === 'undefined' || ngDevMode) {
    console.log('Sin token, petición sin Authorization:', req.method, req.url);
  }
  return next(req);
};
