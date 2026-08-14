import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-box">
        <h2>Dashboard Login</h2>
        <div *ngIf="error" class="error-msg">{{ error }}</div>
        
        <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
          <div class="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" name="username" [(ngModel)]="username" required>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" [(ngModel)]="password" required>
          </div>
          <button type="submit" [disabled]="!loginForm.form.valid || loading">
            {{ loading ? 'Logging in...' : 'Login' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: #f0f2f5;
    }
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      background: #f0f2f5;
    }
    .login-box {
      background: #ffffff !important;
      padding: 2.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.12);
      width: 100%;
      max-width: 400px;
    }
    h2 {
      margin-top: 0;
      margin-bottom: 1.5rem;
      text-align: center;
      color: #1a1a2e !important;
      font-size: 1.5rem;
      font-weight: 700;
      font-family: monospace;
    }
    .form-group {
      margin-bottom: 1.25rem;
    }
    label {
      display: block;
      margin-bottom: 0.4rem;
      font-weight: 600;
      font-size: 0.85rem;
      color: #555 !important;
      font-family: sans-serif;
    }
    input {
      width: 100%;
      padding: 0.65rem 0.75rem;
      border: 1.5px solid #d0d5dd;
      border-radius: 6px;
      box-sizing: border-box;
      font-size: 0.95rem;
      color: #1a1a1a !important;
      background: #ffffff !important;
      outline: none;
      transition: border-color 0.2s;
      font-family: sans-serif;
    }
    input:focus {
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0,123,255,0.12);
    }
    button {
      width: 100%;
      padding: 0.75rem;
      background-color: #007bff;
      color: #ffffff !important;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      margin-top: 0.5rem;
      transition: background-color 0.2s;
    }
    button:hover:not(:disabled) {
      background-color: #0056b3;
    }
    button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
    .error-msg {
      color: #e53935 !important;
      background: #fff5f5;
      border: 1px solid #fcd0d0;
      border-radius: 6px;
      padding: 0.5rem 0.75rem;
      margin-bottom: 1rem;
      text-align: center;
      font-size: 0.9rem;
      font-family: sans-serif;
    }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  loading = false;
  error = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.loading = true;
    this.error = '';
    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Invalid username or password';
        if (err.status === 429) {
          this.error = 'Too many attempts. Please try again later.';
        }
      }
    });
  }
}
