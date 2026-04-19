import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthServices } from '../Auth/auth-services';
import { RecetaOriginal } from '../../Interfaces/RecetaOriginal';
import { ApiBaseService } from '../api-base.service';

@Injectable({
  providedIn: 'root',
})
export class Profile extends ApiBaseService {
  private auth = inject(AuthServices);

  getMyRecipes(): Observable<RecetaOriginal[]> {
    if (!this.auth.isAuthenticated()) return of([]);
    return this.http.get<RecetaOriginal[]>(`${this.apiUrl}/profile/my-recipes`).pipe(
      tap(res => console.log('getMyRecipes response:', res))
    );
  }

  getCountRecipes(): Observable<number> {
    if (!this.auth.isAuthenticated()) return of(0);
    return this.http.get<number>(`${this.apiUrl}/profile/count-recipes`).pipe(
      tap(res => console.log('getCountRecipes response:', res))
    );
  }

  getCountAcquiredRecipes(): Observable<number> {
    if (!this.auth.isAuthenticated()) return of(0);
    return this.http.get<number>(`${this.apiUrl}/profile/acquired-recipes`).pipe(
      tap(res => console.log('getCountAcquiredRecipes response:', res))
    );
  }

  getMediaValoraciones(): Observable<{ media: number | null }> {
    if (!this.auth.isAuthenticated()) return of({ media: null });
    return this.http.get<{ media: number | null }>(`${this.apiUrl}/profile/media-valoraciones`).pipe(
      tap(res => console.log('getMediaValoraciones response:', res))
    );
  }
}