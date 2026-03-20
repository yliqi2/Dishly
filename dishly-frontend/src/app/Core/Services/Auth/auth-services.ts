import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { ApiBaseService } from '../api-base.service';

@Injectable({
  providedIn: 'root'
})
export class AuthServices extends ApiBaseService {
  private router = inject(Router);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private userSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
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

  private getUserFromStorage(): User | null {
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

  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
      next: () => {
        this.clearAuth();
      },
      error: () => {
        this.clearAuth();
      }
    });
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

  getToken(): string | null {
    return this.getItem('token');
  }

  getUser(): User | null {
    const user = this.getItem('user');
    return user ? JSON.parse(user) : null;
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
    const p = path.startsWith('/') ? path.slice(1) : path;
    const url = `/${p}`;
    return cacheBust ? `${url}?v=${encodeURIComponent(cacheBust)}` : url;
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
