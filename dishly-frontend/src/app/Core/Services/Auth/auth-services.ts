import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of, tap, BehaviorSubject, catchError, map } from 'rxjs';
import { Router } from '@angular/router';
import { ApiBaseService } from '../api-base.service';
import { jwtDecode } from 'jwt-decode';

type JwtPayload = { exp?: number };

@Injectable({
  providedIn: 'root'
})
export class AuthServices extends ApiBaseService {
  private router = inject(Router);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private userSubject = new BehaviorSubject<User | null>(this.readInitialUser());
  user$ = this.userSubject.asObservable();

  private getStorage(): Storage | null {
    return this.isBrowser ? localStorage : null;
  }

  private getItem(key: string): string | null {
    const storage = this.getStorage();
    return storage ? storage.getItem(key) : null;
  }

  private setItem(key: string, value: string): void {
    const storage = this.getStorage();
    if (storage) {
      storage.setItem(key, value);
    }
  }

  private removeItem(key: string): void {
    const storage = this.getStorage();
    if (storage) {
      storage.removeItem(key);
    }
  }

  private isAccessTokenValid(token: string): boolean {
    try {
      const payload = jwtDecode<JwtPayload>(token);
      if (typeof payload.exp !== 'number') {
        return true;
      }
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  private clearExpiredLocalAuth(): void {
    this.removeItem('token');
    this.removeItem('user');
    this.userSubject.next(null);
  }

  private readInitialUser(): User | null {
    const token = this.getStorage()?.getItem('token');
    if (!token) {
      return null;
    }
    if (!this.isAccessTokenValid(token)) {
      this.getStorage()?.removeItem('token');
      this.getStorage()?.removeItem('user');
      return null;
    }
    const raw = this.getStorage()?.getItem('user');
    return raw ? (JSON.parse(raw) as User) : null;
  }

  private getUserFromStorage(): User | null {
    if (!this.getToken()) {
      return null;
    }
    const user = this.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  register(user: RegisterPayload): Observable<AuthResponse> {
    return this.http.post(`${this.apiUrl}/register`, user).pipe(
      tap((response: AuthResponse) => {
        if (response.access_token) {
          this.setItem('token', response.access_token);
          if (response.user) {
            this.setItem('user', JSON.stringify(response.user));
            this.userSubject.next(response.user);
          }
        }
      })
    );
  }

  login(credentials: LoginPayload, rememberMe: boolean = false): Observable<AuthResponse> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: AuthResponse) => {
        if (response.access_token) {
          this.setItem('token', response.access_token);
          if (response.user) {
            this.setItem('user', JSON.stringify(response.user));
            this.userSubject.next(response.user);
          }
          if (rememberMe) {
            this.setRememberedCredentials(credentials.email ?? '', credentials.password ?? '');
          } else {
            this.clearRememberedCredentials();
          }
        }
      })
    );
  }

  verifyEmail(params: { email: string; code: string }): Observable<VerificationResponse> {
    return this.http.get<VerificationResponse>(`${this.apiUrl}/verify-email`, {
      params: {
        email: params.email,
        code: params.code,
      },
    });
  }

  getRememberedCredentials(): { email: string; password: string } | null {
    const raw = this.getItem('rememberedCredentials');
    if (!raw) return null;
    try {
      const data = JSON.parse(raw) as { email: string; password: string };
      return data?.email != null && data?.password != null ? data : null;
    } catch {
      return null;
    }
  }

  setRememberedCredentials(email: string, password: string): void {
    this.setItem('rememberedCredentials', JSON.stringify({ email, password }));
  }

  clearRememberedCredentials(): void {
    this.removeItem('rememberedCredentials');
  }

  logout(): Observable<void> {
    const hadToken = !!this.getToken();
    if (hadToken) {
      return this.http.post<void>(`${this.apiUrl}/logout`, {}).pipe(
        tap(() => this.clearAuth()),
        catchError(() => {
          this.clearAuth();
          return of(undefined);
        }),
        map(() => undefined)
      );
    }
    this.clearAuth();
    return of(undefined);
  }

  private clearAuth(): void {
    this.removeItem('token');
    this.removeItem('user');
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }

  clearSessionAndRedirect(): void {
    this.clearAuth();
  }

  handleUnauthorizedSession(): void {
    this.clearAuth();
  }

  getToken(): string | null {
    const token = this.getItem('token');
    if (!token) {
      return null;
    }
    if (!this.isAccessTokenValid(token)) {
      this.clearExpiredLocalAuth();
      return null;
    }
    return token;
  }

  getUser(): User | null {
    return this.getUserFromStorage();
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  updateProfile(data: UpdateProfilePayload): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(`${this.apiUrl}/profile`, data).pipe(
      tap((response: AuthResponse) => {
        if (response.user) {
          this.setItem('user', JSON.stringify(response.user));
          this.userSubject.next(response.user);
        }
      })
    );
  }

  updatePersonalInfo(data: { name: string; email: string }): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(`${this.apiUrl}/profile/personalinfo`, data).pipe(
      tap((response: AuthResponse) => {
        if (response.user) {
          this.setItem('user', JSON.stringify(response.user));
          this.userSubject.next(response.user);
        }
      })
    );
  }

  updatePassword(data: { current_password: string; new_password: string }): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/profile/updatePassword`, data);
  }

  getAssetUrl(path: string, cacheBust?: string): string {
    if (!path) return 'assets/placeholder.jpg';

    const trimmedPath = path.trim();
    let url: string;

    if (/^https?:\/\//i.test(trimmedPath)) {
      url = trimmedPath
        .replace('://localhost:8000', '://localhost:8080')
        .replace('://127.0.0.1:8000', '://127.0.0.1:8080');
    } else {
      const cleanPath = trimmedPath.replace(/^\/+/, '');
      url = `/img-proxy/${cleanPath}`;
    }

    if (!cacheBust) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${encodeURIComponent(cacheBust)}`;
  }

  uploadIcon(file: File): Observable<AuthResponse> {
    const formData = new FormData();
    const ext = (file.name.split('.').pop()?.toLowerCase() ?? 'png').replace(/[^a-z0-9]/g, '') || 'png';
    formData.append('icon', file, `icon.${ext}`);
    return this.http.post<AuthResponse>(`${this.apiUrl}/profile/upload-icon`, formData).pipe(
      tap((response: AuthResponse) => {
        if (response.user) {
          const user = { ...response.user, updated_at: new Date().toISOString() };
          this.setItem('user', JSON.stringify(user));
          this.userSubject.next(user);
        }
      })
    );
  }

  deactivateAccount(): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/profile/deactivateAccount`, {}).pipe(
      tap(() => {
        this.clearAuth();
      })
    );
  }
}

type User = Record<string, unknown>;
type RegisterPayload = Record<string, unknown>;
type LoginPayload = { email?: string; password?: string };
type UpdateProfilePayload = { name?: string; email?: string; password?: string; current_password?: string };

type AuthResponse = {
  access_token?: string;
  user?: User;
};

type VerificationResponse = {
  message: string;
  status: 'success' | 'already' | 'invalid';
};
