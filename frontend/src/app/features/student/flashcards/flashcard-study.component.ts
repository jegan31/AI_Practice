import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { FlashcardService } from '../../../core/services/flashcard.service';
import { FlashcardSet, Flashcard } from '../../../core/models/flashcard.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-flashcard-study',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule, MatButtonModule, MatIconModule,
    MatProgressBarModule, MatDividerModule, LoadingSpinnerComponent,
  ],
  template: `
    <div class="study-container">

      @if (loading()) {
        <app-loading-spinner message="Loading flashcards..." />
      } @else if (set()) {

        <!-- Header -->
        <div class="study-header">
          <button mat-icon-button routerLink="/student/flashcards" aria-label="Exit">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="header-info">
            <h3>{{ set()!.title }}</h3>
            <mat-progress-bar mode="determinate" [value]="progressPercent()" color="primary" />
          </div>
          <span class="card-counter">{{ currentIndex() + 1 }} / {{ set()!.cards.length }}</span>
        </div>

        @if (!finished()) {
          <!-- Flashcard -->
          <div class="card-area" (click)="flip()" (keyup.space)="flip()" tabindex="0"
               role="button" [attr.aria-label]="flipped() ? 'Back side — click to flip' : 'Front side — click to flip'">
            <div class="flashcard" [class.flipped]="flipped()">
              <!-- Front -->
              <div class="card-face card-front">
                <div class="face-label">Question</div>
                <div class="card-text">{{ currentCard()?.front }}</div>
                @if (currentCard()?.hint && !flipped()) {
                  <div class="hint-row">
                    <mat-icon>lightbulb</mat-icon>
                    <span>Hint: {{ currentCard()!.hint }}</span>
                  </div>
                }
                <div class="flip-hint">
                  <mat-icon>touch_app</mat-icon> Tap to reveal answer
                </div>
              </div>
              <!-- Back -->
              <div class="card-face card-back">
                <div class="face-label">Answer</div>
                <div class="card-text">{{ currentCard()?.back }}</div>
              </div>
            </div>
          </div>

          <!-- Nav buttons — only after flip -->
          @if (flipped()) {
            <div class="rate-row">
              <p class="rate-hint">How well did you know this?</p>
              <div class="rate-buttons">
                <button mat-raised-button class="rate-btn miss" (click)="rate('miss')">
                  <mat-icon>close</mat-icon> Missed It
                </button>
                <button mat-raised-button class="rate-btn hard" (click)="rate('hard')">
                  <mat-icon>sentiment_neutral</mat-icon> Hard
                </button>
                <button mat-raised-button class="rate-btn easy" (click)="rate('easy')">
                  <mat-icon>check</mat-icon> Got It
                </button>
              </div>
            </div>
          }

          <!-- Progress dots -->
          <div class="dots-row">
            @for (card of set()!.cards; track card.id; let i = $index) {
              <span class="dot"
                    [class.current]="i === currentIndex()"
                    [class.known]="ratings()[card.id] === 'easy'"
                    [class.hard]="ratings()[card.id] === 'hard'"
                    [class.missed]="ratings()[card.id] === 'miss'">
              </span>
            }
          </div>
        } @else {
          <!-- Finished screen -->
          <div class="finished-screen">
            <mat-icon class="done-icon">celebration</mat-icon>
            <h2>Set Complete! 🎉</h2>
            <p class="done-sub">You reviewed all {{ set()!.cards.length }} cards.</p>

            <div class="score-summary">
              <div class="score-item got-it">
                <mat-icon>check_circle</mat-icon>
                <span>{{ countRating('easy') }} Got It</span>
              </div>
              <div class="score-item hard-it">
                <mat-icon>sentiment_neutral</mat-icon>
                <span>{{ countRating('hard') }} Hard</span>
              </div>
              <div class="score-item missed-it">
                <mat-icon>cancel</mat-icon>
                <span>{{ countRating('miss') }} Missed</span>
              </div>
            </div>

            <div class="done-actions">
              <button mat-stroked-button (click)="restart()">
                <mat-icon>refresh</mat-icon> Study Again
              </button>
              <button mat-raised-button color="primary" routerLink="/student/flashcards">
                <mat-icon>arrow_back</mat-icon> Back to Sets
              </button>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .study-container { max-width: 640px; margin: 0 auto; padding: 24px 16px; }

    /* Header */
    .study-header { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
    .header-info { flex: 1; display: flex; flex-direction: column; gap: 6px;
      h3 { margin: 0; font-size: 1rem; font-weight: 600; color: #1a1a2e; }
    }
    .card-counter { font-size: 0.9rem; font-weight: 600; color: #6b7280; white-space: nowrap; }

    /* 3D card flip */
    .card-area {
      perspective: 1200px;
      height: 300px;
      cursor: pointer;
      outline: none;
      margin-bottom: 24px;
    }
    .flashcard {
      position: relative; width: 100%; height: 100%;
      transform-style: preserve-3d;
      transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      &.flipped { transform: rotateY(180deg); }
    }
    .card-face {
      position: absolute; inset: 0;
      backface-visibility: hidden;
      border-radius: 20px;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 32px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      text-align: center;
    }
    .card-front {
      background: white;
      border: 2px solid #e5e7eb;
    }
    .card-back {
      background: linear-gradient(135deg, #3730a3, #6366f1);
      color: white;
      transform: rotateY(180deg);
      .face-label { color: rgba(255,255,255,0.75); }
    }
    .face-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.1em; color: #9ca3af; margin-bottom: 16px; }
    .card-text { font-size: 1.2rem; font-weight: 600; line-height: 1.5; color: inherit; }

    .hint-row { display: flex; align-items: center; gap: 6px; margin-top: 16px;
      color: #f59e0b; font-size: 0.85rem;
      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }
    }
    .flip-hint { display: flex; align-items: center; gap: 6px; position: absolute; bottom: 16px;
      color: #9ca3af; font-size: 0.78rem;
      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }
    }

    /* Rating buttons */
    .rate-row { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-bottom: 20px; }
    .rate-hint { color: #6b7280; font-size: 0.9rem; margin: 0; }
    .rate-buttons { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
    .rate-btn {
      border-radius: 10px !important; padding: 10px 20px !important;
      display: flex; align-items: center; gap: 8px;
      &.miss  { background: #fee2e2 !important; color: #991b1b !important; }
      &.hard  { background: #fef3c7 !important; color: #92400e !important; }
      &.easy  { background: #d1fae5 !important; color: #065f46 !important; }
    }

    /* Dots */
    .dots-row { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
    .dot {
      width: 10px; height: 10px; border-radius: 50%; background: #e5e7eb;
      &.current { background: #6366f1; transform: scale(1.3); }
      &.known   { background: #10b981; }
      &.hard    { background: #f59e0b; }
      &.missed  { background: #ef4444; }
    }

    /* Finished */
    .finished-screen { display: flex; flex-direction: column; align-items: center; padding: 24px 0; text-align: center; }
    .done-icon { font-size: 4rem; width: 4rem; height: 4rem; color: #f59e0b; margin-bottom: 16px; }
    h2 { margin: 0 0 8px; font-size: 1.6rem; font-weight: 700; }
    .done-sub { color: #6b7280; margin: 0 0 28px; }

    .score-summary { display: flex; gap: 24px; margin-bottom: 32px; flex-wrap: wrap; justify-content: center; }
    .score-item { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 0.95rem;
      mat-icon { font-size: 1.5rem; width: 1.5rem; height: 1.5rem; }
      &.got-it   { color: #10b981; }
      &.hard-it  { color: #f59e0b; }
      &.missed-it{ color: #ef4444; }
    }

    .done-actions { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
  `],
})
export class FlashcardStudyComponent implements OnInit {
  set = signal<FlashcardSet | null>(null);
  loading = signal(true);
  currentIndex = signal(0);
  flipped = signal(false);
  finished = signal(false);
  ratings = signal<Record<number, 'easy' | 'hard' | 'miss'>>({});

  progressPercent = computed(() => {
    if (!this.set()) return 0;
    return ((this.currentIndex()) / this.set()!.cards.length) * 100;
  });

  currentCard = computed((): Flashcard | null => {
    return this.set()?.cards[this.currentIndex()] ?? null;
  });

  constructor(
    private route: ActivatedRoute,
    private flashcardService: FlashcardService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.flashcardService.getById(id).subscribe({
      next: (res) => {
        this.set.set(res.data ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  flip(): void {
    this.flipped.update((f) => !f);
  }

  rate(rating: 'easy' | 'hard' | 'miss'): void {
    const card = this.currentCard();
    if (!card) return;
    this.ratings.update((r) => ({ ...r, [card.id]: rating }));

    const nextIndex = this.currentIndex() + 1;
    if (nextIndex >= this.set()!.cards.length) {
      this.finished.set(true);
    } else {
      this.currentIndex.set(nextIndex);
      this.flipped.set(false);
    }
  }

  restart(): void {
    this.currentIndex.set(0);
    this.flipped.set(false);
    this.finished.set(false);
    this.ratings.set({});
  }

  countRating(type: 'easy' | 'hard' | 'miss'): number {
    return Object.values(this.ratings()).filter((r) => r === type).length;
  }
}
