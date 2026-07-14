import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { QuizService } from '../../../core/services/quiz.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Quiz } from '../../../core/models/quiz.model';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-quiz-management',
  standalone: true,
  imports: [
    RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatTableModule,
    MatPaginatorModule, MatTooltipModule, MatSlideToggleModule, MatExpansionModule,
    MatDividerModule, TimeAgoPipe, LoadingSpinnerComponent, EmptyStateComponent,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2 class="section-title">Quizzes</h2>
          <p class="section-subtitle">Publish quizzes for students to take</p>
        </div>
      </div>

      @if (loading()) {
        <app-loading-spinner message="Loading quizzes..." />
      } @else if (quizzes().length === 0) {
        <app-empty-state
          icon="quiz"
          title="No quizzes yet"
          message="Quizzes are auto-generated when you upload and process a PDF document.">
          <button mat-raised-button color="primary" routerLink="/teacher/documents/upload">
            <mat-icon>upload_file</mat-icon> Upload a Document
          </button>
        </app-empty-state>
      } @else {
        <mat-accordion class="quiz-accordion">
          @for (quiz of quizzes(); track quiz.id) {
            <mat-expansion-panel class="quiz-panel">
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <mat-icon class="panel-icon">quiz</mat-icon>
                  {{ quiz.title }}
                </mat-panel-title>
                <mat-panel-description>
                  <span class="q-count">{{ quiz.questionCount }} questions</span>
                  <span [class]="quiz.isPublished ? 'chip-success' : 'chip-warning'" class="pub-chip">
                    {{ quiz.isPublished ? 'Published' : 'Draft' }}
                  </span>
                  <span class="diff-badge diff-{{ quiz.difficulty }}">{{ quiz.difficulty | titlecase }}</span>
                </mat-panel-description>
              </mat-expansion-panel-header>

              <!-- Panel body -->
              <div class="panel-body">
                <div class="panel-actions">
                  <button mat-stroked-button color="primary"
                          (click)="togglePublish(quiz)">
                    <mat-icon>{{ quiz.isPublished ? 'unpublished' : 'publish' }}</mat-icon>
                    {{ quiz.isPublished ? 'Unpublish' : 'Publish to Students' }}
                  </button>
                </div>
                <mat-divider />
                <h4>Questions Preview</h4>
                @for (q of quiz.questions.slice(0, 3); track q.id) {
                  <div class="q-preview">
                    <span class="q-num">Q{{ q.orderIndex + 1 }}.</span>
                    <span>{{ q.questionText }}</span>
                  </div>
                }
                @if (quiz.questionCount > 3) {
                  <p class="more-hint">… and {{ quiz.questionCount - 3 }} more questions</p>
                }
              </div>
            </mat-expansion-panel>
          }
        </mat-accordion>

        <mat-paginator
          [length]="totalQuizzes()"
          [pageSize]="pageSize"
          [pageSizeOptions]="[5, 10]"
          (page)="onPage($event)"
          aria-label="Quizzes pagination">
        </mat-paginator>
      }
    </div>
  `,
  styles: [`
    .page-container { max-width: 900px; margin: 0 auto; padding: 24px 16px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
    .section-title { margin: 0 0 4px; font-size: 1.5rem; font-weight: 600; }
    .section-subtitle { margin: 0; color: #6b7280; font-size: 0.9rem; }

    .quiz-accordion { display: flex; flex-direction: column; gap: 8px; }
    .quiz-panel { border-radius: 12px !important; }

    mat-panel-title { display: flex; align-items: center; gap: 10px; font-weight: 600; }
    mat-panel-description { display: flex; align-items: center; gap: 8px; }
    .panel-icon { color: #f59e0b; }
    .q-count { color: #6b7280; font-size: 0.85rem; }
    .pub-chip { font-size: 0.75rem !important; }

    .diff-badge {
      font-size: 0.72rem;
      border-radius: 12px;
      padding: 2px 8px;
      font-weight: 600;
      &.diff-easy   { background: #d1fae5; color: #065f46; }
      &.diff-medium { background: #fef3c7; color: #92400e; }
      &.diff-hard   { background: #fee2e2; color: #991b1b; }
    }

    .panel-body { padding: 8px 0; }
    .panel-actions { display: flex; gap: 8px; margin-bottom: 16px; }

    h4 { font-size: 0.95rem; font-weight: 600; color: #374151; margin: 16px 0 10px; }
    .q-preview { display: flex; gap: 8px; padding: 8px 0; border-bottom: 1px solid #f3f4f6;
      color: #374151; font-size: 0.9rem;
      .q-num { font-weight: 600; color: #6366f1; min-width: 28px; }
    }
    .more-hint { color: #9ca3af; font-size: 0.85rem; margin-top: 8px; }
  `],
})
export class QuizManagementComponent implements OnInit {
  quizzes = signal<Quiz[]>([]);
  totalQuizzes = signal(0);
  loading = signal(true);
  page = 1;
  pageSize = 10;

  constructor(
    private quizService: QuizService,
    private notify: NotificationService,
  ) {}

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

  togglePublish(quiz: Quiz): void {
    this.quizService.togglePublish(quiz.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const updated = this.quizzes().map((q) =>
            q.id === quiz.id ? { ...q, isPublished: res.data!.isPublished } : q
          );
          this.quizzes.set(updated);
          this.notify.success(res.message);
        }
      },
      error: () => this.notify.error('Failed to update quiz'),
    });
  }
}
