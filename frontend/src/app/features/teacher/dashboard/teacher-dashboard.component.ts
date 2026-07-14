import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { forkJoin } from 'rxjs';
import { DocumentService } from '../../../core/services/document.service';
import { QuizService } from '../../../core/services/quiz.service';
import { FlashcardService } from '../../../core/services/flashcard.service';
import { AuthService } from '../../../core/services/auth.service';
import { Document } from '../../../core/models/document.model';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

interface StatCard {
  label: string;
  value: number;
  icon: string;
  color: string;
  route: string;
}

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [
    RouterLink, MatCardModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatChipsModule, TimeAgoPipe, LoadingSpinnerComponent,
  ],
  template: `
    <div class="page-container">
      <!-- Welcome banner -->
      <div class="welcome-banner">
        <div>
          <h2>Welcome back, {{ auth.currentUser()?.firstName }}!</h2>
          <p>Manage your teaching materials and track student progress.</p>
        </div>
        <button mat-raised-button color="accent" routerLink="/teacher/documents/upload">
          <mat-icon>upload_file</mat-icon> Upload Document
        </button>
      </div>

      <!-- Stats row -->
      @if (loading()) {
        <app-loading-spinner message="Loading dashboard..." />
      } @else {
        <div class="stats-grid">
          @for (stat of stats(); track stat.label) {
            <mat-card class="stat-card" [routerLink]="stat.route"
                      [style.border-left]="'4px solid ' + stat.color">
              <mat-card-content>
                <div class="stat-inner">
                  <div>
                    <p class="stat-label">{{ stat.label }}</p>
                    <h3 class="stat-value">{{ stat.value }}</h3>
                  </div>
                  <mat-icon [style.color]="stat.color" class="stat-icon">{{ stat.icon }}</mat-icon>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>

        <!-- Recent documents -->
        <mat-card class="content-card">
          <mat-card-header>
            <mat-card-title>Recent Documents</mat-card-title>
            <span class="spacer"></span>
            <button mat-button color="primary" routerLink="/teacher/documents">View all</button>
          </mat-card-header>
          <mat-divider />
          <mat-card-content>
            @if (recentDocs().length === 0) {
              <div class="empty-hint">
                <mat-icon>folder_open</mat-icon>
                <p>No documents yet. <a routerLink="/teacher/documents/upload">Upload your first PDF</a></p>
              </div>
            } @else {
              <div class="doc-list">
                @for (doc of recentDocs(); track doc.id) {
                  <div class="doc-row" [routerLink]="['/teacher/documents', doc.id]">
                    <mat-icon class="doc-icon">picture_as_pdf</mat-icon>
                    <div class="doc-info">
                      <span class="doc-title">{{ doc.title }}</span>
                      <span class="doc-meta">
                        {{ doc.subject || 'No subject' }} · {{ doc.createdAt | timeAgo }}
                      </span>
                    </div>
                    <span class="ai-chip"
                          [class]="doc.aiProcessed ? 'chip-success' : 'chip-warning'">
                      {{ doc.aiProcessed ? 'AI Ready' : doc.aiProcessingStatus }}
                    </span>
                  </div>
                }
              </div>
            }
          </mat-card-content>
        </mat-card>

        <!-- Quick actions -->
        <mat-card class="content-card">
          <mat-card-header>
            <mat-card-title>Quick Actions</mat-card-title>
          </mat-card-header>
          <mat-divider />
          <mat-card-content>
            <div class="quick-actions">
              @for (action of quickActions; track action.label) {
                <button mat-stroked-button [routerLink]="action.route"
                        class="action-btn" [style.color]="action.color">
                  <mat-icon>{{ action.icon }}</mat-icon>
                  {{ action.label }}
                </button>
              }
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .page-container { max-width: 1100px; margin: 0 auto; padding: 24px 16px; }

    .welcome-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: linear-gradient(135deg, #3730a3, #6366f1);
      color: white;
      border-radius: 16px;
      padding: 24px 32px;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
      h2 { margin: 0 0 4px; font-size: 1.5rem; font-weight: 700; }
      p  { margin: 0; opacity: 0.85; }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
      border-radius: 12px !important;
      &:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,0.12) !important; }
    }

    .stat-inner { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; }
    .stat-label { color: #6b7280; font-size: 0.85rem; margin: 0 0 4px; }
    .stat-value { font-size: 2rem; font-weight: 700; margin: 0; color: #1a1a2e; }
    .stat-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; opacity: 0.8; }

    .content-card {
      margin-bottom: 20px;
      border-radius: 12px !important;
      mat-card-header { padding: 16px 16px 0; display: flex; align-items: center; }
      mat-card-content { padding: 16px !important; }
    }

    .spacer { flex: 1; }

    .doc-list { display: flex; flex-direction: column; gap: 4px; }
    .doc-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s;
      &:hover { background: #f5f5f5; }
    }
    .doc-icon { color: #ef4444; }
    .doc-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .doc-title { font-weight: 500; color: #1a1a2e; font-size: 0.95rem; }
    .doc-meta { font-size: 0.8rem; color: #9ca3af; }

    .empty-hint {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px;
      color: #9ca3af;
      mat-icon { font-size: 2rem; width: 2rem; height: 2rem; }
      a { color: #6366f1; }
    }

    .quick-actions { display: flex; flex-wrap: wrap; gap: 12px; padding: 8px 0; }
    .action-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 20px;
      border-radius: 8px !important;
    }
  `],
})
export class TeacherDashboardComponent implements OnInit {
  loading = signal(true);
  stats = signal<StatCard[]>([]);
  recentDocs = signal<Document[]>([]);

  quickActions = [
    { label: 'Upload PDF',       icon: 'upload_file', route: '/teacher/documents/upload', color: '#6366f1' },
    { label: 'Manage Quizzes',   icon: 'quiz',        route: '/teacher/quizzes',          color: '#f59e0b' },
    { label: 'Manage Flashcards',icon: 'style',       route: '/teacher/flashcards',       color: '#10b981' },
    { label: 'View Students',    icon: 'people',      route: '/teacher/students',         color: '#3b82f6' },
  ];

  constructor(
    public auth: AuthService,
    private docService: DocumentService,
    private quizService: QuizService,
    private flashcardService: FlashcardService,
  ) {}

  ngOnInit(): void {
    forkJoin({
      docs: this.docService.getAll(1, 5),
      quizzes: this.quizService.getAll(1, 1),
      flashcards: this.flashcardService.getAll(1, 1),
    }).subscribe({
      next: ({ docs, quizzes, flashcards }) => {
        this.recentDocs.set(docs.data);
        this.stats.set([
          { label: 'Total Documents', value: docs.pagination.total,       icon: 'folder',  color: '#6366f1', route: '/teacher/documents'  },
          { label: 'Total Quizzes',   value: quizzes.pagination.total,    icon: 'quiz',    color: '#f59e0b', route: '/teacher/quizzes'    },
          { label: 'Flashcard Sets',  value: flashcards.pagination.total, icon: 'style',   color: '#10b981', route: '/teacher/flashcards' },
          { label: 'AI Processed',    value: docs.data.filter(d => d.aiProcessed).length, icon: 'auto_awesome', color: '#8b5cf6', route: '/teacher/documents' },
        ]);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
