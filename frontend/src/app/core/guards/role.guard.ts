import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const requiredRole = route.data['role'] as UserRole;
  const user = auth.currentUser();

  if (!user) {
    router.navigate(['/auth/login']);
    return false;
  }

  if (user.role !== requiredRole) {
    // Redirect to their own dashboard
    const fallback = user.role === 'teacher' ? '/teacher' : '/student';
    router.navigate([fallback]);
    return false;
  }

  return true;
};
