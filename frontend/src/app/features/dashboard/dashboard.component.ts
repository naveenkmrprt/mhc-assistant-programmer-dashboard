import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { DashboardSummary } from '../../core/models/models';
import { TimerComponent } from '../clock/timer.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TimerComponent],
  template: `
    <div class="page fade-in">

      <!-- Doomsday Clock -->
      <app-timer />

      <!-- Stats Row -->
      <div class="stats-row grid-4" style="margin-top:1.5rem;">
        <div class="card">
          <div class="card-title">Total Sessions</div>
          <div class="stat-num">{{ summary?.totalSessions ?? '—' }}</div>
        </div>
        <div class="card">
          <div class="card-title">Avg Score</div>
          <div class="stat-num" [class.red]="(summary?.averageScore ?? 0) < 50"
               [class.green]="(summary?.averageScore ?? 0) >= 70">
            {{ summary ? (summary.averageScore | number:'1.1-1') : '—' }}
          </div>
        </div>
        <div class="card">
          <div class="card-title">Avg Accuracy</div>
          <div class="stat-num" [class.yellow]="(summary?.averageAccuracy ?? 0) < 70">
            {{ summary ? (summary.averageAccuracy | number:'1.1-1') + '%' : '—' }}
          </div>
        </div>
        <div class="card">
          <div class="card-title">Syllabus Done</div>
          <div class="stat-num green">
            {{ summary ? summary.syllabusCompletionPct + '%' : '—' }}
          </div>
        </div>
      </div>

      <!-- Part Progress -->
      <div class="grid-2" style="margin-top:1.5rem;">
        <div class="card">
          <div class="card-title">Part Progress</div>
          @if (progress) {
            @for (p of partList; track p.key) {
              <div class="part-row">
                <div class="part-header">
                  <span class="part-label">{{ p.label }}</span>
                  <span class="part-pct mono">{{ progress[p.key]?.pct ?? 0 }}%</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" [class]="p.color"
                       [style.width.%]="progress[p.key]?.pct ?? 0"></div>
                </div>
              </div>
            }
          } @else {
            <div class="loading-msg">Loading...</div>
          }
        </div>

        <!-- Recent Sessions -->
        <div class="card">
          <div class="card-title">Recent Sessions</div>
          @if (summary?.recentSessions?.length) {
            <table>
              <thead>
                <tr><th>DATE</th><th>SCORE</th><th>ACCURACY</th></tr>
              </thead>
              <tbody>
                @for (s of summary!.recentSessions; track s.id) {
                  <tr>
                    <td class="mono" style="font-size:0.75rem">{{ s.date }}</td>
                    <td class="mono" [style.color]="s.score >= 70 ? 'var(--green)' : s.score < 50 ? 'var(--red)' : 'var(--yellow)'">
                      {{ s.score | number:'1.2-2' }}
                    </td>
                    <td class="mono" style="color:var(--grey-300)">{{ s.accuracy | number:'1.1-1' }}%</td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <div class="empty-state">No sessions yet.<br>Start a quiz to track progress.</div>
          }
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions" style="margin-top:1.5rem;">
        <a routerLink="/quiz" class="btn btn-primary">▶ START QUIZ</a>
        <a routerLink="/vault" class="btn btn-ghost">◼ PYP VAULT</a>
        <a routerLink="/syllabus" class="btn btn-ghost">▦ SYLLABUS</a>
        <a routerLink="/history" class="btn btn-ghost">◈ HISTORY</a>
      </div>

    </div>
  `,
  styles: [`
    .part-row { margin-bottom: 1.25rem; }
    .part-header { display:flex; justify-content:space-between; margin-bottom:0.4rem; font-size:0.78rem; color:var(--grey-200); }
    .part-label { color: var(--grey-200); }
    .part-pct { color: var(--white); font-size:0.7rem; }
    .quick-actions { display:flex; gap:0.75rem; flex-wrap:wrap; }
    .loading-msg, .empty-state { color:var(--grey-400); font-size:0.82rem; padding:1rem 0; font-family:var(--mono); line-height:1.6; }
  `]
})
export class DashboardComponent implements OnInit {
  summary: DashboardSummary | null = null;
  progress: Record<string, { total: number; completed: number; pct: number }> | null = null;

  partList = [
    { key: 'partA', label: 'Part A — Tamil Eligibility Test (50 marks)', color: 'green' },
    { key: 'partB', label: 'Part B — Technical & Analytical (70 marks)',   color: 'yellow' },
    { key: 'partC', label: 'Part C — Skill Test (50 marks)',  color: 'blue' },
    { key: 'partD', label: 'Part D — Viva-Voce (25 marks)', color: '' }
  ];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getDashboardSummary().subscribe({ next: s => this.summary = s, error: () => {} });
    this.api.getProgressOverview().subscribe({ next: p => this.progress = p as any, error: () => {} });
  }
}
