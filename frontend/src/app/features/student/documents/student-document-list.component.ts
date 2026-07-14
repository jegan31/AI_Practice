import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { DocumentService } from '../../../core/services/document.service';
import { Document } from '../../../core/models/document.model';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-student-document-list',
  standalone: true,
  imports: [
    RouterLink, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatPaginatorModule,
    TimeAgoPipe, LoadingSpinnerComponent, EmptyStateComponent,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2 class="section-title">Study Materials</h2>
        <p class="section-subtitle">Documents shared by your teacher</p>
      </div>

      <!-- Search -->
      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Search by subject</mat-label>
        <input matInput [(ngModel)]="subjectFilter" (ngModelChange)="onSearch()"
               placeholder="e.g. Mathematics">
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>

      @if (loading()) {
        <app-loading-spinner message="Loading documents..." />
      } @else if (documents().length === 0) {
        <app-empty-state
          icon="menu_book"
          title="No documents available"
          message="Your teacher hasn't shared any documents yet. Check back soon!" />
      } @else {
        <div class="doc-grid">
          @for (doc of documents(); track doc.id) {
            <mat-card class="doc-card" [routerLink]="['/student/documents', doc.id]">
              <mat-card-content>
                <div class="doc-icon-row">
                  <mat-icon class="pdf-icon">picture_as_pdf</mat-icon>
                  @if (doc.aiProcessed) {
                    <span class="chip-success ai-badge">AI Ready</span>
                  }
                </div>
                <h3 class="doc-title">{{ doc.title }}</h3>
                <p class="doc-subject">{{ doc.subject || 'General' }}</p>
                <p class="doc-desc">{{ doc.description || 'No description provided.' }}</p>
                <div class="doc-footer">
                  <span class="doc-meta">{{ doc.pageCount || '?' }} pages</span>
                  <span class="doc-meta">{{ doc.createdAt | timeAgo }}</span>
                </div>
              </mat-card-content>
              <mat-card-actions>
                <button mat-button color="primary">
                  <mat-icon>open_in_new</mat-icon> Open
                </button>
              </mat-card-actions>
            </mat-card>
          }
        </div>

        <mat-paginator
          [length]="totalDocs()"
          [pageSize]="pageSize"
          [pageSizeOptions]="[6, 12, 24]"
          (page)="onPage($event)"
          aria-label="Documents pagination">
        </mat-paginator>
      }
    </div>
  `,
  styles: [`
    .page-container { max-width: 1100px; margin: 0 auto; padding: 24px 16px; }
    .page-header { margin-bottom: 20px; }
    .section-title { margin: 0 0 4px; font-size: 1.5rem; font-weight: 600; }
    .section-subtitle { margin: 0; color: #6b7280; font-size: 0.9rem; }

    .search-field { width: 100%; max-width: 400px; margin-bottom: 20px; }

    .doc-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }

    .doc-card {
      border-radius: 14px !important;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
      &:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important; }
      mat-card-content { padding: 20px 20px 8px !important; }
      mat-card-actions { padding: 0 12px 12px !important; }
    }

    .doc-icon-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .pdf-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; color: #ef4444; }
    .ai-badge { font-size: 0.72rem !important; }

    .doc-title { font-size: 1rem; font-weight: 600; color: #1a1a2e; margin: 0 0 4px; }
    .doc-subject { color: #6366f1; font-size: 0.8rem; font-weight: 500; margin: 0 0 8px; }
    .doc-desc { color: #6b7280; font-size: 0.85rem; margin: 0 0 12px; line-height: 1.5;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

    .doc-footer { display: flex; justify-content: space-between; }
    .doc-meta { font-size: 0.75rem; color: #9ca3af; }
  `],
})
export class StudentDocumentListComponent implements OnInit {
  documents = signal<Document[]>([]);
  totalDocs = signal(0);
  loading = signal(true);
  subjectFilter = '';
  page = 1;
  pageSize = 6;

  constructor(private docService: DocumentService) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.loading.set(true);
    this.docService.getAll(this.page, this.pageSize, this.subjectFilter || undefined).subscribe({
      next: (res) => {
        this.documents.set(res.data);
        this.totalDocs.set(res.pagination.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(): void {
    this.page = 1;
    this.loadDocuments();
  }

  onPage(e: PageEvent): void {
    this.page = e.pageIndex + 1;
    this.pageSize = e.pageSize;
    this.loadDocuments();
  }
}
