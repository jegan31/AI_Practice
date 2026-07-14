import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { DocumentService } from '../../../core/services/document.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Document } from '../../../core/models/document.model';
import { FileSizePipe } from '../../../shared/pipes/file-size.pipe';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [
    RouterLink, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatTableModule,
    MatPaginatorModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatTooltipModule, MatDialogModule, MatChipsModule,
    FileSizePipe, TimeAgoPipe, LoadingSpinnerComponent, EmptyStateComponent,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2 class="section-title">Documents</h2>
          <p class="section-subtitle">Manage uploaded PDFs and their AI-generated content</p>
        </div>
        <button mat-raised-button color="primary" routerLink="/teacher/documents/upload">
          <mat-icon>upload_file</mat-icon> Upload PDF
        </button>
      </div>

      <!-- Filters -->
      <mat-card class="filter-card">
        <mat-card-content>
          <div class="filters">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Filter by subject</mat-label>
              <input matInput [(ngModel)]="subjectFilter" (ngModelChange)="onFilterChange()"
                     placeholder="e.g. Mathematics">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>
            <button mat-stroked-button (click)="clearFilter()" *ngIf="subjectFilter">
              <mat-icon>clear</mat-icon> Clear
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      @if (loading()) {
        <app-loading-spinner message="Loading documents..." />
      } @else if (documents().length === 0) {
        <app-empty-state
          icon="folder_open"
          title="No documents yet"
          message="Upload your first PDF to get started with AI-powered content generation.">
          <button mat-raised-button color="primary" routerLink="/teacher/documents/upload">
            <mat-icon>upload_file</mat-icon> Upload PDF
          </button>
        </app-empty-state>
      } @else {
        <mat-card class="table-card">
          <table mat-table [dataSource]="documents()" class="full-width">

            <!-- Title column -->
            <ng-container matColumnDef="title">
              <th mat-header-cell *matHeaderCellDef>Document</th>
              <td mat-cell *matCellDef="let doc">
                <div class="doc-cell">
                  <mat-icon class="pdf-icon">picture_as_pdf</mat-icon>
                  <div>
                    <span class="doc-title">{{ doc.title }}</span>
                    <span class="doc-meta">{{ doc.pageCount || '?' }} pages · {{ doc.fileSize | fileSize }}</span>
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- Subject column -->
            <ng-container matColumnDef="subject">
              <th mat-header-cell *matHeaderCellDef>Subject</th>
              <td mat-cell *matCellDef="let doc">
                {{ doc.subject || '—' }}
              </td>
            </ng-container>

            <!-- Grade column -->
            <ng-container matColumnDef="grade">
              <th mat-header-cell *matHeaderCellDef>Grade</th>
              <td mat-cell *matCellDef="let doc">{{ doc.gradeLevel || '—' }}</td>
            </ng-container>

            <!-- AI status column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>AI Status</th>
              <td mat-cell *matCellDef="let doc">
                <span [class]="getStatusClass(doc.aiProcessingStatus)">
                  {{ doc.aiProcessingStatus | titlecase }}
                </span>
              </td>
            </ng-container>

            <!-- Date column -->
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Uploaded</th>
              <td mat-cell *matCellDef="let doc">{{ doc.createdAt | timeAgo }}</td>
            </ng-container>

            <!-- Actions column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let doc">
                <button mat-icon-button color="primary"
                        [routerLink]="['/teacher/documents', doc.id]"
                        matTooltip="View document">
                  <mat-icon>visibility</mat-icon>
                </button>
                <button mat-icon-button color="warn"
                        (click)="deleteDocument(doc)" matTooltip="Delete">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <mat-paginator
            [length]="totalDocs()"
            [pageSize]="pageSize"
            [pageSizeOptions]="[5, 10, 25]"
            (page)="onPage($event)"
            aria-label="Documents pagination">
          </mat-paginator>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .page-container { max-width: 1100px; margin: 0 auto; padding: 24px 16px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
    .section-title { margin: 0 0 4px; font-size: 1.5rem; font-weight: 600; }
    .section-subtitle { margin: 0; color: #6b7280; font-size: 0.9rem; }

    .filter-card { margin-bottom: 16px; border-radius: 12px !important;
      mat-card-content { padding: 16px !important; } }
    .filters { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .search-field { flex: 1; min-width: 200px; }

    .table-card { border-radius: 12px !important; overflow: hidden; }
    .full-width { width: 100%; }

    .doc-cell { display: flex; align-items: center; gap: 10px; padding: 4px 0; }
    .pdf-icon { color: #ef4444; }
    .doc-title { display: block; font-weight: 500; color: #1a1a2e; }
    .doc-meta { display: block; font-size: 0.78rem; color: #9ca3af; }

    th { font-weight: 600; color: #374151; }
  `],
})
export class DocumentListComponent implements OnInit {
  documents = signal<Document[]>([]);
  totalDocs = signal(0);
  loading = signal(true);
  subjectFilter = '';
  page = 1;
  pageSize = 10;

  displayedColumns = ['title', 'subject', 'grade', 'status', 'date', 'actions'];

  constructor(
    private docService: DocumentService,
    private notify: NotificationService,
  ) {}

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

  onPage(e: PageEvent): void {
    this.page = e.pageIndex + 1;
    this.pageSize = e.pageSize;
    this.loadDocuments();
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadDocuments();
  }

  clearFilter(): void {
    this.subjectFilter = '';
    this.loadDocuments();
  }

  deleteDocument(doc: Document): void {
    if (!confirm(`Delete "${doc.title}"? This will also remove all associated quizzes and flashcards.`)) return;
    this.docService.delete(doc.id).subscribe({
      next: () => {
        this.notify.success('Document deleted');
        this.loadDocuments();
      },
      error: () => this.notify.error('Failed to delete document'),
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      completed: 'chip-success',
      processing: 'chip-warning',
      pending: 'chip-info',
      failed: 'chip-error',
    };
    return map[status] ?? 'chip-info';
  }
}
