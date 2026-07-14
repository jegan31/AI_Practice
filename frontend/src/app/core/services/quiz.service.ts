import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Quiz, QuizAttempt, SubmitAttemptRequest } from '../models/quiz.model';
import { ApiResponse, PaginatedResponse } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class QuizService {
  private readonly apiUrl = `${environment.apiUrl}/quizzes`;

  constructor(private http: HttpClient) {}

  getAll(page = 1, perPage = 10): Observable<PaginatedResponse<Quiz>> {
    const params = new HttpParams().set('page', page).set('perPage', perPage);
    return this.http.get<PaginatedResponse<Quiz>>(this.apiUrl, { params });
  }

  getById(id: number): Observable<ApiResponse<Quiz>> {
    return this.http.get<ApiResponse<Quiz>>(`${this.apiUrl}/${id}`);
  }

  togglePublish(id: number): Observable<ApiResponse<Quiz>> {
    return this.http.put<ApiResponse<Quiz>>(`${this.apiUrl}/${id}/publish`, {});
  }

  startAttempt(quizId: number): Observable<ApiResponse<QuizAttempt>> {
    return this.http.post<ApiResponse<QuizAttempt>>(
      `${this.apiUrl}/${quizId}/attempts`, {}
    );
  }

  submitAttempt(
    quizId: number,
    attemptId: number,
    payload: SubmitAttemptRequest
  ): Observable<ApiResponse<QuizAttempt>> {
    return this.http.put<ApiResponse<QuizAttempt>>(
      `${this.apiUrl}/${quizId}/attempts/${attemptId}/submit`, payload
    );
  }

  getAttempts(quizId: number): Observable<ApiResponse<QuizAttempt[]>> {
    return this.http.get<ApiResponse<QuizAttempt[]>>(`${this.apiUrl}/${quizId}/attempts`);
  }
}
