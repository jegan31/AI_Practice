import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private defaults: MatSnackBarConfig = {
    duration: 4000,
    horizontalPosition: 'right',
    verticalPosition: 'top',
  };

  constructor(private snackBar: MatSnackBar) {}

  success(message: string): void {
    this.snackBar.open(message, '✕', {
      ...this.defaults,
      panelClass: ['snack-success'],
    });
  }

  error(message: string): void {
    this.snackBar.open(message, '✕', {
      ...this.defaults,
      duration: 6000,
      panelClass: ['snack-error'],
    });
  }

  info(message: string): void {
    this.snackBar.open(message, '✕', {
      ...this.defaults,
      panelClass: ['snack-info'],
    });
  }

  warning(message: string): void {
    this.snackBar.open(message, '✕', {
      ...this.defaults,
      panelClass: ['snack-warning'],
    });
  }
}
