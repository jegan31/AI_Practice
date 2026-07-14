import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { DocumentService } from '../../../core/services/document.service';
import { NotificationService } from '../../../core/services/notification.service';
import { FileSizePipe } from '../../../shared/pipes/file-size.pipe';

const SUBJECTS = [
  'Mathematics', 'Science', 'English', 'History', 'Geography',
  'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Art', 'Other',
];

const GRADE_LEVELS = [
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
  'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
  'University', 'Other',
];

@Component({
  selector: 'app-document-upload',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressBarModule, MatDividerModule,
    FileSizePipe,
  ],
  template: `
    <div class="page-container">
      <!-- Breadcrumb -->
      <div class="breadcrumb">
        <a routerLink="/teacher/documents">Documents</a>
        <mat-icon>chevron_right</mat-icon>
        <span>Upload</span>
      </div>

      <mat-card class="upload-card">
        <mat-card-header>
          <mat-icon mat-card-avatar class="header-icon">upload_file</mat-icon>
          <mat-card-title>Upload Document</mat-card-title>
          <mat-card-subtitle>Upload a PDF — AI will generate a summary, quiz, and flashcards automatically</mat-card-subtitle>
        </mat-card-header>
        <mat-divider />

        <mat-card-content>
          <!-- Drop zone -->
          <div class="drop-zone"
               [class.has-file]="selectedFile()"
               [class.drag-over]="isDragOver()"
               (click)="fileInput.click()"
               (dragover)="onDragOver($event)"
               (dragleave)="isDragOver.set(false)"
               (drop)="onDrop($event)"
               role="button" tabindex="0"
               (keyup.enter)="fileInput.click()"
               aria-label="Click or drag to upload PDF">
            <input #fileInput type="file" accept=".pdf" hidden (change)="onFileSelected($event)">

            @if (selectedFile()) {
              <div class="file-preview">
                <mat-icon class="pdf-icon">picture_as_pdf</mat-icon>
                <div>
                  <p class="file-name">{{ selectedFile()!.name }}</p>
                  <p class="file-size">{{ selectedFile()!.size | fileSize }}</p>
                </div>
                <button mat-icon-button color="warn" (click)="clearFile($event)"
                        aria-label="Remove file">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            } @else {
              <mat-icon class="upload-icon">cloud_upload</mat-icon>
              <p class="drop-hint">Drag & drop a PDF here, or <span class="link">click to browse</span></p>
              <p class="drop-sub">Maximum file size: 16 MB</p>
            }
          </div>

          <!-- Metadata form -->
          <form [formGroup]="form" class="meta-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Document Title</mat-label>
              <input matInput formControlName="title" placeholder="e.g. Chapter 5: Newton's Laws">
              <mat-icon matPrefix>title</mat-icon>
              @if (form.get('title')?.hasError('required') && form.get('title')?.touched) {
                <mat-error>Title is required</mat-error>
              }
            </mat-form-field>

            <div class="two-col">
              <mat-form-field appearance="outline">
                <mat-label>Subject</mat-label>
                <mat-select formControlName="subject">
                  @for (s of subjects; track s) {
                    <mat-option [value]="s">{{ s }}</mat-option>
                  }
                </mat-select>
                <mat-icon matPrefix>subject</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Grade Level</mat-label>
                <mat-select formControlName="gradeLevel">
                  @for (g of gradeLevels; track g) {
                    <mat-option [value]="g">{{ g }}</mat-option>
                  }
                </mat-select>
                <mat-icon matPrefix>school</mat-icon>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description (optional)</mat-label>
              <textarea matInput formControlName="description" rows="3"
                        placeholder="Brief description of this document's content"></textarea>
              <mat-icon matPrefix>description</mat-icon>
            </mat-form-field>
          </form>

          @if (uploading()) {
            <div class="upload-progress">
              <p>Uploading and extracting text...</p>
              <mat-progress-bar mode="indeterminate" color="primary" />
            </div>
          }
        </mat-card-content>

        <mat-divider />
        <mat-card-actions align="end">
          <button mat-button routerLink="/teacher/documents">Cancel</button>
          <button mat-raised-button color="primary"
                  [disabled]="!selectedFile() || form.invalid || uploading()"
                  (click)="onUpload()">
            <mat-icon>upload</mat-icon>
            {{ uploading() ? 'Uploading…' : 'Upload & Process' }}
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { max-width: 760px; margin: 0 auto; padding: 24px 16px; }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #6b7280;
      font-size: 0.9rem;
      margin-bottom: 20px;
      a { color: #6366f1; text-decoration: none; &:hover { text-decoration: underline; } }
      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }
    }

    .upload-card {
      border-radius: 16px !important;
      mat-card-header { padding: 20px 20px 16px; }
      mat-card-content { padding: 20px !important; }
      mat-card-actions { padding: 12px 20px !important; gap: 8px; }
      .header-icon { background: #eef2ff; color: #6366f1; border-radius: 8px; padding: 6px; }
    }

    .drop-zone {
      border: 2px dashed #d1d5db;
      border-radius: 12px;
      padding: 40px 24px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 24px;
      &:hover, &.drag-over {
        border-color: #6366f1;
        background: #eef2ff;
      }
      &.has-file { border-style: solid; border-color: #10b981; background: #f0fdf4; }
    }

    .upload-icon { font-size: 3.5rem; width: 3.5rem; height: 3.5rem; color: #d1d5db; }
    .drop-hint { color: #374151; font-size: 1rem; margin: 8px 0 4px; }
    .drop-sub { color: #9ca3af; font-size: 0.85rem; margin: 0; }
    .link { color: #6366f1; text-decoration: underline; }

    .file-preview {
      display: flex;
      align-items: center;
      gap: 16px;
      justify-content: center;
      .pdf-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; color: #ef4444; }
      .file-name { font-weight: 600; color: #1a1a2e; margin: 0; }
      .file-size { color: #6b7280; font-size: 0.85rem; margin: 0; }
    }

    .meta-form { display: flex; flex-direction: column; gap: 4px; }
    .full-width { width: 100%; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
      mat-form-field { width: 100%; }
    }

    .upload-progress {
      margin-top: 16px;
      p { color: #6b7280; margin-bottom: 8px; font-size: 0.9rem; }
    }
  `],
})
export class DocumentUploadComponent {
  form: FormGroup;
  selectedFile = signal<File | null>(null);
  uploading = signal(false);
  isDragOver = signal(false);

  subjects = SUBJECTS;
  gradeLevels = GRADE_LEVELS;

  constructor(
    private fb: FormBuilder,
    private docService: DocumentService,
    private notify: NotificationService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      subject: [''],
      gradeLevel: [''],
      description: [''],
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.setFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    const file = event.dataTransfer?.files[0];
    if (file && file.type === 'application/pdf') {
      this.setFile(file);
    } else {
      this.notify.error('Only PDF files are accepted.');
    }
  }

  clearFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile.set(null);
  }

  private setFile(file: File): void {
    if (file.size > 16 * 1024 * 1024) {
      this.notify.error('File is too large. Maximum size is 16 MB.');
      return;
    }
    this.selectedFile.set(file);
    // Pre-fill title from filename
    if (!this.form.get('title')?.value) {
      this.form.patchValue({ title: file.name.replace(/\.pdf$/i, '') });
    }
  }

  onUpload(): void {
    if (!this.selectedFile() || this.form.invalid) return;

    this.uploading.set(true);
    this.docService.upload({
      file: this.selectedFile()!,
      ...this.form.value,
    }).subscribe({
      next: (res) => {
        this.uploading.set(false);
        if (res.success && res.data) {
          this.notify.success('Document uploaded! AI processing will begin shortly.');
          this.router.navigate(['/teacher/documents', res.data.id]);
        }
      },
      error: (err) => {
        this.uploading.set(false);
        this.notify.error(err?.error?.error ?? 'Upload failed. Please try again.');
      },
    });
  }
}
