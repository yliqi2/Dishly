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

  getForum(forumId: number): Observable<ForumDetail> {
    return this.http.get<ForumDetail>(`${this.apiUrl}/forums/${forumId}`);
  }

  createForum(payload: { titulo: string; descripcion: string }): Observable<ForumDetail> {
    return this.http.post<ForumDetail>(`${this.apiUrl}/forums`, payload);
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
