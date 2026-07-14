import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { noAuthGuard } from './core/guards/no-auth.guard';

export const routes: Routes = [
  // Default redirect
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },

  // Auth module (login / register)
  {
    path: 'auth',
    canActivate: [noAuthGuard],
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },

  // Teacher / Admin module
  {
    path: 'teacher',
    canActivate: [authGuard, roleGuard],
    data: { role: 'teacher' },
    loadChildren: () =>
      import('./features/teacher/teacher.routes').then((m) => m.teacherRoutes),
  },

  // Student module
  {
    path: 'student',
    canActivate: [authGuard, roleGuard],
    data: { role: 'student' },
    loadChildren: () =>
      import('./features/student/student.routes').then((m) => m.studentRoutes),
  },

  // Wildcard
  { path: '**', redirectTo: 'auth/login' },
];
