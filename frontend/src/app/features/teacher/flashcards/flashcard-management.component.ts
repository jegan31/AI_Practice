import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FlashcardService } from '../../../core/services/flashcard.service';
import { NotificationService } from '../../../core/services/notification.service';
import { FlashcardSet } from '../../../core/models/flashcard.model';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-flashcard-management',
  standalone: true,
  imports: [
    RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatExpansionModule,
    MatPaginatorModule, MatDividerModule, MatTooltipModule,
    TimeAgoPipe, LoadingSpinnerComponent, EmptyStateComponent,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2 class="section-title">Flashcard Sets</h2>
          <p class="section-subtitle">Publish flashcard sets for students to study</p>
        </div>
      </div>

      @if (loading()) {
        <app-loading-spinner message="Loading flashcard sets..." />
      } @else if (sets().length === 0) {
        <app-empty-state
          icon="style"
          title="No flashcard sets yet"
          message="Flashcard sets are auto-generated when you process a PDF document.">
          <button mat-raised-button color="primary" routerLink="/teacher/documents/upload">
            <mat-icon>upload_file</mat-icon> Upload a Document
          </button>
        </app-empty-state>
      } @else {
        <mat-accordion class="sets-accordion">
          @for (set of sets(); track set.id) {
            <mat-expansion-panel class="set-panel">
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <mat-icon class="panel-icon">style</mat-icon>
                  {{ set.title }}
                </mat-panel-title>
                <mat-panel-description>
                  <span class="card-count">{{ set.cardCount }} cards</span>
                  <span [class]="set.isPublished ? 'chip-success' : 'chip-warning'" class="pub-chip">
                    {{ set.isPublished ? 'Published' : 'Draft' }}
                  </span>
                </mat-panel-description>
              </mat-expansion-panel-header>

              <div class="panel-body">
                <div class="panel-actions">
                  <button mat-stroked-button color="primary" (click)="togglePublish(set)">
                    <mat-icon>{{ set.isPublished ? 'unpublished' : 'publish' }}</mat-icon>
                    {{ set.isPublished ? 'Unpublish' : 'Publish to Students' }}
                  </button>
                </div>
                <mat-divider />
                <h4>Cards Preview</h4>
                <div class="cards-preview">
                  @for (card of set.cards.slice(0, 4); track card.id) {
                    <div class="card-preview">
                      <div class="card-front">
                        <span class="label">Front</span>
                        {{ card.front }}
                      </div>
                      <mat-icon class="arrow">arrow_forward</mat-icon>
                      <div class="card-back">
                        <span class="label">Back</span>
                        {{ card.back }}
                      </div>
                    </div>
                  }
                </div>
                @if (set.cardCount > 4) {
                  <p class="more-hint">… and {{ set.cardCount - 4 }} more cards</p>
                }
              </div>
            </mat-expansion-panel>
          }
        </mat-accordion>

        <mat-paginator
          [length]="totalSets()"
          [pageSize]="pageSize"
          [pageSizeOptions]="[5, 10]"
          (page)="onPage($event)"
          aria-label="Flashcard sets pagination">
        </mat-paginator>
      }
    </div>
  `,
  styles: [`
    .page-container { max-width: 900px; margin: 0 auto; padding: 24px 16px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
    .section-title { margin: 0 0 4px; font-size: 1.5rem; font-weight: 600; }
    .section-subtitle { margin: 0; color: #6b7280; font-size: 0.9rem; }

    .sets-accordion { display: flex; flex-direction: column; gap: 8px; }
    .set-panel { border-radius: 12px !important; }

    mat-panel-title { display: flex; align-items: center; gap: 10px; font-weight: 600; }
    mat-panel-description { display: flex; align-items: center; gap: 8px; }
    .panel-icon { color: #10b981; }
    .card-count { color: #6b7280; font-size: 0.85rem; }
    .pub-chip { font-size: 0.75rem !important; }

    .panel-body { padding: 8px 0; }
    .panel-actions { display: flex; gap: 8px; margin-bottom: 16px; }

    h4 { font-size: 0.95rem; font-weight: 600; color: #374151; margin: 16px 0 10px; }

    .cards-preview { display: flex; flex-direction: column; gap: 8px; }
    .card-preview {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px;
      background: #f9fafb;
      border-radius: 8px;
      .arrow { color: #9ca3af; }
    }
    .card-front, .card-back {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 0.875rem;
      color: #374151;
    }
    .label { font-size: 0.7rem; font-weight: 600; color: #9ca3af; text-transform: uppercase; }
    .more-hint { color: #9ca3af; font-size: 0.85rem; margin-top: 8px; }
  `],
})
export class FlashcardManagementComponent implements OnInit {
  sets = signal<FlashcardSet[]>([]);
  totalSets = signal(0);
  loading = signal(true);
  page = 1;
  pageSize = 10;

  constructor(
    private flashcardService: FlashcardService,
    private notify: NotificationService,
  ) {}

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

  togglePublish(set: FlashcardSet): void {
    this.flashcardService.togglePublish(set.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const updated = this.sets().map((s) =>
            s.id === set.id ? { ...s, isPublished: res.data!.isPublished } : s
          );
          this.sets.set(updated);
          this.notify.success(res.message);
        }
      },
      error: () => this.notify.error('Failed to update flashcard set'),
    });
  }
}
