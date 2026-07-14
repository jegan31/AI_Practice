import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule } from '@angular/material/list';
import { DocumentService } from '../../../core/services/document.service';
import { AiService } from '../../../core/services/ai.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Document, DocumentSummary } from '../../../core/models/document.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { FileSizePipe } from '../../../shared/pipes/file-size.pipe';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-document-detail',
  standalone: true,
  imports: [
    RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatTabsModule,
    MatChipsModule, MatDividerModule, MatProgressBarModule, MatListModule,
    LoadingSpinnerComponent, FileSizePipe, TimeAgoPipe,
  ],
  template: `
    <div class="page-container">
      <!-- Breadcrumb -->
      <div class="breadcrumb">
        <a routerLink="/teacher/documents">Documents</a>
        <mat-icon>chevron_right</mat-icon>
        <span>{{ doc()?.title }}</span>
      </div>

      @if (loading()) {
        <app-loading-spinner message="Loading document..." />
      } @else if (doc()) {
        <!-- Document header card -->
        <mat-card class="doc-header-card">
          <mat-card-content>
            <div class="doc-header">
              <mat-icon class="pdf-icon-lg">picture_as_pdf</mat-icon>
              <div class="doc-header-info">
                <h2>{{ doc()!.title }}</h2>
                <div class="doc-meta-row">
                  <span>{{ doc()!.subject || 'No subject' }}</span>
                  <span>·</span>
                  <span>{{ doc()!.gradeLevel || 'No grade' }}</span>
                  <span>·</span>
                  <span>{{ doc()!.pageCount }} pages</span>
                  <span>·</span>
                  <span>{{ doc()!.fileSize | fileSize }}</span>
                  <span>·</span>
                  <span>{{ doc()!.createdAt | timeAgo }}</span>
                </div>
                @if (doc()!.description) {
                  <p class="doc-description">{{ doc()!.description }}</p>
                }
              </div>
              <div class="doc-status">
                <span [class]="getStatusClass(doc()!.aiProcessingStatus)">
                  {{ doc()!.aiProcessingStatus | titlecase }}
                </span>
              </div>
            </div>

            <!-- AI Process button -->
            @if (!doc()!.aiProcessed) {
              <div class="process-banner">
                <mat-icon>auto_awesome</mat-icon>
                <span>Run AI processing to generate a summary, quiz, and flashcards from this document.</span>
                <button mat-raised-button color="primary"
                        [disabled]="processing()"
                        (click)="processDocument()">
                  @if (processing()) {
                    Processing…
                  } @else {
                    <mat-icon>play_arrow</mat-icon> Run AI Processing
                  }
                </button>
              </div>
              @if (processing()) {
                <mat-progress-bar mode="indeterminate" color="primary" />
              }
            }
          </mat-card-content>
        </mat-card>

        <!-- Tabs -->
        <mat-tab-group animationDuration="200ms" class="doc-tabs">

          <!-- Summary tab -->
          <mat-tab label="Summary">
            <div class="tab-content">
              @if (summary()) {
                <div class="summary-section">
                  <h3>Overview</h3>
                  <p>{{ summary()!.overview }}</p>

                  <h3>Key Topics</h3>
                  <div class="chip-list">
                    @for (topic of summary()!.keyTopics; track topic) {
                      <span class="chip-info tag-chip">{{ topic }}</span>
                    }
                  </div>

                  <h3>Main Concepts</h3>
                  <mat-list>
                    @for (concept of summary()!.mainConcepts; track concept.concept) {
                      <mat-list-item>
                        <mat-icon matListItemIcon>lightbulb</mat-icon>
                        <div matListItemTitle>{{ concept.concept }}</div>
                        <div matListItemLine>{{ concept.explanation }}</div>
                      </mat-list-item>
                    }
                  </mat-list>

                  <h3>Learning Objectives</h3>
                  <ul class="objectives-list">
                    @for (obj of summary()!.learningObjectives; track obj) {
                      <li>{{ obj }}</li>
                    }
                  </ul>

                  <p class="reading-time">
                    <mat-icon>schedule</mat-icon>
                    Estimated reading time: {{ summary()!.estimatedReadingTimeMinutes }} minutes
                  </p>
                </div>
              } @else {
                <div class="no-content">
                  <mat-icon>summarize</mat-icon>
                  <p>No summary available. Run AI processing first.</p>
                </div>
              }
            </div>
          </mat-tab>

          <!-- Info tab -->
          <mat-tab label="Document Info">
            <div class="tab-content">
              <div class="info-grid">
                <div class="info-row"><span>Original Filename</span><strong>{{ doc()!.originalFilename }}</strong></div>
                <div class="info-row"><span>Subject</span><strong>{{ doc()!.subject || '—' }}</strong></div>
                <div class="info-row"><span>Grade Level</span><strong>{{ doc()!.gradeLevel || '—' }}</strong></div>
                <div class="info-row"><span>Page Count</span><strong>{{ doc()!.pageCount || '—' }}</strong></div>
                <div class="info-row"><span>File Size</span><strong>{{ doc()!.fileSize | fileSize }}</strong></div>
                <div class="info-row"><span>AI Processed</span><strong>{{ doc()!.aiProcessed ? 'Yes' : 'No' }}</strong></div>
                <div class="info-row"><span>Uploaded</span><strong>{{ doc()!.createdAt | timeAgo }}</strong></div>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    .page-container { max-width: 900px; margin: 0 auto; padding: 24px 16px; }

    .breadcrumb { display: flex; align-items: center; gap: 4px; color: #6b7280; font-size: 0.9rem; margin-bottom: 20px;
      a { color: #6366f1; text-decoration: none; }
      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }
    }

    .doc-header-card { border-radius: 16px !important; margin-bottom: 20px;
      mat-card-content { padding: 24px !important; }
    }
    .doc-header { display: flex; align-items: flex-start; gap: 20px; flex-wrap: wrap; }
    .pdf-icon-lg { font-size: 3rem; width: 3rem; height: 3rem; color: #ef4444; margin-top: 4px; }
    .doc-header-info { flex: 1;
      h2 { margin: 0 0 8px; font-size: 1.4rem; font-weight: 700; }
    }
    .doc-meta-row { display: flex; flex-wrap: wrap; gap: 6px; color: #6b7280; font-size: 0.85rem; margin-bottom: 8px; }
    .doc-description { color: #6b7280; margin: 8px 0 0; font-size: 0.9rem; }

    .process-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #eef2ff;
      border-radius: 10px;
      padding: 16px;
      margin-top: 20px;
      flex-wrap: wrap;
      mat-icon { color: #6366f1; }
      span { flex: 1; color: #374151; font-size: 0.9rem; }
    }

    .doc-tabs { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .tab-content { padding: 24px; }

    .summary-section { h3 { font-size: 1.05rem; font-weight: 600; color: #374151; margin: 20px 0 10px; } }
    .chip-list { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
    .tag-chip { font-size: 0.8rem; }

    .objectives-list { padding-left: 20px; li { margin-bottom: 6px; color: #374151; line-height: 1.6; } }

    .reading-time { display: flex; align-items: center; gap: 6px; color: #6b7280;
      font-size: 0.9rem; margin-top: 20px;
      mat-icon { font-size: 1.1rem; width: 1.1rem; height: 1.1rem; }
    }

    .no-content { display: flex; flex-direction: column; align-items: center; padding: 48px;
      color: #9ca3af; gap: 12px;
      mat-icon { font-size: 3rem; width: 3rem; height: 3rem; }
    }

    .info-grid { display: flex; flex-direction: column; gap: 0; }
    .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f3f4f6;
      span { color: #6b7280; }
      strong { color: #1a1a2e; }
    }
  `],
})
export class DocumentDetailComponent implements OnInit {
  doc = signal<Document | null>(null);
  summary = signal<DocumentSummary | null>(null);
  loading = signal(true);
  processing = signal(false);

  constructor(
    private route: ActivatedRoute,
    private docService: DocumentService,
    private aiService: AiService,
    private notify: NotificationService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.docService.getById(id).subscribe({
      next: (res) => {
        this.doc.set(res.data ?? null);
        this.loading.set(false);
        if (res.data?.aiProcessed) this.loadSummary(id);
      },
      error: () => this.loading.set(false),
    });
  }

  loadSummary(id: number): void {
    this.aiService.getSummary(id).subscribe({
      next: (res) => this.summary.set(res.data ?? null),
    });
  }

  processDocument(): void {
    const id = this.doc()!.id;
    this.processing.set(true);
    this.aiService.processDocument(id).subscribe({
      next: (res) => {
        this.processing.set(false);
        if (res.success) {
          this.notify.success('AI processing complete! Quiz and flashcards generated.');
          // Reload document
          this.docService.getById(id).subscribe((r) => {
            this.doc.set(r.data ?? null);
            if (r.data?.aiProcessed) this.loadSummary(id);
          });
        }
      },
      error: (err) => {
        this.processing.set(false);
        this.notify.error(err?.error?.error ?? 'AI processing failed.');
      },
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      completed: 'chip-success', processing: 'chip-warning',
      pending: 'chip-info', failed: 'chip-error',
    };
    return map[status] ?? 'chip-info';
  }
}
