import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Redirect logged-in users away from /auth pages
export const noAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return true;
  }

  const role = auth.currentUser()?.role;
  router.navigate([role === 'teacher' ? '/teacher' : '/student']);
  return false;
};
