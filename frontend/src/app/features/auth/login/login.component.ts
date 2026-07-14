import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="auth-wrapper">
      <mat-card class="auth-card">
        <mat-card-header>
          <div class="auth-logo">
            <mat-icon>school</mat-icon>
            <h1>Learning Coach</h1>
          </div>
          <mat-card-title>Welcome back</mat-card-title>
          <mat-card-subtitle>Sign in to your account</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email">
              <mat-icon matPrefix>email</mat-icon>
              @if (form.get('email')?.hasError('required') && form.get('email')?.touched) {
                <mat-error>Email is required</mat-error>
              }
              @if (form.get('email')?.hasError('email') && form.get('email')?.touched) {
                <mat-error>Enter a valid email address</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput [type]="showPassword() ? 'text' : 'password'"
                     formControlName="password" autocomplete="current-password">
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button matSuffix type="button"
                      (click)="showPassword.set(!showPassword())">
                <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (form.get('password')?.hasError('required') && form.get('password')?.touched) {
                <mat-error>Password is required</mat-error>
              }
            </mat-form-field>

            @if (errorMessage()) {
              <p class="error-message">{{ errorMessage() }}</p>
            }

            <button mat-raised-button color="primary" type="submit"
                    class="full-width submit-btn" [disabled]="loading()">
              @if (loading()) {
                <mat-spinner diameter="20" />
              } @else {
                Sign In
              }
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions>
          <p class="auth-link">
            Don't have an account? <a routerLink="/auth/register">Register here</a>
          </p>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #3730a3 0%, #6366f1 50%, #8b5cf6 100%);
      padding: 16px;
    }
    .auth-card {
      width: 100%;
      max-width: 420px;
      border-radius: 16px !important;
      padding: 8px;
    }
    .auth-logo {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      color: #6366f1;
      mat-icon { font-size: 2rem; width: 2rem; height: 2rem; }
      h1 { font-size: 1.4rem; font-weight: 700; margin: 0; color: #1a1a2e; }
    }
    .full-width { width: 100%; }
    .submit-btn { height: 48px; font-size: 1rem; margin-top: 8px; }
    .error-message { color: #dc2626; font-size: 0.875rem; margin-bottom: 8px; }
    .auth-link { text-align: center; color: #6b7280; font-size: 0.9rem;
      a { color: #6366f1; text-decoration: none; font-weight: 500; }
    }
    mat-card-header { flex-direction: column; }
    mat-card-title { font-size: 1.5rem !important; font-weight: 600 !important; }
  `],
})
export class LoginComponent {
  form: FormGroup;
  loading = signal(false);
  showPassword = signal(false);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private notify: NotificationService,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMessage.set('');

    this.auth.login(this.form.value).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          const role = res.data.user.role;
          this.notify.success(`Welcome back, ${res.data.user.firstName}!`);
          this.router.navigate([role === 'teacher' ? '/teacher' : '/student']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err?.error?.error ?? 'Login failed. Please check your credentials.'
        );
      },
    });
  }
}
