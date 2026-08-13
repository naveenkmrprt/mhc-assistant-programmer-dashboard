import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ApiService } from './core/services/api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <nav class="nav-rail">
      <div class="nav-brand">MHC<span class="nav-brand-accent">AP</span></div>
      <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-link">
        <span class="nav-icon">⬛</span>DASHBOARD
      </a>
      <a routerLink="/quiz" routerLinkActive="active" class="nav-link">
        <span class="nav-icon">▶</span>QUIZZER
      </a>
      <a routerLink="/syllabus" routerLinkActive="active" class="nav-link">
        <span class="nav-icon">▦</span>SYLLABUS
      </a>
      <a routerLink="/vault" routerLinkActive="active" class="nav-link">
        <span class="nav-icon">◼</span>PYP VAULT
      </a>
      <a routerLink="/history" routerLinkActive="active" class="nav-link">
        <span class="nav-icon">◈</span>HISTORY
      </a>

      <!-- Role Details Button -->
      <a (click)="openRoleDetails()" class="nav-link" style="cursor: pointer; margin-top: auto; border-top: 1px solid #1f1f1f;">
        <span class="nav-icon">ℹ</span>ROLE DETAILS
      </a>

      <div class="nav-footer" style="margin-top: 0; border-top: none;">EXAM: 06 SEP 2026</div>
    </nav>
    <main class="main-content">
      <router-outlet />
    </main>

    <!-- Role Details Modal -->
    @if (showRoleModal) {
      <div class="modal-backdrop" (click)="closeRoleDetails()">
        <div class="modal-content card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 class="card-title" style="margin: 0;">{{ roleData?.title || 'ROLE DETAILS' }}</h2>
            <button class="btn btn-ghost" (click)="closeRoleDetails()">✕</button>
          </div>
          
          @if (loadingRole) {
            <div style="padding: 2rem; text-align: center; font-family: var(--mono); color: var(--grey-400);">
              LOADING...
            </div>
          } @else if (roleData) {
            <div class="modal-body">
              <div class="role-section" style="flex-direction: row; justify-content: space-between; border-bottom: 1px solid var(--grey-800); padding-bottom: 1rem;">
                <div>
                  <div class="section-label">SALARY & PAY SCALE</div>
                  <div class="section-content mono" style="font-size: 1.1rem; color: var(--green);">
                    {{ roleData.salary.range }}
                  </div>
                  <div class="section-content" style="color: var(--grey-400); font-size: 0.8rem;">
                    {{ roleData.salary.payLevel }} | {{ roleData.salary.category }}
                  </div>
                </div>
                <div style="text-align: right;">
                  <div class="section-label">TOTAL VACANCIES</div>
                  <div class="section-content mono" style="font-size: 1.1rem; color: var(--white); margin-bottom: 0.5rem;">
                    {{ roleData.vacancies }}
                  </div>
                  <div style="background: rgba(234, 179, 8, 0.1); border: 1px solid var(--yellow); padding: 0.5rem; border-radius: 4px; text-align: left; max-width: 300px;">
                    <div class="section-label" style="color: var(--yellow); font-weight: bold; margin-bottom: 0.2rem;">BC CATEGORY BREAKDOWN</div>
                    <div class="section-content mono" style="font-size: 0.75rem; color: var(--grey-200); line-height: 1.4;">
                      {{ roleData.bcVacancies }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="role-section">
                <div class="section-label">EDUCATIONAL QUALIFICATIONS & EXPERIENCE</div>
                <ul class="role-list" style="color: var(--yellow);">
                  @for (q of roleData.qualifications; track q) {
                    <li>{{ q }}</li>
                  }
                </ul>
              </div>

              <div class="role-section">
                <div class="section-label">PLACE OF POSTING</div>
                <div class="section-content" style="color: var(--grey-300);">
                  {{ roleData.placeOfPosting }}
                </div>
              </div>

              <div class="role-section">
                <div class="section-label">ALLOWANCES</div>
                <ul class="role-list">
                  @for (a of roleData.allowances; track a) {
                    <li>{{ a }}</li>
                  }
                </ul>
              </div>

              <div class="role-section">
                <div class="section-label">BENEFITS</div>
                <ul class="role-list">
                  @for (b of roleData.benefits; track b) {
                    <li>{{ b }}</li>
                  }
                </ul>
              </div>

              <div class="role-section">
                <div class="section-label">JOB RESPONSIBILITIES</div>
                <ul class="role-list">
                  @for (r of roleData.responsibilities; track r) {
                    <li>{{ r }}</li>
                  }
                </ul>
              </div>

              <div class="role-section">
                <div class="section-label">CAREER GROWTH</div>
                <div class="section-content mono" style="color: var(--grey-400); font-size: 0.85rem;">
                  {{ roleData.careerGrowth }}
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: flex; height: 100vh; }
    .nav-rail {
      width: 200px; min-width: 200px;
      background: #0a0a0a;
      border-right: 2px solid #1f1f1f;
      display: flex; flex-direction: column;
      padding: 2rem 0 0 0;
      position: sticky; top: 0; height: 100vh;
    }
    .nav-brand {
      font-family: 'Space Mono', monospace;
      font-size: 1.6rem; font-weight: 700;
      color: #fff; padding: 0 1.5rem 2rem;
      letter-spacing: 0.1em;
      border-bottom: 1px solid #1f1f1f;
      margin-bottom: 1rem;
    }
    .nav-brand-accent { color: var(--red); }
    .nav-link {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.75rem 1.5rem;
      color: #666; font-size: 0.75rem; font-weight: 700;
      letter-spacing: 0.1em; text-decoration: none;
      transition: color 0.15s, background 0.15s;
      border-left: 3px solid transparent;
    }
    .nav-link:hover { color: #fff; background: #111; }
    .nav-link.active {
      color: var(--red); border-left-color: var(--red);
      background: rgba(220,38,38,0.06);
    }
    .nav-icon { font-size: 0.6rem; }
    .nav-footer {
      padding: 1rem 1.5rem;
      font-size: 0.6rem; color: #333;
      letter-spacing: 0.08em; font-family: 'Space Mono', monospace;
    }
    .main-content {
      flex: 1; overflow-y: auto;
      background: #0d0d0d;
    }

    /* Modal Styles */
    .modal-backdrop {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.8); backdrop-filter: blur(4px);
      display: flex; justify-content: center; align-items: center;
      z-index: 1000;
    }
    .modal-content {
      width: 90%; max-width: 600px;
      max-height: 90vh; overflow-y: auto;
      background: #0d0d0d; border: 1px solid #333;
      padding: 0;
    }
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1.5rem; border-bottom: 1px solid #1f1f1f;
      background: #111;
    }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
    .role-section { display: flex; flex-direction: column; gap: 0.5rem; }
    .section-label { font-family: var(--mono); font-size: 0.75rem; color: var(--grey-500); }
    .section-content { font-size: 0.9rem; color: var(--grey-200); line-height: 1.5; }
    .role-list { margin: 0; padding-left: 1.2rem; color: var(--grey-300); font-size: 0.85rem; line-height: 1.6; }
    .role-list li { margin-bottom: 0.4rem; }
  `]
})
export class AppComponent {
  showRoleModal = false;
  loadingRole = false;
  roleData: any = null;

  constructor(private api: ApiService) {}

  openRoleDetails() {
    this.showRoleModal = true;
    if (!this.roleData) {
      this.loadingRole = true;
      this.api.getRoleDetails().subscribe({
        next: (data) => {
          this.roleData = data;
          this.loadingRole = false;
        },
        error: () => {
          this.loadingRole = false;
        }
      });
    }
  }

  closeRoleDetails() {
    this.showRoleModal = false;
  }
}
