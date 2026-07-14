import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { DocumentService } from '../../../core/services/document.service';
import { QuizService } from '../../../core/services/quiz.service';
import { FlashcardService } from '../../../core/services/flashcard.service';
import { StudyPlanService } from '../../../core/services/study-plan.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

interface QuickLink {
  label: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  bg: string;
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    RouterLink, MatCardModule, MatButtonModule, MatIconModule,
    MatDividerModule, LoadingSpinnerComponent, TimeAgoPipe,
  ],
  template: `
    <div class="page-container">
      <!-- Welcome banner -->
      <div class="welcome-banner">
        <div class="welcome-text">
          <h2>Hello, {{ auth.currentUser()?.firstName }}! 👋</h2>
          <p>Ready to learn something new today?</p>
        </div>
        <div class="welcome-actions">
          <button mat-raised-button routerLink="/student/quizzes" color="accent">
            <mat-icon>quiz</mat-icon> Take a Quiz
          </button>
          <button mat-stroked-button routerLink="/student/flashcards" class="white-btn">
            <mat-icon>style</mat-icon> Study Flashcards
          </button>
        </div>
      </div>

      @if (loading()) {
        <app-loading-spinner message="Loading your dashboard..." />
      } @else {
        <!-- Stats row -->
        <div class="stats-grid">
          @for (stat of stats(); track stat.label) {
            <mat-card class="stat-card" [routerLink]="stat.route"
                      [style.border-top]="'4px solid ' + stat.color">
              <mat-card-content>
                <mat-icon [style.color]="stat.color">{{ stat.icon }}</mat-icon>
                <h3>{{ stat.value }}</h3>
                <p>{{ stat.label }}</p>
              </mat-card-content>
            </mat-card>
          }
        </div>

        <!-- Quick links grid -->
        <h3 class="section-header">What would you like to do?</h3>
        <div class="quick-links-grid">
          @for (link of quickLinks; track link.label) {
            <mat-card class="quick-link-card" [routerLink]="link.route"
                      [style.background]="link.bg">
              <mat-card-content>
                <mat-icon [style.color]="link.color">{{ link.icon }}</mat-icon>
                <h4 [style.color]="link.color">{{ link.label }}</h4>
                <p>{{ link.description }}</p>
              </mat-card-content>
            </mat-card>
          }
        </div>

        <!-- Recent study plans -->
        @if (recentPlans().length > 0) {
          <mat-card class="content-section">
            <mat-card-header>
              <mat-card-title>My Study Plans</mat-card-title>
              <span class="spacer"></span>
              <button mat-button color="primary" routerLink="/student/study-plans">View all</button>
            </mat-card-header>
            <mat-divider />
            <mat-card-content>
              @for (plan of recentPlans(); track plan.id) {
                <div class="plan-row" [routerLink]="['/student/study-plans', plan.id]">
                  <mat-icon class="plan-icon">event_note</mat-icon>
                  <div class="plan-info">
                    <span class="plan-title">{{ plan.title }}</span>
                    <span class="plan-meta">{{ plan.durationDays }} days · {{ plan.createdAt | timeAgo }}</span>
                  </div>
                  <mat-icon class="arrow">chevron_right</mat-icon>
                </div>
              }
            </mat-card-content>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [`
    .page-container { max-width: 1000px; margin: 0 auto; padding: 24px 16px; }

    .welcome-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: linear-gradient(135deg, #059669, #10b981);
      color: white;
      border-radius: 16px;
      padding: 28px 32px;
      margin-bottom: 28px;
      flex-wrap: wrap;
      gap: 16px;
      h2 { margin: 0 0 6px; font-size: 1.6rem; font-weight: 700; }
      p  { margin: 0; opacity: 0.9; font-size: 1rem; }
    }
    .welcome-actions { display: flex; gap: 12px; flex-wrap: wrap; }
    .white-btn { color: white !important; border-color: rgba(255,255,255,0.5) !important; }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 14px;
      margin-bottom: 28px;
    }
    .stat-card {
      cursor: pointer;
      border-radius: 12px !important;
      transition: transform 0.15s, box-shadow 0.15s;
      &:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,0.12) !important; }
      mat-card-content {
        display: flex; flex-direction: column; align-items: center;
        text-align: center; padding: 20px 12px !important;
        mat-icon { font-size: 2rem; width: 2rem; height: 2rem; margin-bottom: 8px; }
        h3 { font-size: 1.8rem; font-weight: 700; margin: 0 0 4px; color: #1a1a2e; }
        p  { margin: 0; color: #6b7280; font-size: 0.8rem; }
      }
    }

    .section-header { font-size: 1.1rem; font-weight: 600; color: #374151; margin: 0 0 16px; }

    .quick-links-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 14px;
      margin-bottom: 28px;
    }
    .quick-link-card {
      cursor: pointer;
      border-radius: 14px !important;
      transition: transform 0.15s, box-shadow 0.15s;
      &:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }
      mat-card-content {
        padding: 24px 20px !important;
        mat-icon { font-size: 2.2rem; width: 2.2rem; height: 2.2rem; margin-bottom: 12px; }
        h4 { margin: 0 0 6px; font-size: 1rem; font-weight: 700; }
        p  { margin: 0; font-size: 0.8rem; color: #6b7280; line-height: 1.5; }
      }
    }

    .content-section {
      border-radius: 12px !important;
      mat-card-header { padding: 16px 16px 0; display: flex; align-items: center; }
      mat-card-content { padding: 16px !important; }
    }
    .spacer { flex: 1; }

    .plan-row {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 8px; border-radius: 8px; cursor: pointer;
      transition: background 0.15s;
      &:hover { background: #f9fafb; }
    }
    .plan-icon { color: #6366f1; }
    .plan-info { flex: 1; }
    .plan-title { display: block; font-weight: 500; color: #1a1a2e; }
    .plan-meta  { display: block; font-size: 0.8rem; color: #9ca3af; }
    .arrow { color: #d1d5db; }
  `],
})
export class StudentDashboardComponent implements OnInit {
  loading = signal(true);
  stats = signal<{ label: string; value: number; icon: string; color: string; route: string }[]>([]);
  recentPlans = signal<any[]>([]);

  quickLinks: QuickLink[] = [
    {
      label: 'Browse Documents',
      description: 'Read study materials uploaded by your teacher',
      icon: 'menu_book',
      route: '/student/documents',
      color: '#6366f1',
      bg: '#eef2ff',
    },
    {
      label: 'Take a Quiz',
      description: 'Test your knowledge with AI-generated quizzes',
      icon: 'quiz',
      route: '/student/quizzes',
      color: '#f59e0b',
      bg: '#fffbeb',
    },
    {
      label: 'Study Flashcards',
      description: 'Memorise key concepts with interactive flashcards',
      icon: 'style',
      route: '/student/flashcards',
      color: '#10b981',
      bg: '#f0fdf4',
    },
    {
      label: 'My Study Plans',
      description: 'Follow your personalised AI study schedule',
      icon: 'event_note',
      route: '/student/study-plans',
      color: '#3b82f6',
      bg: '#eff6ff',
    },
  ];

  constructor(
    public auth: AuthService,
    private docService: DocumentService,
    private quizService: QuizService,
    private flashcardService: FlashcardService,
    private studyPlanService: StudyPlanService,
  ) {}

  ngOnInit(): void {
    forkJoin({
      docs: this.docService.getAll(1, 1),
      quizzes: this.quizService.getAll(1, 1),
      flashcards: this.flashcardService.getAll(1, 1),
      plans: this.studyPlanService.getAll(),
    }).subscribe({
      next: ({ docs, quizzes, flashcards, plans }) => {
        this.stats.set([
          { label: 'Documents', value: docs.pagination.total,       icon: 'menu_book', color: '#6366f1', route: '/student/documents'   },
          { label: 'Quizzes',   value: quizzes.pagination.total,    icon: 'quiz',      color: '#f59e0b', route: '/student/quizzes'      },
          { label: 'Flashcard Sets', value: flashcards.pagination.total, icon: 'style', color: '#10b981', route: '/student/flashcards' },
          { label: 'Study Plans', value: (plans.data as any[]).length, icon: 'event_note', color: '#3b82f6', route: '/student/study-plans' },
        ]);
        this.recentPlans.set(((plans.data as any[]) ?? []).slice(0, 3));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
