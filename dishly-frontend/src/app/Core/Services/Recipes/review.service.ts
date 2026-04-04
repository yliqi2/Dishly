import { Injectable } from '@angular/core';
import { ApiBaseService } from '../api-base.service';
import { Observable } from 'rxjs';
import { Review } from '../../Interfaces/Review';

@Injectable({
  providedIn: 'root',
})
export class ReviewService extends ApiBaseService {
  
  getReviews(recipeId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/recipes/${recipeId}/reviews`);
  }

  submitReview(data: { id_receta: number; puntuacion: number; comentario: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/recetas/valorar`, data);
  }

  updateReview(reviewId: number, comentario: string): Observable<any> {
    // Actually our backend for update is the same as insert, but wait, we need id_receta and puntuacion for setValoracion.
    // Instead of duplicating setValoracion logic in frontend for updates, actually wait...
    // The previous implementation used PUT /api/reviews/{id}.
    // But since we reverted the backend, let's just make updateReview use the POST /api/recetas/valorar IF IT HAS RECIPE ID.
    // However, updateReview signature is (reviewId, comentario). It doesnt have id_receta!
    // Since we are creating a fresh ReviewService, let's fix it.
    throw new Error("Plesae use updateReviewWithPuntuacion instead.");
  }
  
  updateReviewWithPuntuacion(id_receta: number, puntuacion: number, comentario: string): Observable<any> {
      return this.http.post(`${this.apiUrl}/recetas/valorar`, {
          id_receta,
          puntuacion,
          comentario
      });
  }

  deleteReview(reviewId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/recetas/valorar/${reviewId}`);
  }
}
