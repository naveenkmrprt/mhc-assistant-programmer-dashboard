import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'quiz',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/quizzer/quiz.component').then(m => m.QuizComponent)
  },
  {
    path: 'vault',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/vault/vault.component').then(m => m.VaultComponent)
  },
  {
    path: 'history',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/history/history.component').then(m => m.HistoryComponent)
  },
  {
    path: 'syllabus',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/syllabus/syllabus.component').then(m => m.SyllabusComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
