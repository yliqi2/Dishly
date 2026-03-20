import { Injectable } from '@angular/core';
import { ApiBaseService } from '../api-base.service';
import { Observable } from 'rxjs';
import { RecetaOriginal } from '../../Interfaces/RecetaOriginal';

@Injectable({
  providedIn: 'root',
})
export class RecetaDetailsService extends ApiBaseService {
  getRecipeById(id: string | number): Observable<RecetaOriginal> {
    return this.http.get<RecetaOriginal>(`${this.apiUrl}/recipes/${id}`);
  }
}
