import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';

export abstract class ApiBaseService {
  // Sirve para definir la URL base de la API
  protected readonly apiUrl = '/api';
  protected readonly http = inject(HttpClient);
}
