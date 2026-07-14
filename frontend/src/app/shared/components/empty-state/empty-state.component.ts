import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  template: `
    <div class="empty-state">
      <mat-icon class="empty-icon">{{ icon }}</mat-icon>
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <ng-content />
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 32px;
      text-align: center;
      color: #6b7280;
    }
    .empty-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      color: #d1d5db;
      margin-bottom: 16px;
    }
    h3 { font-size: 1.2rem; font-weight: 600; color: #374151; margin: 0 0 8px; }
    p { margin: 0 0 24px; max-width: 360px; line-height: 1.6; }
  `],
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() title = 'Nothing here yet';
  @Input() message = '';
}
