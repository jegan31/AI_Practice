import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FlashcardService } from '../../../core/services/flashcard.service';
import { FlashcardSet } from '../../../core/models/flashcard.model';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-flashcard-list',
  standalone: true,
  imports: [
    RouterLink, MatCardModule, MatButtonModule, MatIconModule,
    MatPaginatorModule, TimeAgoPipe, LoadingSpinnerComponent, EmptyStateComponent,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2 class="section-title">Flashcard Sets</h2>
        <p class="section-subtitle">Memorise key concepts with interactive flashcards</p>
      </div>

      @if (loading()) {
        <app-loading-spinner message="Loading flashcard sets..." />
      } @else if (sets().length === 0) {
        <app-empty-state
          icon="style"
          title="No flashcard sets available"
          message="Your teacher hasn't published any flashcard sets yet. Check back soon!" />
      } @else {
        <div class="sets-grid">
          @for (set of sets(); track set.id) {
            <mat-card class="set-card">
              <mat-card-content>
                <mat-icon class="set-icon">style</mat-icon>
                <h3 class="set-title">{{ set.title }}</h3>
                @if (set.description) {
                  <p class="set-desc">{{ set.description }}</p>
                }
                <div class="set-meta">
                  <span><mat-icon>layers</mat-icon> {{ set.cardCount }} cards</span>
                  <span>{{ set.createdAt | timeAgo }}</span>
                </div>
              </mat-card-content>
              <mat-card-actions>
                <button mat-raised-button color="primary"
                        [routerLink]="['/student/flashcards', set.id, 'study']">
                  <mat-icon>play_arrow</mat-icon> Study Now
                </button>
              </mat-card-actions>
            </mat-card>
          }
        </div>

        <mat-paginator
          [length]="totalSets()"
          [pageSize]="pageSize"
          [pageSizeOptions]="[6, 12]"
          (page)="onPage($event)"
          aria-label="Flashcard sets pagination">
        </mat-paginator>
      }
    </div>
  `,
  styles: [`
    .page-container { max-width: 1000px; margin: 0 auto; padding: 24px 16px; }
    .page-header { margin-bottom: 24px; }
    .section-title { margin: 0 0 4px; font-size: 1.5rem; font-weight: 600; }
    .section-subtitle { margin: 0; color: #6b7280; font-size: 0.9rem; }

    .sets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }
    .set-card {
      border-radius: 14px !important;
      border-top: 4px solid #10b981;
      transition: transform 0.15s, box-shadow 0.15s;
      &:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important; }
      mat-card-content { padding: 20px !important; }
      mat-card-actions { padding: 0 16px 16px !important; }
    }
    .set-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; color: #10b981; margin-bottom: 12px; }
    .set-title { font-size: 1rem; font-weight: 600; color: #1a1a2e; margin: 0 0 8px; }
    .set-desc { color: #6b7280; font-size: 0.85rem; margin: 0 0 12px;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .set-meta { display: flex; justify-content: space-between; color: #9ca3af; font-size: 0.8rem;
      span { display: flex; align-items: center; gap: 4px; }
      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }
    }
  `],
})
export class FlashcardListComponent implements OnInit {
  sets = signal<FlashcardSet[]>([]);
  totalSets = signal(0);
  loading = signal(true);
  page = 1;
  pageSize = 6;

  constructor(private flashcardService: FlashcardService) {}

  ngOnInit(): void {
    this.loadSets();
  }

  loadSets(): void {
    this.loading.set(true);
    this.flashcardService.getAll(this.page, this.pageSize).subscribe({
      next: (res) => {
        this.sets.set(res.data);
        this.totalSets.set(res.pagination.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPage(e: PageEvent): void {
    this.page = e.pageIndex + 1;
    this.pageSize = e.pageSize;
    this.loadSets();
  }
}
