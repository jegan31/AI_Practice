import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { DocumentService } from '../../../core/services/document.service';
import { AiService } from '../../../core/services/ai.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Document, DocumentSummary } from '../../../core/models/document.model';
import { ChatMessage } from '../../../core/models/api.model';
import { StudyPlan } from '../../../core/models/study-plan.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-student-document-view',
  standalone: true,
  imports: [
    RouterLink, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatTabsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatDividerModule,
    MatListModule, MatProgressBarModule, MatChipsModule,
    LoadingSpinnerComponent, TimeAgoPipe,
  ],
  template: `
    <div class="page-container">
      <!-- Breadcrumb -->
      <div class="breadcrumb">
        <a routerLink="/student/documents">Documents</a>
        <mat-icon>chevron_right</mat-icon>
        <span>{{ doc()?.title }}</span>
      </div>

      @if (loading()) {
        <app-loading-spinner message="Loading document..." />
      } @else if (doc()) {
        <!-- Header -->
        <mat-card class="doc-header-card">
          <mat-card-content>
            <div class="doc-header">
              <mat-icon class="pdf-icon-lg">picture_as_pdf</mat-icon>
              <div>
                <h2>{{ doc()!.title }}</h2>
                <div class="meta-row">
                  <span>{{ doc()!.subject || 'General' }}</span>
                  <span>·</span>
                  <span>{{ doc()!.gradeLevel || '' }}</span>
                  <span>·</span>
                  <span>{{ doc()!.pageCount }} pages</span>
                </div>
                @if (doc()!.description) {
                  <p class="desc">{{ doc()!.description }}</p>
                }
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Tabs -->
        <mat-tab-group animationDuration="200ms" class="doc-tabs">

          <!-- Summary -->
          <mat-tab label="Summary">
            <div class="tab-content">
              @if (summary()) {
                <div class="summary-body">
                  <div class="overview-box">
                    <mat-icon>summarize</mat-icon>
                    <p>{{ summary()!.overview }}</p>
                  </div>

                  <h4>Key Topics</h4>
                  <div class="chip-list">
                    @for (t of summary()!.keyTopics; track t) {
                      <span class="chip-info tag-chip">{{ t }}</span>
                    }
                  </div>

                  <h4>Learning Objectives</h4>
                  <ul class="obj-list">
                    @for (obj of summary()!.learningObjectives; track obj) {
                      <li>{{ obj }}</li>
                    }
                  </ul>

                  <h4>Key Concepts</h4>
                  <mat-list>
                    @for (c of summary()!.mainConcepts; track c.concept) {
                      <mat-list-item>
                        <mat-icon matListItemIcon>lightbulb</mat-icon>
                        <div matListItemTitle>{{ c.concept }}</div>
                        <div matListItemLine>{{ c.explanation }}</div>
                      </mat-list-item>
                    }
                  </mat-list>

                  <p class="reading-time">
                    <mat-icon>schedule</mat-icon>
                    Estimated reading time: {{ summary()!.estimatedReadingTimeMinutes }} min
                  </p>
                </div>
              } @else {
                <div class="no-content">
                  <mat-icon>info</mat-icon>
                  <p>Summary not yet available for this document.</p>
                </div>
              }
            </div>
          </mat-tab>

          <!-- AI Chat -->
          <mat-tab label="Ask AI">
            <div class="tab-content chat-tab">
              <div class="chat-messages" #chatContainer>
                @if (chatMessages().length === 0) {
                  <div class="chat-intro">
                    <mat-icon>smart_toy</mat-icon>
                    <h4>AI Learning Coach</h4>
                    <p>Ask me anything about this document. I'll answer based on its content.</p>
                  </div>
                }
                @for (msg of chatMessages(); track $index) {
                  <div class="chat-bubble" [class]="msg.role">
                    <mat-icon class="bubble-icon">
                      {{ msg.role === 'user' ? 'person' : 'smart_toy' }}
                    </mat-icon>
                    <div class="bubble-content">
                      <p>{{ msg.content }}</p>
                      <span class="bubble-time">{{ msg.timestamp | timeAgo }}</span>
                    </div>
                  </div>
                }
                @if (chatLoading()) {
                  <div class="chat-bubble assistant thinking">
                    <mat-icon>smart_toy</mat-icon>
                    <div class="bubble-content">
                      <mat-progress-bar mode="indeterminate" />
                      <span>Thinking…</span>
                    </div>
                  </div>
                }
              </div>

              <div class="chat-input-row">
                <form [formGroup]="chatForm" (ngSubmit)="sendMessage()" class="chat-form">
                  <mat-form-field appearance="outline" class="chat-field">
                    <mat-label>Ask a question about this document…</mat-label>
                    <input matInput formControlName="question"
                           (keyup.enter)="sendMessage()" autocomplete="off">
                  </mat-form-field>
                  <button mat-fab color="primary" type="submit"
                          [disabled]="chatForm.invalid || chatLoading()"
                          aria-label="Send message">
                    <mat-icon>send</mat-icon>
                  </button>
                </form>
              </div>
            </div>
          </mat-tab>

          <!-- Study Plan Generator -->
          <mat-tab label="Study Plan">
            <div class="tab-content">
              @if (generatedPlan()) {
                <div class="plan-success">
                  <mat-icon>check_circle</mat-icon>
                  <div>
                    <h4>Study plan generated!</h4>
                    <p>Your {{ generatedPlan()!.durationDays }}-day plan has been saved.</p>
                  </div>
                  <a mat-button color="primary"
                     [routerLink]="['/student/study-plans', generatedPlan()!.id]">
                    View Plan
                  </a>
                </div>
              }

              <form [formGroup]="planForm" (ngSubmit)="generatePlan()" class="plan-form">
                <h4>Generate a personalised study plan</h4>
                <p class="plan-hint">Tell the AI your goal and how long you want to study.</p>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Your study goal</mat-label>
                  <textarea matInput formControlName="goal" rows="2"
                            placeholder="e.g. Prepare for the end-of-term exam on this topic"></textarea>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Duration</mat-label>
                  <mat-select formControlName="durationDays">
                    <mat-option [value]="3">3 days</mat-option>
                    <mat-option [value]="7">1 week</mat-option>
                    <mat-option [value]="14">2 weeks</mat-option>
                    <mat-option [value]="30">1 month</mat-option>
                  </mat-select>
                </mat-form-field>

                <button mat-raised-button color="primary" type="submit"
                        [disabled]="planForm.invalid || planLoading()">
                  @if (planLoading()) {
                    Generating…
                  } @else {
                    <mat-icon>auto_awesome</mat-icon> Generate Study Plan
                  }
                </button>

                @if (planLoading()) {
                  <mat-progress-bar mode="indeterminate" color="primary" class="plan-progress" />
                  <p class="plan-loading-hint">AI is crafting your personalised plan…</p>
                }
              </form>
            </div>
          </mat-tab>

        </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    .page-container { max-width: 860px; margin: 0 auto; padding: 24px 16px; }

    .breadcrumb { display: flex; align-items: center; gap: 4px; color: #6b7280;
      font-size: 0.9rem; margin-bottom: 20px;
      a { color: #6366f1; text-decoration: none; }
      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }
    }

    .doc-header-card { border-radius: 16px !important; margin-bottom: 20px;
      mat-card-content { padding: 24px !important; }
    }
    .doc-header { display: flex; align-items: flex-start; gap: 20px; }
    .pdf-icon-lg { font-size: 3rem; width: 3rem; height: 3rem; color: #ef4444; }
    h2 { margin: 0 0 8px; font-size: 1.4rem; font-weight: 700; }
    .meta-row { display: flex; gap: 8px; color: #6b7280; font-size: 0.85rem; }
    .desc { color: #6b7280; font-size: 0.9rem; margin-top: 8px; }

    .doc-tabs { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .tab-content { padding: 24px; }

    /* Summary */
    .summary-body { h4 { font-weight: 600; color: #374151; margin: 20px 0 10px; font-size: 1rem; } }
    .overview-box {
      display: flex; gap: 12px; background: #eef2ff; border-radius: 10px; padding: 16px;
      mat-icon { color: #6366f1; flex-shrink: 0; margin-top: 2px; }
      p { margin: 0; color: #374151; line-height: 1.6; }
    }
    .chip-list { display: flex; flex-wrap: wrap; gap: 8px; }
    .tag-chip { font-size: 0.8rem; }
    .obj-list { padding-left: 20px; li { margin-bottom: 6px; color: #374151; line-height: 1.6; } }
    .reading-time { display: flex; align-items: center; gap: 6px; color: #6b7280;
      font-size: 0.85rem; margin-top: 20px;
      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }
    }
    .no-content { display: flex; gap: 12px; align-items: center; color: #9ca3af; padding: 48px 24px;
      mat-icon { font-size: 2rem; width: 2rem; height: 2rem; }
    }

    /* Chat */
    .chat-tab { padding: 0 !important; display: flex; flex-direction: column; height: 520px; }
    .chat-messages {
      flex: 1; overflow-y: auto; padding: 20px;
      display: flex; flex-direction: column; gap: 16px;
    }
    .chat-intro {
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      padding: 40px; text-align: center; color: #6b7280;
      mat-icon { font-size: 3rem; width: 3rem; height: 3rem; color: #d1d5db; }
      h4 { margin: 0; color: #374151; font-size: 1.1rem; }
      p { margin: 0; max-width: 320px; }
    }
    .chat-bubble {
      display: flex; gap: 10px; max-width: 85%;
      &.user { align-self: flex-end; flex-direction: row-reverse;
        .bubble-content { background: #6366f1; color: white; border-radius: 16px 4px 16px 16px; }
        .bubble-time { color: rgba(255,255,255,0.7) !important; }
        mat-icon { color: #6366f1; }
      }
      &.assistant { align-self: flex-start;
        .bubble-content { background: #f3f4f6; border-radius: 4px 16px 16px 16px; }
        mat-icon { color: #10b981; }
      }
      &.thinking { opacity: 0.7; }
      mat-icon { font-size: 1.8rem; width: 1.8rem; height: 1.8rem; flex-shrink: 0; margin-top: 4px; }
    }
    .bubble-content {
      padding: 12px 16px; max-width: 100%;
      p { margin: 0 0 4px; line-height: 1.6; white-space: pre-wrap; }
    }
    .bubble-time { font-size: 0.72rem; color: #9ca3af; }

    .chat-input-row { padding: 12px 20px; border-top: 1px solid #f3f4f6; background: white; }
    .chat-form { display: flex; gap: 10px; align-items: center; }
    .chat-field { flex: 1; }

    /* Study plan */
    .plan-form { display: flex; flex-direction: column; gap: 16px; max-width: 540px;
      h4 { font-weight: 600; font-size: 1rem; margin: 0; }
    }
    .plan-hint { color: #6b7280; margin: 0; font-size: 0.9rem; }
    .full-width { width: 100%; }
    .plan-progress { margin-top: 4px; }
    .plan-loading-hint { color: #6b7280; font-size: 0.85rem; margin: 4px 0 0; }
    .plan-success {
      display: flex; align-items: center; gap: 12px; background: #f0fdf4;
      border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px; margin-bottom: 24px;
      mat-icon { color: #10b981; font-size: 2rem; width: 2rem; height: 2rem; }
      h4 { margin: 0 0 4px; }
      p { margin: 0; color: #6b7280; font-size: 0.85rem; }
      div { flex: 1; }
    }
  `],
})
export class StudentDocumentViewComponent implements OnInit {
  doc = signal<Document | null>(null);
  summary = signal<DocumentSummary | null>(null);
  loading = signal(true);
  chatMessages = signal<ChatMessage[]>([]);
  chatLoading = signal(false);
  planLoading = signal(false);
  generatedPlan = signal<StudyPlan | null>(null);

  chatForm: FormGroup;
  planForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private docService: DocumentService,
    private aiService: AiService,
    private notify: NotificationService,
    private fb: FormBuilder,
  ) {
    this.chatForm = this.fb.group({ question: ['', Validators.required] });
    this.planForm = this.fb.group({
      goal: ['', Validators.required],
      durationDays: [7, Validators.required],
    });
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.docService.getById(id).subscribe({
      next: (res) => {
        this.doc.set(res.data ?? null);
        this.loading.set(false);
        if (res.data?.aiProcessed) {
          this.aiService.getSummary(id).subscribe({
            next: (r) => this.summary.set(r.data ?? null),
          });
        }
      },
      error: () => this.loading.set(false),
    });
  }

  sendMessage(): void {
    const question = this.chatForm.get('question')?.value?.trim();
    if (!question || this.chatLoading()) return;

    const userMsg: ChatMessage = { role: 'user', content: question, timestamp: new Date() };
    this.chatMessages.update((msgs) => [...msgs, userMsg]);
    this.chatForm.reset();
    this.chatLoading.set(true);

    const history = this.chatMessages().map((m) => ({ role: m.role, content: m.content }));

    this.aiService.chat(this.doc()!.id, question, history).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const aiMsg: ChatMessage = {
            role: 'assistant',
            content: res.data.answer,
            timestamp: new Date(),
          };
          this.chatMessages.update((msgs) => [...msgs, aiMsg]);
        }
        this.chatLoading.set(false);
      },
      error: () => {
        this.notify.error('Failed to get answer from AI.');
        this.chatLoading.set(false);
      },
    });
  }

  generatePlan(): void {
    if (this.planForm.invalid) return;
    this.planLoading.set(true);
    this.generatedPlan.set(null);

    this.aiService.generateStudyPlan(this.doc()!.id, this.planForm.value).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.generatedPlan.set(res.data);
          this.notify.success('Study plan created successfully!');
        }
        this.planLoading.set(false);
      },
      error: () => {
        this.notify.error('Failed to generate study plan.');
        this.planLoading.set(false);
      },
    });
  }
}
