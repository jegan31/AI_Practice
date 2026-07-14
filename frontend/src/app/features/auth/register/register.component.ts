import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatSelectModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="auth-wrapper">
      <mat-card class="auth-card">
        <mat-card-header>
          <div class="auth-logo">
            <mat-icon>school</mat-icon>
            <h1>Learning Coach</h1>
          </div>
          <mat-card-title>Create account</mat-card-title>
          <mat-card-subtitle>Join the Learning Coach platform</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
            <div class="name-row">
              <mat-form-field appearance="outline">
                <mat-label>First Name</mat-label>
                <input matInput formControlName="firstName">
                @if (form.get('firstName')?.hasError('required') && form.get('firstName')?.touched) {
                  <mat-error>Required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Last Name</mat-label>
                <input matInput formControlName="lastName">
                @if (form.get('lastName')?.hasError('required') && form.get('lastName')?.touched) {
                  <mat-error>Required</mat-error>
                }
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email">
              <mat-icon matPrefix>email</mat-icon>
              @if (form.get('email')?.hasError('required') && form.get('email')?.touched) {
                <mat-error>Email is required</mat-error>
              }
              @if (form.get('email')?.hasError('email') && form.get('email')?.touched) {
                <mat-error>Enter a valid email</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Role</mat-label>
              <mat-select formControlName="role">
                <mat-option value="student">Student</mat-option>
                <mat-option value="teacher">Teacher / Admin</mat-option>
              </mat-select>
              <mat-icon matPrefix>badge</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput [type]="showPassword() ? 'text' : 'password'"
                     formControlName="password">
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button matSuffix type="button"
                      (click)="showPassword.set(!showPassword())">
                <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (form.get('password')?.hasError('minlength') && form.get('password')?.touched) {
                <mat-error>Minimum 8 characters</mat-error>
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
                Create Account
              }
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions>
          <p class="auth-link">
            Already have an account? <a routerLink="/auth/login">Sign in</a>
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
      max-width: 440px;
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
    .name-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      mat-form-field { width: 100%; }
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
export class RegisterComponent {
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
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['student', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMessage.set('');

    this.auth.register(this.form.value).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          const role = res.data.user.role;
          this.notify.success('Account created successfully!');
          this.router.navigate([role === 'teacher' ? '/teacher' : '/student']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err?.error?.error ?? 'Registration failed. Please try again.'
        );
      },
    });
  }
}
