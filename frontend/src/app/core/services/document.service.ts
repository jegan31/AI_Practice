import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Document, DocumentSummary, UploadDocumentRequest } from '../models/document.model';
import { ApiResponse, PaginatedResponse } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly apiUrl = `${environment.apiUrl}/documents`;

  constructor(private http: HttpClient) {}

  upload(request: UploadDocumentRequest): Observable<ApiResponse<Document>> {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('title', request.title);
    if (request.subject) formData.append('subject', request.subject);
    if (request.gradeLevel) formData.append('gradeLevel', request.gradeLevel);
    if (request.description) formData.append('description', request.description);
    return this.http.post<ApiResponse<Document>>(`${this.apiUrl}/upload`, formData);
  }

  getAll(page = 1, perPage = 10, subject?: string): Observable<PaginatedResponse<Document>> {
    let params = new HttpParams()
      .set('page', page)
      .set('perPage', perPage);
    if (subject) params = params.set('subject', subject);
    return this.http.get<PaginatedResponse<Document>>(this.apiUrl, { params });
  }

  getById(id: number): Observable<ApiResponse<Document>> {
    return this.http.get<ApiResponse<Document>>(`${this.apiUrl}/${id}`);
  }

  update(id: number, data: Partial<Document>): Observable<ApiResponse<Document>> {
    return this.http.put<ApiResponse<Document>>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
