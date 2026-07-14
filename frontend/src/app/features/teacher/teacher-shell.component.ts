import { Component } from '@angular/core';
import { ShellComponent, NavItem } from '../../shared/components/shell/shell.component';

const TEACHER_NAV: NavItem[] = [
  { label: 'Dashboard',   icon: 'dashboard',          route: '/teacher/dashboard'  },
  { label: 'Documents',   icon: 'folder_open',        route: '/teacher/documents'  },
  { label: 'Quizzes',     icon: 'quiz',               route: '/teacher/quizzes'    },
  { label: 'Flashcards',  icon: 'style',              route: '/teacher/flashcards' },
  { label: 'Students',    icon: 'people',             route: '/teacher/students'   },
];

@Component({
  selector: 'app-teacher-shell',
  standalone: true,
  imports: [ShellComponent],
  template: `
    <app-shell [navItems]="nav" pageTitle="Teacher Portal" />
  `,
})
export class TeacherShellComponent {
  nav = TEACHER_NAV;
}
