import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { StudyPlanService } from '../../../core/services/study-plan.service';
import { StudyPlan, StudyDay } from '../../../core/models/study-plan.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-study-plan-detail',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule, MatButtonModule, MatIconModule, MatDividerModule,
    MatChipsModule, MatExpansionModule, LoadingSpinnerComponent, TimeAgoPipe,
  ],
  template: `
    <div class="page-container">
      <!-- Breadcrumb -->
      <div class="breadcrumb">
        <a routerLink="/student/study-plans">Study Plans</a>
        <mat-icon>chevron_right</mat-icon>
        <span>{{ plan()?.title }}</span>
      </div>

      @if (loading()) {
        <app-loading-spinner message="Loading study plan..." />
      } @else if (plan()) {
        <!-- Plan header -->
        <mat-card class="plan-header-card">
          <mat-card-content>
            <div class="plan-header">
              <mat-icon class="plan-icon">event_note</mat-icon>
              <div class="plan-info">
                <h2>{{ plan()!.title }}</h2>
                @if (plan()!.goal) {
                  <p class="plan-goal">
                    <mat-icon>flag</mat-icon>
                    <strong>Goal:</strong> {{ plan()!.goal }}
                  </p>
                }
                <div class="plan-meta-row">
                  <span class="duration-badge">{{ plan()!.durationDays }} days</span>
                  <span class="meta-text">Created {{ plan()!.createdAt | timeAgo }}</span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Day-by-day schedule -->
        <h3 class="schedule-title">Daily Schedule</h3>

        <mat-accordion class="days-accordion" multi>
          @for (day of plan()!.planContent; track day.day) {
            <mat-expansion-panel [expanded]="day.day === 1" class="day-panel">
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <span class="day-num">Day {{ day.day }}</span>
                  <span class="day-title">{{ day.title }}</span>
                </mat-panel-title>
                <mat-panel-description>
                  <mat-icon>schedule</mat-icon> {{ day.estimatedMinutes }} min
                </mat-panel-description>
              </mat-expansion-panel-header>

              <div class="day-body">
                <!-- Topics -->
                @if (day.topics?.length) {
                  <div class="day-section">
                    <h5><mat-icon>topic</mat-icon> Topics</h5>
                    <div class="chip-list">
                      @for (topic of day.topics; track topic) {
                        <span class="chip-info topic-chip">{{ topic }}</span>
                      }
                    </div>
                  </div>
                }

                <!-- Activities -->
                <div class="day-section">
                  <h5><mat-icon>checklist</mat-icon> Activities</h5>
                  <div class="activities-list">
                    @for (activity of day.activities; track $index) {
                      <div class="activity-item" [class]="'activity-' + activity.type">
                        <mat-icon>{{ getActivityIcon(activity.type) }}</mat-icon>
                        <div>
                          <span class="activity-type">{{ activity.type | titlecase }}</span>
                          <p class="activity-desc">{{ activity.description }}</p>
                        </div>
                      </div>
                    }
                  </div>
                </div>

                <!-- Tip -->
                @if (day.tips) {
                  <div class="day-tip">
                    <mat-icon>lightbulb</mat-icon>
                    <p>{{ day.tips }}</p>
                  </div>
                }
              </div>
            </mat-expansion-panel>
          }
        </mat-accordion>
      }
    </div>
  `,
  styles: [`
    .page-container { max-width: 840px; margin: 0 auto; padding: 24px 16px; }

    .breadcrumb { display: flex; align-items: center; gap: 4px; color: #6b7280;
      font-size: 0.9rem; margin-bottom: 20px;
      a { color: #6366f1; text-decoration: none; }
      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }
    }

    .plan-header-card { border-radius: 16px !important; margin-bottom: 24px;
      mat-card-content { padding: 24px !important; }
    }
    .plan-header { display: flex; gap: 20px; align-items: flex-start; }
    .plan-icon { font-size: 3rem; width: 3rem; height: 3rem; color: #3b82f6; }
    .plan-info { flex: 1; h2 { margin: 0 0 8px; font-size: 1.4rem; font-weight: 700; } }
    .plan-goal { display: flex; align-items: center; gap: 8px; color: #374151;
      font-size: 0.9rem; margin: 0 0 12px;
      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; color: #f59e0b; }
    }
    .plan-meta-row { display: flex; align-items: center; gap: 12px; }
    .duration-badge { background: #eff6ff; color: #1d4ed8;
      font-size: 0.8rem; font-weight: 600; padding: 3px 12px; border-radius: 12px; }
    .meta-text { color: #9ca3af; font-size: 0.8rem; }

    .schedule-title { font-size: 1.1rem; font-weight: 700; color: #374151;
      margin: 0 0 16px; }

    .days-accordion { display: flex; flex-direction: column; gap: 8px; }
    .day-panel { border-radius: 12px !important; }

    mat-panel-title { display: flex; align-items: center; gap: 10px; }
    mat-panel-description { display: flex; align-items: center; gap: 4px; color: #6b7280; font-size: 0.85rem;
      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }
    }
    .day-num { background: #3b82f6; color: white; font-size: 0.75rem;
      font-weight: 700; padding: 2px 10px; border-radius: 12px; white-space: nowrap; }
    .day-title { font-weight: 600; color: #1a1a2e; }

    .day-body { padding: 8px 0 0; }
    .day-section { margin-bottom: 20px;
      h5 { display: flex; align-items: center; gap: 6px; font-size: 0.9rem;
        font-weight: 700; color: #374151; margin: 0 0 10px;
        mat-icon { font-size: 1.1rem; width: 1.1rem; height: 1.1rem; color: #6366f1; }
      }
    }
    .chip-list { display: flex; flex-wrap: wrap; gap: 8px; }
    .topic-chip { font-size: 0.8rem !important; }

    .activities-list { display: flex; flex-direction: column; gap: 8px; }
    .activity-item {
      display: flex; gap: 12px; padding: 12px; border-radius: 8px;
      mat-icon { flex-shrink: 0; margin-top: 2px; }
      &.activity-read    { background: #eef2ff; mat-icon { color: #6366f1; } }
      &.activity-practice{ background: #fffbeb; mat-icon { color: #f59e0b; } }
      &.activity-review  { background: #f0fdf4; mat-icon { color: #10b981; } }
    }
    .activity-type { font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.05em; color: #6b7280; display: block; margin-bottom: 2px; }
    .activity-desc { margin: 0; color: #374151; font-size: 0.9rem; line-height: 1.4; }

    .day-tip {
      display: flex; gap: 10px; align-items: flex-start;
      background: #fffbeb; border-radius: 8px; padding: 12px;
      mat-icon { color: #f59e0b; flex-shrink: 0; }
      p { margin: 0; color: #374151; font-size: 0.875rem; line-height: 1.5; }
    }
  `],
})
export class StudyPlanDetailComponent implements OnInit {
  plan = signal<StudyPlan | null>(null);
  loading = signal(true);

  constructor(
    private route: ActivatedRoute,
    private studyPlanService: StudyPlanService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.studyPlanService.getById(id).subscribe({
      next: (res) => {
        this.plan.set(res.data ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      read: 'menu_book',
      practice: 'edit_note',
      review: 'repeat',
    };
    return icons[type] ?? 'task_alt';
  }
}
