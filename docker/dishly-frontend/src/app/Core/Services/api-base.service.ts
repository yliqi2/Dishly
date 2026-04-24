import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';

export abstract class ApiBaseService {
  protected readonly apiUrl = '/api';
  protected readonly http = inject(HttpClient);
}
