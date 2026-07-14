import { Component, Input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="spinner-wrapper" [class.overlay]="overlay">
      <mat-spinner [diameter]="diameter" />
      @if (message) {
        <p class="spinner-message">{{ message }}</p>
      }
    </div>
  `,
  styles: [`
    .spinner-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 32px;
    }
    .spinner-wrapper.overlay {
      position: fixed;
      inset: 0;
      background: rgba(255,255,255,0.75);
      z-index: 9999;
    }
    .spinner-message { color: #6b7280; font-size: 0.9rem; }
  `],
})
export class LoadingSpinnerComponent {
  @Input() diameter = 48;
  @Input() message = '';
  @Input() overlay = false;
}
