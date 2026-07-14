import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { QuizService } from '../../../core/services/quiz.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Quiz, QuizQuestion, QuizAttempt } from '../../../core/models/quiz.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

type GameState = 'loading' | 'playing' | 'reviewing' | 'done';

@Component({
  selector: 'app-quiz-player',
  standalone: true,
  imports: [
    RouterLink, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatRadioModule,
    MatProgressBarModule, MatDividerModule, LoadingSpinnerComponent,
  ],
  template: `
    <div class="player-container">

      @if (state() === 'loading') {
        <app-loading-spinner message="Loading quiz..." />
      }

      @if (state() === 'playing' && quiz()) {
        <!-- Progress bar -->
        <div class="quiz-top-bar">
          <button mat-icon-button routerLink="/student/quizzes" aria-label="Exit quiz">
            <mat-icon>close</mat-icon>
          </button>
          <div class="progress-section">
            <span class="progress-label">{{ currentIndex() + 1 }} / {{ quiz()!.questions.length }}</span>
            <mat-progress-bar
              mode="determinate"
              [value]="progressPercent()"
              color="primary" />
          </div>
          <div class="timer" [class.timer-warning]="timeLeft() <= 60">
            <mat-icon>schedule</mat-icon>
            {{ formatTime(timeLeft()) }}
          </div>
        </div>

        <!-- Question card -->
        <mat-card class="question-card">
          <mat-card-content>
            <p class="question-num">Question {{ currentIndex() + 1 }}</p>
            <h3 class="question-text">{{ currentQuestion()?.questionText }}</h3>

            <mat-radio-group
              [(ngModel)]="selectedAnswer"
              class="options-group"
              aria-label="Select an answer">
              @for (option of currentQuestion()?.options ?? []; track option) {
                <label class="option-label" [class.selected]="selectedAnswer === option">
                  <mat-radio-button [value]="option" color="primary">
                    {{ option }}
                  </mat-radio-button>
                </label>
              }
            </mat-radio-group>
          </mat-card-content>

          <mat-card-actions class="question-actions">
            <button mat-button [disabled]="currentIndex() === 0" (click)="prev()">
              <mat-icon>arrow_back</mat-icon> Previous
            </button>
            <span class="spacer"></span>
            @if (currentIndex() < quiz()!.questions.length - 1) {
              <button mat-raised-button color="primary" (click)="next()">
                Next <mat-icon>arrow_forward</mat-icon>
              </button>
            } @else {
              <button mat-raised-button color="accent"
                      (click)="submitQuiz()"
                      [disabled]="submitting()">
                <mat-icon>check</mat-icon>
                {{ submitting() ? 'Submitting…' : 'Submit Quiz' }}
              </button>
            }
          </mat-card-actions>
        </mat-card>

        <!-- Answer progress dots -->
        <div class="dots-row">
          @for (q of quiz()!.questions; track q.id; let i = $index) {
            <button class="dot"
                    [class.answered]="answers()[q.id]"
                    [class.current]="i === currentIndex()"
                    (click)="goTo(i)"
                    [attr.aria-label]="'Question ' + (i + 1)">
            </button>
          }
        </div>
      }

      @if (state() === 'done' && attempt()) {
        <!-- Results screen -->
        <div class="results-screen">
          <div class="score-circle" [class]="getScoreClass(attempt()!.score!)">
            <span class="score-value">{{ attempt()!.score?.toFixed(0) }}%</span>
            <span class="score-label">Score</span>
          </div>

          <h2>{{ getScoreMessage(attempt()!.score!) }}</h2>
          <p class="results-sub">
            You answered correctly and finished in {{ formatTime(attempt()!.timeTakenSeconds ?? 0) }}.
          </p>

          <div class="results-actions">
            <button mat-stroked-button routerLink="/student/quizzes">
              <mat-icon>arrow_back</mat-icon> Back to Quizzes
            </button>
            <button mat-raised-button color="primary" (click)="retakeQuiz()">
              <mat-icon>refresh</mat-icon> Retake Quiz
            </button>
          </div>

          <!-- Answer review -->
          <mat-divider class="review-divider" />
          <h3 class="review-title">Answer Review</h3>
          @for (q of quiz()!.questions; track q.id) {
            <div class="review-item" [class]="getAnswerClass(q)">
              <div class="review-q">
                <mat-icon class="review-icon">
                  {{ isCorrect(q) ? 'check_circle' : 'cancel' }}
                </mat-icon>
                <p>{{ q.questionText }}</p>
              </div>
              <div class="review-answers">
                <span class="your-answer">
                  Your answer: <strong>{{ answers()[q.id] || 'Not answered' }}</strong>
                </span>
                @if (!isCorrect(q)) {
                  <span class="correct-answer">
                    Correct: <strong>{{ q.correctAnswer }}</strong>
                  </span>
                }
                @if (q.explanation) {
                  <span class="explanation">💡 {{ q.explanation }}</span>
                }
              </div>
            </div>
          }
        </div>
      }

    </div>
  `,
  styles: [`
    .player-container {
      max-width: 720px;
      margin: 0 auto;
      padding: 24px 16px;
      min-height: 100vh;
    }

    /* Top bar */
    .quiz-top-bar {
      display: flex; align-items: center; gap: 16px; margin-bottom: 24px;
    }
    .progress-section { flex: 1; display: flex; flex-direction: column; gap: 6px; }
    .progress-label { font-size: 0.85rem; color: #6b7280; text-align: right; }
    .timer {
      display: flex; align-items: center; gap: 4px;
      font-size: 0.95rem; font-weight: 600; color: #6366f1;
      background: #eef2ff; padding: 6px 12px; border-radius: 20px;
      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }
      &.timer-warning { color: #dc2626; background: #fee2e2; }
    }

    /* Question card */
    .question-card {
      border-radius: 16px !important;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1) !important;
      margin-bottom: 16px;
      mat-card-content { padding: 28px !important; }
      mat-card-actions { padding: 16px 24px !important; }
    }
    .question-num { color: #6366f1; font-weight: 600; font-size: 0.85rem; margin: 0 0 12px; }
    .question-text { font-size: 1.15rem; font-weight: 600; color: #1a1a2e; margin: 0 0 28px; line-height: 1.5; }

    .options-group { display: flex; flex-direction: column; gap: 10px; }
    .option-label {
      display: block; padding: 14px 16px; border: 2px solid #e5e7eb;
      border-radius: 10px; cursor: pointer; transition: all 0.15s;
      &:hover { border-color: #6366f1; background: #eef2ff; }
      &.selected { border-color: #6366f1; background: #eef2ff; }
    }

    .question-actions { display: flex; align-items: center; }
    .spacer { flex: 1; }

    /* Dots */
    .dots-row { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; padding: 8px; }
    .dot {
      width: 12px; height: 12px; border-radius: 50%;
      background: #e5e7eb; border: none; cursor: pointer; padding: 0;
      transition: background 0.15s, transform 0.15s;
      &.answered { background: #6366f1; }
      &.current { background: #3730a3; transform: scale(1.3); }
    }

    /* Results */
    .results-screen { display: flex; flex-direction: column; align-items: center; padding: 16px 0; }

    .score-circle {
      width: 140px; height: 140px; border-radius: 50%;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      margin-bottom: 24px; border: 6px solid;
      &.score-great  { border-color: #10b981; background: #f0fdf4; color: #065f46; }
      &.score-good   { border-color: #f59e0b; background: #fffbeb; color: #92400e; }
      &.score-poor   { border-color: #ef4444; background: #fef2f2; color: #991b1b; }
    }
    .score-value { font-size: 2.2rem; font-weight: 800; }
    .score-label { font-size: 0.8rem; font-weight: 500; opacity: 0.7; }

    h2 { font-size: 1.4rem; font-weight: 700; margin: 0 0 8px; color: #1a1a2e; }
    .results-sub { color: #6b7280; margin: 0 0 28px; text-align: center; }

    .results-actions { display: flex; gap: 12px; margin-bottom: 32px; flex-wrap: wrap; justify-content: center; }

    .review-divider { width: 100%; margin-bottom: 24px; }
    .review-title { font-size: 1.1rem; font-weight: 700; margin: 0 0 16px; align-self: flex-start; color: #374151; }

    .review-item {
      width: 100%; padding: 14px 16px; border-radius: 10px; margin-bottom: 10px;
      &.correct { background: #f0fdf4; border-left: 4px solid #10b981; }
      &.incorrect { background: #fef2f2; border-left: 4px solid #ef4444; }
    }
    .review-q { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 8px;
      p { margin: 0; font-weight: 600; color: #374151; line-height: 1.4; }
    }
    .review-icon {
      &:last-child { color: #10b981; }
    }
    .review-answers { display: flex; flex-direction: column; gap: 4px; padding-left: 30px; font-size: 0.85rem; }
    .your-answer   { color: #374151; }
    .correct-answer { color: #059669; font-weight: 500; }
    .explanation   { color: #6b7280; font-style: italic; }
  `],
})
export class QuizPlayerComponent implements OnInit, OnDestroy {
  quiz = signal<Quiz | null>(null);
  attempt = signal<QuizAttempt | null>(null);
  state = signal<GameState>('loading');
  currentIndex = signal(0);
  answers = signal<Record<number, string>>({});
  submitting = signal(false);
  timeLeft = signal(0);
  selectedAnswer = '';

  progressPercent = computed(() => {
    if (!this.quiz()) return 0;
    return ((this.currentIndex() + 1) / this.quiz()!.questions.length) * 100;
  });

  currentQuestion = computed((): QuizQuestion | null => {
    return this.quiz()?.questions[this.currentIndex()] ?? null;
  });

  private timerId?: ReturnType<typeof setInterval>;
  private startTime = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quizService: QuizService,
    private notify: NotificationService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.quizService.getById(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.quiz.set(res.data);
          this.startAttempt(id);
        }
      },
      error: () => {
        this.notify.error('Failed to load quiz.');
        this.router.navigate(['/student/quizzes']);
      },
    });
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private startAttempt(quizId: number): void {
    this.quizService.startAttempt(quizId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.attempt.set(res.data);
          this.timeLeft.set((this.quiz()!.timeLimitMinutes) * 60);
          this.startTime = Date.now();
          this.startTimer();
          this.state.set('playing');
        }
      },
    });
  }

  private startTimer(): void {
    this.timerId = setInterval(() => {
      this.timeLeft.update((t) => {
        if (t <= 1) {
          this.clearTimer();
          this.submitQuiz();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerId) clearInterval(this.timerId);
  }

  next(): void {
    this.saveCurrentAnswer();
    if (this.currentIndex() < this.quiz()!.questions.length - 1) {
      this.currentIndex.update((i) => i + 1);
      this.loadCurrentAnswer();
    }
  }

  prev(): void {
    this.saveCurrentAnswer();
    if (this.currentIndex() > 0) {
      this.currentIndex.update((i) => i - 1);
      this.loadCurrentAnswer();
    }
  }

  goTo(index: number): void {
    this.saveCurrentAnswer();
    this.currentIndex.set(index);
    this.loadCurrentAnswer();
  }

  private saveCurrentAnswer(): void {
    const q = this.currentQuestion();
    if (q && this.selectedAnswer) {
      this.answers.update((a) => ({ ...a, [q.id]: this.selectedAnswer }));
    }
  }

  private loadCurrentAnswer(): void {
    const q = this.currentQuestion();
    this.selectedAnswer = q ? (this.answers()[q.id] ?? '') : '';
  }

  submitQuiz(): void {
    this.saveCurrentAnswer();
    this.clearTimer();
    this.submitting.set(true);

    const timeTaken = Math.floor((Date.now() - this.startTime) / 1000);
    const stringAnswers: Record<string, string> = {};
    Object.entries(this.answers()).forEach(([k, v]) => { stringAnswers[k] = v; });

    this.quizService.submitAttempt(this.quiz()!.id, this.attempt()!.id, {
      answers: stringAnswers,
      timeTakenSeconds: timeTaken,
    }).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.success && res.data) {
          this.attempt.set(res.data);
          this.state.set('done');
          // Re-load quiz WITH answers for review
          this.quizService.getById(this.quiz()!.id).subscribe({
            next: (r) => { if (r.data) this.quiz.set(r.data); },
          });
        }
      },
      error: () => {
        this.submitting.set(false);
        this.notify.error('Failed to submit quiz.');
      },
    });
  }

  retakeQuiz(): void {
    this.answers.set({});
    this.currentIndex.set(0);
    this.selectedAnswer = '';
    this.attempt.set(null);
    this.state.set('loading');
    this.startAttempt(this.quiz()!.id);
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  isCorrect(q: QuizQuestion): boolean {
    return (this.answers()[q.id] ?? '').trim().toLowerCase() === (q.correctAnswer ?? '').trim().toLowerCase();
  }

  getAnswerClass(q: QuizQuestion): string {
    return this.isCorrect(q) ? 'correct' : 'incorrect';
  }

  getScoreClass(score: number): string {
    if (score >= 75) return 'score-great';
    if (score >= 50) return 'score-good';
    return 'score-poor';
  }

  getScoreMessage(score: number): string {
    if (score >= 90) return 'Outstanding! 🎉';
    if (score >= 75) return 'Great work! 👍';
    if (score >= 50) return 'Good effort! Keep studying.';
    return 'Keep practising — you\'ll get there!';
  }
}
