import { Injectable } from '@angular/core';
import { ApiBaseService } from '../api-base.service';
import { RecetaCard } from '../../Interfaces/RecetaCard';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RecipeService extends ApiBaseService {
  getRecipes(): Observable<RecetaCard[]> {
    return this.http.get<RecetaCard[]>(`${this.apiUrl}/recipes`);
  }

  
}
