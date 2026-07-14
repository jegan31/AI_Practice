import { Component, OnInit, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { environment } from '../../../../environments/environment';
import { User } from '../../../core/models/user.model';
import { PaginatedResponse } from '../../../core/models/api.model';
import { NotificationService } from '../../../core/services/notification.service';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatPaginatorModule, MatTooltipModule, MatChipsModule,
    TimeAgoPipe, LoadingSpinnerComponent, EmptyStateComponent,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2 class="section-title">Students</h2>
          <p class="section-subtitle">Manage student accounts and their status</p>
        </div>
      </div>

      @if (loading()) {
        <app-loading-spinner message="Loading students..." />
      } @else if (students().length === 0) {
        <app-empty-state
          icon="people"
          title="No students yet"
          message="Students will appear here once they register on the platform." />
      } @else {
        <mat-card class="table-card">
          <table mat-table [dataSource]="students()" class="full-width">

            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Student</th>
              <td mat-cell *matCellDef="let student">
                <div class="student-cell">
                  <div class="avatar">{{ getInitials(student) }}</div>
                  <div>
                    <span class="student-name">{{ student.fullName }}</span>
                    <span class="student-email">{{ student.email }}</span>
                  </div>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="joined">
              <th mat-header-cell *matHeaderCellDef>Joined</th>
              <td mat-cell *matCellDef="let student">{{ student.createdAt | timeAgo }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let student">
                <span [class]="student.isActive ? 'chip-success' : 'chip-error'">
                  {{ student.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let student">
                <button mat-icon-button
                        [color]="student.isActive ? 'warn' : 'primary'"
                        (click)="toggleStatus(student)"
                        [matTooltip]="student.isActive ? 'Deactivate' : 'Activate'">
                  <mat-icon>{{ student.isActive ? 'block' : 'check_circle' }}</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <mat-paginator
            [length]="totalStudents()"
            [pageSize]="pageSize"
            [pageSizeOptions]="[10, 25, 50]"
            (page)="onPage($event)"
            aria-label="Students pagination">
          </mat-paginator>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .page-container { max-width: 900px; margin: 0 auto; padding: 24px 16px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
    .section-title { margin: 0 0 4px; font-size: 1.5rem; font-weight: 600; }
    .section-subtitle { margin: 0; color: #6b7280; font-size: 0.9rem; }

    .table-card { border-radius: 12px !important; overflow: hidden; }
    .full-width { width: 100%; }

    .student-cell { display: flex; align-items: center; gap: 12px; padding: 6px 0; }
    .avatar {
      width: 38px; height: 38px; border-radius: 50%;
      background: #eef2ff; color: #6366f1;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.85rem;
    }
    .student-name { display: block; font-weight: 500; color: #1a1a2e; }
    .student-email { display: block; font-size: 0.78rem; color: #9ca3af; }
    th { font-weight: 600; color: #374151; }
  `],
})
export class StudentListComponent implements OnInit {
  students = signal<User[]>([]);
  totalStudents = signal(0);
  loading = signal(true);
  page = 1;
  pageSize = 10;
  displayedColumns = ['name', 'joined', 'status', 'actions'];

  constructor(
    private http: HttpClient,
    private notify: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(): void {
    this.loading.set(true);
    const params = new HttpParams()
      .set('role', 'student')
      .set('page', this.page)
      .set('perPage', this.pageSize);

    this.http.get<PaginatedResponse<User>>(`${environment.apiUrl}/users`, { params }).subscribe({
      next: (res) => {
        this.students.set(res.data);
        this.totalStudents.set(res.pagination.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPage(e: PageEvent): void {
    this.page = e.pageIndex + 1;
    this.pageSize = e.pageSize;
    this.loadStudents();
  }

  toggleStatus(student: User): void {
    this.http.put<{ success: boolean; data: User }>(
      `${environment.apiUrl}/users/${student.id}`,
      { isActive: !student.isActive }
    ).subscribe({
      next: () => {
        const updated = this.students().map((s) =>
          s.id === student.id ? { ...s, isActive: !s.isActive } : s
        );
        this.students.set(updated);
        this.notify.success(`Student ${student.isActive ? 'deactivated' : 'activated'}`);
      },
      error: () => this.notify.error('Failed to update student status'),
    });
  }

  getInitials(user: User): string {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
}
