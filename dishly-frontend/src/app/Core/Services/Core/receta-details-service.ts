import { Injectable } from '@angular/core';
import { ApiBaseService } from '../api-base.service';
import { Observable } from 'rxjs';
import { RecetaOriginal } from '../../Interfaces/RecetaOriginal';

@Injectable({
  providedIn: 'root',
})
export class RecetaDetailsService extends ApiBaseService {
  // Sirve para obtener una receta por su ID
  getRecipeById(id: string | number): Observable<RecetaOriginal> {
    return this.http.get<RecetaOriginal>(`${this.apiUrl}/recipes/${id}`);
  }

  // Sirve para verificar si se ha adquirido una receta
  checkPurchase(id: string | number): Observable<{ purchased: boolean }> {
    return this.http.get<{ purchased: boolean }>(`${this.apiUrl}/recipes/${id}/check-purchase`);
  }
}
