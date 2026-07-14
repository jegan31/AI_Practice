import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { DocumentSummary } from '../models/document.model';
import { ApiResponse } from '../models/api.model';
import { StudyPlan, GenerateStudyPlanRequest } from '../models/study-plan.model';
import { Quiz } from '../models/quiz.model';
import { FlashcardSet } from '../models/flashcard.model';

export interface ProcessResult {
  document: unknown;
  quiz: Quiz;
  flashcardSet: FlashcardSet;
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly apiUrl = `${environment.apiUrl}/ai`;

  constructor(private http: HttpClient) {}

  processDocument(docId: number): Observable<ApiResponse<ProcessResult>> {
    return this.http.post<ApiResponse<ProcessResult>>(
      `${this.apiUrl}/process/${docId}`, {}
    );
  }

  getSummary(docId: number): Observable<ApiResponse<DocumentSummary>> {
    return this.http.get<ApiResponse<DocumentSummary>>(`${this.apiUrl}/summary/${docId}`);
  }

  chat(
    docId: number,
    question: string,
    history: { role: string; content: string }[]
  ): Observable<ApiResponse<{ question: string; answer: string }>> {
    return this.http.post<ApiResponse<{ question: string; answer: string }>>(
      `${this.apiUrl}/chat/${docId}`,
      { question, history }
    );
  }

  generateStudyPlan(
    docId: number,
    request: GenerateStudyPlanRequest
  ): Observable<ApiResponse<StudyPlan>> {
    return this.http.post<ApiResponse<StudyPlan>>(
      `${this.apiUrl}/study-plan/${docId}`, request
    );
  }
}
