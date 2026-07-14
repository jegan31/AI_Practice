import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { StudyPlan } from '../models/study-plan.model';
import { ApiResponse } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class StudyPlanService {
  private readonly apiUrl = `${environment.apiUrl}/study-plans`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<StudyPlan[]>> {
    return this.http.get<ApiResponse<StudyPlan[]>>(this.apiUrl);
  }

  getById(id: number): Observable<ApiResponse<StudyPlan>> {
    return this.http.get<ApiResponse<StudyPlan>>(`${this.apiUrl}/${id}`);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
