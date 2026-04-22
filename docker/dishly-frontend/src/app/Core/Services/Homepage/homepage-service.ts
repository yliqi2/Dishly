import { Injectable } from '@angular/core';
import { inject } from '@angular/core';
import { AuthServices } from '../Auth/auth-services';
import { ApiBaseService } from '../api-base.service';
import { RecetaCard } from '../../Interfaces/RecetaCard';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HomepageService extends ApiBaseService {
  protected readonly auth = inject(AuthServices);

  getRecipes(): Observable<RecetaCard[]> {
    return this.http.get<RecetaCard[]>(`${this.apiUrl}/recipes`);
  }
}
