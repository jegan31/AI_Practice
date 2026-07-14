import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { QuizService } from '../../../core/services/quiz.service';
import { Quiz } from '../../../core/models/quiz.model';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-quiz-list',
  standalone: true,
  imports: [
    RouterLink, MatCardModule, MatButtonModule, MatIconModule,
    MatPaginatorModule, MatChipsModule, TimeAgoPipe,
    LoadingSpinnerComponent, EmptyStateComponent,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2 class="section-title">Available Quizzes</h2>
        <p class="section-subtitle">Test your knowledge with AI-generated quizzes</p>
      </div>

      @if (loading()) {
        <app-loading-spinner message="Loading quizzes..." />
      } @else if (quizzes().length === 0) {
        <app-empty-state
          icon="quiz"
          title="No quizzes available"
          message="Your teacher hasn't published any quizzes yet. Check back soon!" />
      } @else {
        <div class="quiz-grid">
          @for (quiz of quizzes(); track quiz.id) {
            <mat-card class="quiz-card">
              <mat-card-content>
                <div class="quiz-header">
                  <mat-icon class="quiz-icon">quiz</mat-icon>
                  <span class="diff-badge diff-{{ quiz.difficulty }}">
                    {{ quiz.difficulty | titlecase }}
                  </span>
                </div>
                <h3 class="quiz-title">{{ quiz.title }}</h3>
                @if (quiz.description) {
                  <p class="quiz-desc">{{ quiz.description }}</p>
                }
                <div class="quiz-meta">
                  <span><mat-icon>help_outline</mat-icon> {{ quiz.questionCount }} questions</span>
                  <span><mat-icon>schedule</mat-icon> {{ quiz.timeLimitMinutes }} min</span>
                </div>
              </mat-card-content>
              <mat-card-actions>
                <button mat-raised-button color="primary"
                        [routerLink]="['/student/quizzes', quiz.id, 'play']">
                  <mat-icon>play_arrow</mat-icon> Start Quiz
                </button>
              </mat-card-actions>
            </mat-card>
          }
        </div>

        <mat-paginator
          [length]="totalQuizzes()"
          [pageSize]="pageSize"
          [pageSizeOptions]="[6, 12]"
          (page)="onPage($event)"
          aria-label="Quiz pagination">
        </mat-paginator>
      }
    </div>
  `,
  styles: [`
    .page-container { max-width: 1000px; margin: 0 auto; padding: 24px 16px; }
    .page-header { margin-bottom: 24px; }
    .section-title { margin: 0 0 4px; font-size: 1.5rem; font-weight: 600; }
    .section-subtitle { margin: 0; color: #6b7280; font-size: 0.9rem; }

    .quiz-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }

    .quiz-card {
      border-radius: 14px !important;
      border-top: 4px solid #f59e0b;
      transition: transform 0.15s, box-shadow 0.15s;
      &:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important; }
      mat-card-content { padding: 20px !important; }
      mat-card-actions { padding: 0 16px 16px !important; }
    }

    .quiz-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .quiz-icon { font-size: 2rem; width: 2rem; height: 2rem; color: #f59e0b; }
    .quiz-title { font-size: 1rem; font-weight: 600; color: #1a1a2e; margin: 0 0 8px; }
    .quiz-desc { color: #6b7280; font-size: 0.85rem; margin: 0 0 12px;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }

    .quiz-meta { display: flex; gap: 16px; color: #9ca3af; font-size: 0.8rem;
      span { display: flex; align-items: center; gap: 4px; }
      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }
    }

    .diff-badge {
      font-size: 0.72rem; border-radius: 12px; padding: 2px 10px; font-weight: 600;
      &.diff-easy   { background: #d1fae5; color: #065f46; }
      &.diff-medium { background: #fef3c7; color: #92400e; }
      &.diff-hard   { background: #fee2e2; color: #991b1b; }
    }
  `],
})
export class QuizListComponent implements OnInit {
  quizzes = signal<Quiz[]>([]);
  totalQuizzes = signal(0);
  loading = signal(true);
  page = 1;
  pageSize = 6;

  constructor(private quizService: QuizService) {}

  ngOnInit(): void {
    this.loadQuizzes();
  }

  loadQuizzes(): void {
    this.loading.set(true);
    this.quizService.getAll(this.page, this.pageSize).subscribe({
      next: (res) => {
        this.quizzes.set(res.data);
        this.totalQuizzes.set(res.pagination.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPage(e: PageEvent): void {
    this.page = e.pageIndex + 1;
    this.pageSize = e.pageSize;
    this.loadQuizzes();
  }
}
