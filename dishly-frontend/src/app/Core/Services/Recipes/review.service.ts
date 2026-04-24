import { Injectable } from '@angular/core';
import { ApiBaseService } from '../api-base.service';
import { Observable } from 'rxjs';
import { Review } from '../../Interfaces/Review';

@Injectable({
  providedIn: 'root',
})
export class ReviewService extends ApiBaseService {
  
  // Sirve para obtener las reseñas de una receta
  getReviews(recipeId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/recipes/${recipeId}/reviews`);
  }

  // Sirve para enviar una reseña
  submitReview(data: { id_receta: number; puntuacion: number; comentario: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/recetas/valorar`, data);
  }

  // Sirve para actualizar una reseña
  updateReview(reviewId: number, comentario: string): Observable<any> {
    throw new Error("Plesae use updateReviewWithPuntuacion instead.");
  }
  
  // Sirve para actualizar una reseña con puntuación
  updateReviewWithPuntuacion(id_receta: number, puntuacion: number, comentario: string): Observable<any> {
      return this.http.post(`${this.apiUrl}/recetas/valorar`, {
          id_receta,
          puntuacion,
          comentario
      });
  }

  // Sirve para eliminar una reseña
  deleteReview(reviewId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/recetas/valorar/${reviewId}`);
  }
}
