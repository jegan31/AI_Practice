import { Component } from '@angular/core';
import { ShellComponent, NavItem } from '../../shared/components/shell/shell.component';

const STUDENT_NAV: NavItem[] = [
  { label: 'Dashboard',    icon: 'dashboard',   route: '/student/dashboard'    },
  { label: 'Documents',    icon: 'menu_book',   route: '/student/documents'    },
  { label: 'Quizzes',      icon: 'quiz',        route: '/student/quizzes'      },
  { label: 'Flashcards',   icon: 'style',       route: '/student/flashcards'   },
  { label: 'Study Plans',  icon: 'event_note',  route: '/student/study-plans'  },
];

@Component({
  selector: 'app-student-shell',
  standalone: true,
  imports: [ShellComponent],
  template: `<app-shell [navItems]="nav" pageTitle="Student Portal" />`,
})
export class StudentShellComponent {
  nav = STUDENT_NAV;
}
