import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

/**
 * Global HTTP error interceptor.
 * Shows a snackbar for 5xx errors and network failures.
 * 401 / 403 are handled by the auth interceptor and route guards, so
 * we skip those here to avoid double-toasting.
 */
export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const notify = inject(NotificationService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 0) {
        // Network error / CORS / server down
        notify.error('Cannot reach the server. Please check your connection.');
      } else if (err.status >= 500) {
        const msg = err.error?.error ?? 'A server error occurred. Please try again.';
        notify.error(msg);
      }
      // Let individual components handle 4xx via their own error callbacks
      return throwError(() => err);
    })
  );
};
