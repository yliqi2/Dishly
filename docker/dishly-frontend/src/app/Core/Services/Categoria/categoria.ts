import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CategoriaItem } from '../../Interfaces/CategoriaItem';
import { ApiBaseService } from '../api-base.service';

@Injectable({
  providedIn: 'root',
})
export class Categoria extends ApiBaseService {
  getAll(): Observable<CategoriaItem[]> {
    return this.http.get<CategoriaItem[]>(`${this.apiUrl}/recetas/categorias`);
  }
}
