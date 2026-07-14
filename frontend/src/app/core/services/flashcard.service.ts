import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { FlashcardSet } from '../models/flashcard.model';
import { ApiResponse, PaginatedResponse } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class FlashcardService {
  private readonly apiUrl = `${environment.apiUrl}/flashcards`;

  constructor(private http: HttpClient) {}

  getAll(page = 1, perPage = 10): Observable<PaginatedResponse<FlashcardSet>> {
    const params = new HttpParams().set('page', page).set('perPage', perPage);
    return this.http.get<PaginatedResponse<FlashcardSet>>(this.apiUrl, { params });
  }

  getById(id: number): Observable<ApiResponse<FlashcardSet>> {
    return this.http.get<ApiResponse<FlashcardSet>>(`${this.apiUrl}/${id}`);
  }

  togglePublish(id: number): Observable<ApiResponse<FlashcardSet>> {
    return this.http.put<ApiResponse<FlashcardSet>>(`${this.apiUrl}/${id}/publish`, {});
  }
}
