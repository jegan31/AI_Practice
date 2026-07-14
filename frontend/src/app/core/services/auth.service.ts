import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '@env/environment';
import {
  User, AuthResponse, LoginRequest, RegisterRequest,
} from '../models/user.model';
import { ApiResponse } from '../models/api.model';

const ACCESS_TOKEN_KEY = 'lc_access_token';
const REFRESH_TOKEN_KEY = 'lc_refresh_token';
const USER_KEY = 'lc_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  // Signals — reactive state for current user
  private _currentUser = signal<User | null>(this.loadUserFromStorage());
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly isTeacher = computed(() => this._currentUser()?.role === 'teacher');
  readonly isStudent = computed(() => this._currentUser()?.role === 'student');

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.storeSession(res.data);
        }
      }),
      catchError((err) => throwError(() => err))
    );
  }

  register(payload: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/register`, payload).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.storeSession(res.data);
        }
      })
    );
  }

  refreshToken(): Observable<ApiResponse<{ accessToken: string }>> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    return this.http
      .post<ApiResponse<{ accessToken: string }>>(
        `${this.apiUrl}/refresh`,
        {},
        { headers: { Authorization: `Bearer ${refreshToken}` } }
      )
      .pipe(
        tap((res) => {
          if (res.success && res.data) {
            localStorage.setItem(ACCESS_TOKEN_KEY, res.data.accessToken);
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  fetchCurrentUser(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/me`).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this._currentUser.set(res.data);
          localStorage.setItem(USER_KEY, JSON.stringify(res.data));
        }
      })
    );
  }

  private storeSession(data: AuthResponse): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    this._currentUser.set(data.user);
  }

  private loadUserFromStorage(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
}
