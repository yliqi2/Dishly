import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';
import { CategoriaItem } from '../../Interfaces/CategoriaItem';



@Injectable({
  providedIn: 'root',
})
export class Categoria {
  private apiUrl = '/api';
  private http = inject(HttpClient);

  getAll(): Observable<CategoriaItem[]> {
    return this.http.get<CategoriaItem[]>(`${this.apiUrl}/recetas/categorias`);
  }
}
