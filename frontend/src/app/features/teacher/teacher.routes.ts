import { Routes } from '@angular/router';
import { TeacherShellComponent } from './teacher-shell.component';

export const teacherRoutes: Routes = [
  {
    path: '',
    component: TeacherShellComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/teacher-dashboard.component').then(
            (m) => m.TeacherDashboardComponent
          ),
      },
      {
        path: 'documents',
        loadComponent: () =>
          import('./documents/document-list.component').then(
            (m) => m.DocumentListComponent
          ),
      },
      {
        path: 'documents/upload',
        loadComponent: () =>
          import('./documents/document-upload.component').then(
            (m) => m.DocumentUploadComponent
          ),
      },
      {
        path: 'documents/:id',
        loadComponent: () =>
          import('./documents/document-detail.component').then(
            (m) => m.DocumentDetailComponent
          ),
      },
      {
        path: 'quizzes',
        loadComponent: () =>
          import('./quizzes/quiz-management.component').then(
            (m) => m.QuizManagementComponent
          ),
      },
      {
        path: 'flashcards',
        loadComponent: () =>
          import('./flashcards/flashcard-management.component').then(
            (m) => m.FlashcardManagementComponent
          ),
      },
      {
        path: 'students',
        loadComponent: () =>
          import('./students/student-list.component').then(
            (m) => m.StudentListComponent
          ),
      },
    ],
  },
];
