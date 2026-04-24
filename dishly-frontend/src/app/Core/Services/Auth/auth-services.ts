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
  // Sirve para verificar si se está ejecutando en un navegador
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private userSubject = new BehaviorSubject<User | null>(this.readInitialUser());
  user$ = this.userSubject.asObservable();

  // Sirve para obtener el almacenamiento local
  private getStorage(): Storage | null {
    return this.isBrowser ? localStorage : null;
  }

  // Sirve para obtener un item del almacenamiento local
  private getItem(key: string): string | null {
    const storage = this.getStorage();
    return storage ? storage.getItem(key) : null;
  }

  // Sirve para establecer un item en el almacenamiento local
  private setItem(key: string, value: string): void {
    const storage = this.getStorage();
    if (storage) {
      storage.setItem(key, value);
    }
  }

  // Sirve para eliminar un item del almacenamiento local
  private removeItem(key: string): void {
    const storage = this.getStorage();
    if (storage) {
      storage.removeItem(key);
    }
  }

  // Sirve para verificar si el token de acceso es válido
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

  // Sirve para limpiar el almacenamiento local de autenticación
  private clearExpiredLocalAuth(): void {
    this.removeItem('token');
    this.removeItem('user');
    this.userSubject.next(null);
  }

  // Sirve para leer el usuario inicial
  private readInitialUser(): User | null {
    const token = this.getStorage()?.getItem('token');
    if (!token) {
      return null;
    }

    // Sirve para verificar si el token de acceso es válido
    if (!this.isAccessTokenValid(token)) {
      this.getStorage()?.removeItem('token');
      this.getStorage()?.removeItem('user');
      return null;
    }

    // Sirve para obtener el usuario del almacenamiento local
    const raw = this.getStorage()?.getItem('user');
    return raw ? (JSON.parse(raw) as User) : null;
  }

  // Sirve para obtener el usuario del almacenamiento local
  private getUserFromStorage(): User | null {
    if (!this.getToken()) {
      return null;
    }

    // Sirve para obtener el usuario del almacenamiento local
    const user = this.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // Sirve para registrar un usuario
  register(user: RegisterPayload): Observable<AuthResponse> {
    return this.http.post(`${this.apiUrl}/register`, user).pipe(
      // Sirve para actualizar el usuario del almacenamiento local
      tap((response: AuthResponse) => {
        if (response.access_token) {
          // Sirve para establecer el token de acceso en el almacenamiento local
          this.setItem('token', response.access_token);

          // Sirve para actualizar el usuario del almacenamiento local
          if (response.user) {
            this.setItem('user', JSON.stringify(response.user));
            this.userSubject.next(response.user);
          }
        }
      })
    );
  }

  // Sirve para iniciar sesión
  login(credentials: LoginPayload, rememberMe: boolean = false): Observable<AuthResponse> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: AuthResponse) => {
        if (response.access_token) {
          // Sirve para establecer el token de acceso en el almacenamiento local
          this.setItem('token', response.access_token);
          
          // Sirve para actualizar el usuario del almacenamiento local
          if (response.user) {
            this.setItem('user', JSON.stringify(response.user));
            this.userSubject.next(response.user);
          }
          
          // Sirve para establecer las credenciales recordadas
          if (rememberMe) {
            this.setRememberedCredentials(credentials.email ?? '', credentials.password ?? '');
          } else {
            this.clearRememberedCredentials();
          }
        }
      })
    );
  }

  // Sirve para verificar el email
  verifyEmail(params: { email: string; code: string }): Observable<VerificationResponse> {
    return this.http.get<VerificationResponse>(`${this.apiUrl}/verify-email`, {
      params: {
        email: params.email,
        code: params.code,
      },
    });
  }

  // Sirve para obtener las credenciales recordadas
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

  // Sirve para establecer las credenciales recordadas
  setRememberedCredentials(email: string, password: string): void {
    this.setItem('rememberedCredentials', JSON.stringify({ email, password }));
  }

  // Sirve para limpiar las credenciales recordadas
  clearRememberedCredentials(): void {
    this.removeItem('rememberedCredentials');
  }

  // Sirve para cerrar sesión
  logout(): Observable<void> {
    const hadToken = !!this.getToken();
    if (hadToken) {
      // Sirve para cerrar sesión
      return this.http.post<void>(`${this.apiUrl}/logout`, {}).pipe(
        tap(() => this.clearAuth()),
        catchError(() => {
          // Sirve para limpiar la autenticación
          this.clearAuth();
          return of(undefined);
        }),
        map(() => undefined)
      );
    }
    // Sirve para limpiar la autenticación
    this.clearAuth();
    return of(undefined);
  }

  // Sirve para limpiar la autenticación
  private clearAuth(): void {
    this.removeItem('token');
    this.removeItem('user');
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }

  // Sirve para limpiar la sesión y redirigir
  clearSessionAndRedirect(): void {
    this.clearAuth();
  }

  // Sirve para manejar la sesión no autorizada
  handleUnauthorizedSession(): void {
    this.clearAuth();
  }

  // Sirve para obtener el token de acceso
  getToken(): string | null {
    const token = this.getItem('token');
    if (!token) {
      return null;
    }
    // Sirve para verificar si el token de acceso es válido
    if (!this.isAccessTokenValid(token)) {
      this.clearExpiredLocalAuth();
      return null;
    }
    return token;
  }

  // Sirve para obtener el usuario
  getUser(): User | null {
    return this.getUserFromStorage();
  }

  // Sirve para verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Sirve para actualizar el perfil
  updateProfile(data: UpdateProfilePayload): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(`${this.apiUrl}/profile`, data).pipe(
      tap((response: AuthResponse) => {
        if (response.user) {
          // Sirve para establecer el usuario en el almacenamiento local
          this.setItem('user', JSON.stringify(response.user));
          this.userSubject.next(response.user);
        }
      })
    );
  }

  // Sirve para actualizar la información personal
  updatePersonalInfo(data: { name: string; email: string }): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(`${this.apiUrl}/profile/personalinfo`, data).pipe(
      tap((response: AuthResponse) => {
        if (response.user) {
          // Sirve para establecer el usuario en el almacenamiento local
          this.setItem('user', JSON.stringify(response.user));
          this.userSubject.next(response.user);
        }
      })
    );
  }

  // Sirve para actualizar la contraseña
  updatePassword(data: { current_password: string; new_password: string }): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/profile/updatePassword`, data);
  }

  // Sirve para obtener la URL del asset
  getAssetUrl(path: string, cacheBust?: string): string {
    if (!path) return 'assets/icons/DishlyIcon.webp';

    // Sirve para obtener la URL del asset normalizada
    const trimmedPath = path.trim();
    const normalizedPath = trimmedPath.replace(/\.(jpe?g|png|gif|bmp|jfif|tiff?)(\?.*)?$/i, '.webp$2');
    let url: string;

    // Sirve para obtener la URL del asset
    if (/^https?:\/\//i.test(normalizedPath)) {
      url = normalizedPath
        .replace('://localhost:8000', '://localhost:8080')
        .replace('://127.0.0.1:8000', '://127.0.0.1:8080');
    } else {
      const cleanPath = normalizedPath.replace(/^\/+/, '');
      url = `/img-proxy/${cleanPath}`;
    }

    // Sirve para obtener la URL del asset con el bust cache
    if (!cacheBust) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${encodeURIComponent(cacheBust)}`;
  }

  // Sirve para subir un icono
  uploadIcon(file: File): Observable<AuthResponse> {
    const formData = new FormData();
    // Sirve para obtener la extensión del archivo
    const ext = (file.name.split('.').pop()?.toLowerCase() ?? 'png').replace(/[^a-z0-9]/g, '') || 'png';
    // Sirve para agregar el archivo al formulario
    formData.append('icon', file, `icon.${ext}`);
    // Sirve para subir el icono
    return this.http.post<AuthResponse>(`${this.apiUrl}/profile/upload-icon`, formData).pipe(
      // Sirve para actualizar el usuario en el almacenamiento local
      tap((response: AuthResponse) => {
        if (response.user) {
          // Sirve para actualizar el usuario en el almacenamiento local
          const user = { ...response.user, updated_at: new Date().toISOString() };
          this.setItem('user', JSON.stringify(user));
          this.userSubject.next(user);
        }
      })
    );
  }

  // Sirve para desactivar la cuenta
  deactivateAccount(): Observable<{ message: string }> {
    // Sirve para desactivar la cuenta
    return this.http.put<{ message: string }>(`${this.apiUrl}/profile/deactivateAccount`, {}).pipe(
      // Sirve para limpiar la autenticación
      tap(() => {
        // Sirve para limpiar la autenticación
        this.clearAuth();
      })
    );
  }
}

type User = Record<string, unknown>;
type RegisterPayload = Record<string, unknown>;
type LoginPayload = { email?: string; password?: string };
type UpdateProfilePayload = { name?: string; email?: string; password?: string; current_password?: string };

// Sirve para definir la interfaz de respuesta de autenticación
type AuthResponse = {
  access_token?: string;
  user?: User;
};

// Sirve para definir la interfaz de respuesta de verificación
type VerificationResponse = {
  message: string;
  status: 'success' | 'already' | 'invalid';
};
