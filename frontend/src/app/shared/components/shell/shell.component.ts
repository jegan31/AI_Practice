import { Component, Input, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/services/auth.service';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatListModule,
    MatIconModule, MatButtonModule, MatMenuModule,
    MatDividerModule, MatTooltipModule,
  ],
  template: `
    <mat-sidenav-container class="shell-container">
      <!-- Sidebar -->
      <mat-sidenav
        #sidenav
        [mode]="sidenavMode()"
        [opened]="sidenavOpen()"
        class="app-sidenav">

        <!-- Brand -->
        <div class="sidenav-header">
          <mat-icon class="brand-icon">school</mat-icon>
          <span class="brand-name">Learning Coach</span>
        </div>
        <mat-divider />

        <!-- Role badge -->
        <div class="role-badge" [class]="'role-' + auth.currentUser()?.role">
          <mat-icon>{{ auth.isTeacher() ? 'admin_panel_settings' : 'person' }}</mat-icon>
          <span>{{ auth.isTeacher() ? 'Teacher' : 'Student' }}</span>
        </div>

        <!-- Nav items -->
        <mat-nav-list>
          @for (item of navItems; track item.route) {
            <a mat-list-item
               [routerLink]="item.route"
               routerLinkActive="active-nav-item"
               [routerLinkActiveOptions]="{ exact: item.route.endsWith('/') }"
               (click)="onNavClick()">
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>

        <div class="sidenav-footer">
          <mat-divider />
          <button mat-list-item class="logout-btn" (click)="logout()">
            <mat-icon>logout</mat-icon>
            <span>Sign Out</span>
          </button>
        </div>
      </mat-sidenav>

      <!-- Main content -->
      <mat-sidenav-content class="main-content">
        <!-- Top toolbar -->
        <mat-toolbar color="primary" class="app-toolbar">
          <button mat-icon-button (click)="toggleSidenav()" aria-label="Toggle menu">
            <mat-icon>menu</mat-icon>
          </button>
          <span class="toolbar-title">{{ pageTitle }}</span>
          <span class="toolbar-spacer"></span>

          <!-- User menu -->
          <button mat-button [matMenuTriggerFor]="userMenu" class="user-btn">
            <mat-icon>account_circle</mat-icon>
            <span class="user-name">{{ auth.currentUser()?.firstName }}</span>
          </button>
          <mat-menu #userMenu="matMenu">
            <div class="user-menu-header">
              <strong>{{ auth.currentUser()?.fullName }}</strong>
              <small>{{ auth.currentUser()?.email }}</small>
            </div>
            <mat-divider />
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon> Sign Out
            </button>
          </mat-menu>
        </mat-toolbar>

        <!-- Page content -->
        <div class="page-content">
          <router-outlet />
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .shell-container { height: 100vh; }

    .app-sidenav {
      width: 260px;
      background: #1a1a2e;
      color: #e2e8f0;
      display: flex;
      flex-direction: column;
    }

    .sidenav-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 16px;
      .brand-icon { font-size: 2rem; width: 2rem; height: 2rem; color: #818cf8; }
      .brand-name { font-size: 1.2rem; font-weight: 700; color: #ffffff; }
    }

    .role-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 8px 16px;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;
      &.role-teacher { background: rgba(99,102,241,0.2); color: #a5b4fc; }
      &.role-student { background: rgba(16,185,129,0.2); color: #6ee7b7; }
      mat-icon { font-size: 1.1rem; width: 1.1rem; height: 1.1rem; }
    }

    mat-nav-list {
      flex: 1;
      a {
        color: #94a3b8 !important;
        border-radius: 8px !important;
        margin: 2px 8px !important;
        &.active-nav-item {
          background: rgba(99,102,241,0.25) !important;
          color: #818cf8 !important;
          mat-icon { color: #818cf8; }
        }
        &:hover { background: rgba(255,255,255,0.05) !important; color: #e2e8f0 !important; }
      }
    }

    .sidenav-footer {
      padding: 8px;
      .logout-btn {
        width: 100%;
        color: #f87171;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border-radius: 8px;
        cursor: pointer;
        background: none;
        border: none;
        &:hover { background: rgba(248,113,113,0.1); }
      }
    }

    .app-toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #3730a3 !important;
    }

    .toolbar-title { font-size: 1.1rem; font-weight: 500; margin-left: 8px; }
    .toolbar-spacer { flex: 1; }
    .user-btn { display: flex; align-items: center; gap: 6px; color: white; }
    .user-name { font-weight: 500; }

    .user-menu-header {
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      strong { font-size: 0.95rem; }
      small { color: #6b7280; }
    }

    .main-content { display: flex; flex-direction: column; background: #f5f5f5; }
    .page-content { flex: 1; overflow: auto; }
  `],
})
export class ShellComponent {
  @Input() navItems: NavItem[] = [];
  @Input() pageTitle = 'Learning Coach';

  sidenavOpen = signal(true);
  sidenavMode = signal<'side' | 'over'>('side');

  constructor(public auth: AuthService, private router: Router) {}

  toggleSidenav(): void {
    this.sidenavOpen.update((v) => !v);
  }

  onNavClick(): void {
    if (this.sidenavMode() === 'over') {
      this.sidenavOpen.set(false);
    }
  }

  logout(): void {
    this.auth.logout();
  }
}
