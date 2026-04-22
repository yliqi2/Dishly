import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from '../Core/Services/api-base.service';
import { RecetaResponse } from '../Models/recipe-chatbot.model';

@Injectable({
  providedIn: 'root'
})
export class RecipeChatbotService extends ApiBaseService {
  // El endpoint base viene de ApiBaseService (protected readonly apiUrl = '/api')
  
  /**
   * Busca una receta enviando un mensaje al chatbot
   * @param mensaje El mensaje o pregunta del usuario
   * @returns Observable con la respuesta del chatbot y la receta
   */
  buscarReceta(mensaje: string): Observable<RecetaResponse> {
    return this.http.post<RecetaResponse>(`${this.apiUrl}/chatbot/receta/buscar`, { mensaje });
  }
}
