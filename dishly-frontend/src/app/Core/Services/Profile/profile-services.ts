import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthServices } from '../Auth/auth-services';
import { RecetaOriginal } from '../../Interfaces/RecetaOriginal';

@Injectable({
  providedIn: 'root',
})
export class Profile {
  private apiUrl = '/api';
  private http = inject(HttpClient);
  private auth = inject(AuthServices);

  getMyRecipes(): Observable<RecetaOriginal[]> {
    if (!this.auth.isAuthenticated()) {
      return of([]);
    }
    return this.http.get<RecetaOriginal[]>(`${this.apiUrl}/profile/my-recipes`).pipe(
      tap(res => console.log('getMyRecipes response:', res))
    );
  }

  getCountRecipes(): Observable<number> {
    if (!this.auth.isAuthenticated()) {
      return of(0);
    }
    return this.http.get<number>(`${this.apiUrl}/profile/count-recipes`).pipe(
      tap(res => console.log('getCountRecipes response:', res))
    );
  }

  getMediaValoraciones(): Observable<number> {
    if (!this.auth.isAuthenticated()) {
      return of(0);
    }
    return this.http.get<number>(`${this.apiUrl}/profile/media-valoraciones`).pipe(
      tap(res => console.log('getMediaValoraciones response:', res))
    );
  }
}