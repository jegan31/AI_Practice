import { Routes } from '@angular/router';
import { StudentShellComponent } from './student-shell.component';

export const studentRoutes: Routes = [
  {
    path: '',
    component: StudentShellComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/student-dashboard.component').then(
            (m) => m.StudentDashboardComponent
          ),
      },
      {
        path: 'documents',
        loadComponent: () =>
          import('./documents/student-document-list.component').then(
            (m) => m.StudentDocumentListComponent
          ),
      },
      {
        path: 'documents/:id',
        loadComponent: () =>
          import('./documents/student-document-view.component').then(
            (m) => m.StudentDocumentViewComponent
          ),
      },
      {
        path: 'quizzes',
        loadComponent: () =>
          import('./quizzes/quiz-list.component').then(
            (m) => m.QuizListComponent
          ),
      },
      {
        path: 'quizzes/:id/play',
        loadComponent: () =>
          import('./quizzes/quiz-player.component').then(
            (m) => m.QuizPlayerComponent
          ),
      },
      {
        path: 'flashcards',
        loadComponent: () =>
          import('./flashcards/flashcard-list.component').then(
            (m) => m.FlashcardListComponent
          ),
      },
      {
        path: 'flashcards/:id/study',
        loadComponent: () =>
          import('./flashcards/flashcard-study.component').then(
            (m) => m.FlashcardStudyComponent
          ),
      },
      {
        path: 'study-plans',
        loadComponent: () =>
          import('./study-plans/study-plan-list.component').then(
            (m) => m.StudyPlanListComponent
          ),
      },
      {
        path: 'study-plans/:id',
        loadComponent: () =>
          import('./study-plans/study-plan-detail.component').then(
            (m) => m.StudyPlanDetailComponent
          ),
      },
    ],
  },
];
