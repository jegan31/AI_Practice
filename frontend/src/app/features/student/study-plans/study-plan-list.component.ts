import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { StudyPlanService } from '../../../core/services/study-plan.service';
import { NotificationService } from '../../../core/services/notification.service';
import { StudyPlan } from '../../../core/models/study-plan.model';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-study-plan-list',
  standalone: true,
  imports: [
    RouterLink, MatCardModule, MatButtonModule, MatIconModule,
    TimeAgoPipe, LoadingSpinnerComponent, EmptyStateComponent,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2 class="section-title">My Study Plans</h2>
        <p class="section-subtitle">Your personalised AI-generated study schedules</p>
      </div>

      @if (loading()) {
        <app-loading-spinner message="Loading study plans..." />
      } @else if (plans().length === 0) {
        <app-empty-state
          icon="event_note"
          title="No study plans yet"
          message="Open a document and use the Study Plan tab to generate a personalised schedule.">
          <button mat-raised-button color="primary" routerLink="/student/documents">
            <mat-icon>menu_book</mat-icon> Browse Documents
          </button>
        </app-empty-state>
      } @else {
        <div class="plans-grid">
          @for (plan of plans(); track plan.id) {
            <mat-card class="plan-card">
              <mat-card-content>
                <div class="plan-header">
                  <mat-icon class="plan-icon">event_note</mat-icon>
                  <span class="duration-badge">{{ plan.durationDays }} days</span>
                </div>
                <h3 class="plan-title">{{ plan.title }}</h3>
                @if (plan.goal) {
                  <p class="plan-goal"><mat-icon>flag</mat-icon> {{ plan.goal }}</p>
                }
                <p class="plan-meta">Created {{ plan.createdAt | timeAgo }}</p>
              </mat-card-content>
              <mat-card-actions>
                <button mat-button color="primary"
                        [routerLink]="['/student/study-plans', plan.id]">
                  <mat-icon>visibility</mat-icon> View Plan
                </button>
                <button mat-button color="warn" (click)="deletePlan(plan)">
                  <mat-icon>delete</mat-icon>
                </button>
              </mat-card-actions>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { max-width: 1000px; margin: 0 auto; padding: 24px 16px; }
    .page-header { margin-bottom: 24px; }
    .section-title { margin: 0 0 4px; font-size: 1.5rem; font-weight: 600; }
    .section-subtitle { margin: 0; color: #6b7280; font-size: 0.9rem; }

    .plans-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px; }

    .plan-card {
      border-radius: 14px !important;
      border-left: 4px solid #3b82f6;
      transition: transform 0.15s, box-shadow 0.15s;
      &:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }
      mat-card-content { padding: 20px !important; }
      mat-card-actions { padding: 0 12px 12px !important; }
    }

    .plan-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .plan-icon { font-size: 2rem; width: 2rem; height: 2rem; color: #3b82f6; }
    .duration-badge { background: #eff6ff; color: #1d4ed8; font-size: 0.75rem;
      font-weight: 600; padding: 3px 10px; border-radius: 12px; }
    .plan-title { font-size: 0.95rem; font-weight: 600; color: #1a1a2e; margin: 0 0 8px; }
    .plan-goal { display: flex; align-items: center; gap: 6px; color: #6b7280; font-size: 0.85rem;
      margin: 0 0 8px;
      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; color: #f59e0b; }
    }
    .plan-meta { color: #9ca3af; font-size: 0.78rem; margin: 0; }
  `],
})
export class StudyPlanListComponent implements OnInit {
  plans = signal<StudyPlan[]>([]);
  loading = signal(true);

  constructor(
    private studyPlanService: StudyPlanService,
    private notify: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loadPlans();
  }

  loadPlans(): void {
    this.loading.set(true);
    this.studyPlanService.getAll().subscribe({
      next: (res) => {
        this.plans.set((res.data as StudyPlan[]) ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  deletePlan(plan: StudyPlan): void {
    if (!confirm(`Delete "${plan.title}"?`)) return;
    this.studyPlanService.delete(plan.id).subscribe({
      next: () => {
        this.plans.update((p) => p.filter((x) => x.id !== plan.id));
        this.notify.success('Study plan deleted');
      },
      error: () => this.notify.error('Failed to delete plan'),
    });
  }
}
