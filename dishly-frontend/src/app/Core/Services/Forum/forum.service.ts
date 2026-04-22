import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from '../api-base.service';
import { ForumCommentResponse, ForumDetail, ForumSummary } from '../../Interfaces/Forum';

@Injectable({
  providedIn: 'root'
})
export class ForumService extends ApiBaseService {
  getForums(): Observable<ForumSummary[]> {
    return this.http.get<ForumSummary[]>(`${this.apiUrl}/forums`);
  }

  getForum(forumId: number, page: number = 1, perPage: number = 30): Observable<ForumDetail> {
    return this.http.get<ForumDetail>(`${this.apiUrl}/forums/${forumId}`, {
      params: {
        page: String(page),
        per_page: String(perPage),
      },
    });
  }

  createForum(payload: { titulo: string; descripcion: string }): Observable<ForumDetail> {
    return this.http.post<ForumDetail>(`${this.apiUrl}/forums`, payload);
  }

  updateForum(forumId: number, payload: { titulo: string; descripcion: string }): Observable<ForumDetail> {
    return this.http.put<ForumDetail>(`${this.apiUrl}/forums/${forumId}`, payload);
  }

  deleteForum(forumId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/forums/${forumId}`);
  }

  createComment(forumId: number, mensaje: string): Observable<ForumCommentResponse> {
    return this.http.post<ForumCommentResponse>(`${this.apiUrl}/forums/${forumId}/comments`, { mensaje });
  }

  updateComment(forumId: number, commentId: number, mensaje: string): Observable<ForumCommentResponse> {
    return this.http.put<ForumCommentResponse>(`${this.apiUrl}/forums/${forumId}/comments/${commentId}`, { mensaje });
  }

  deleteComment(forumId: number, commentId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/forums/${forumId}/comments/${commentId}`);
  }
}
