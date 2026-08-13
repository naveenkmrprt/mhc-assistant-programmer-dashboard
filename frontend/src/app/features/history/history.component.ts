import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { DailyLog, QuizSession } from '../../core/models/models';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">PERFORMANCE HISTORY</h1>
          <p class="page-sub">Every session. Every score. No hiding from the data.</p>
        </div>
      </div>

      <!-- 30-Day Score Chart (CSS-based sparkline) -->
      <div class="card" style="margin-bottom:1.5rem;">
        <div class="card-title">30-DAY SCORE TREND</div>
        @if (logs.length) {
          <div class="chart-area">
            @for (log of logs; track log.id) {
              <div class="chart-bar-wrap" [title]="log.logDate + ': ' + (log.score | number:'1.2-2')">
                <div class="chart-bar"
                  [style.height.%]="barHeight(log.score)"
                  [class.high]="log.score >= 70"
                  [class.mid]="log.score >= 50 && log.score < 70"
                  [class.low]="log.score < 50">
                </div>
                <div class="chart-label">{{ log.logDate | slice:5 }}</div>
              </div>
            }
          </div>
          <div class="chart-legend">
            <span class="legend-item high">≥70 Good</span>
            <span class="legend-item mid">50-70 OK</span>
            <span class="legend-item low">&lt;50 Grind More</span>
          </div>
        } @else {
          <div class="empty-state">No history yet. Complete a quiz session to start tracking.</div>
        }
      </div>

      <!-- Sessions Table -->
      <div class="card">
        <div class="card-title">ALL QUIZ SESSIONS</div>
        @if (sessions.length) {
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>DATE</th>
                <th>TYPE</th>
                <th>QUESTIONS</th>
                <th>CORRECT</th>
                <th>WRONG</th>
                <th>SCORE</th>
                <th>ACCURACY</th>
                <th>WEAK TOPICS</th>
              </tr>
            </thead>
            <tbody>
              @for (s of sessions; track s.id; let i = $index) {
                <tr>
                  <td class="mono" style="color:var(--grey-500)">{{ i + 1 }}</td>
                  <td class="mono" style="font-size:0.75rem">{{ s.startedAt | slice:0:10 }}</td>
                  <td><span class="badge" [class]="s.sessionType === 'MOCK_EXAM' ? 'badge-red' : 'badge-yellow'">
                    {{ s.sessionType }}</span></td>
                  <td class="mono">{{ s.totalQuestions }}</td>
                  <td class="mono" style="color:var(--green)">{{ s.correctAnswers }}</td>
                  <td class="mono" style="color:var(--red)">{{ s.wrongAnswers }}</td>
                  <td class="mono" [style.color]="s.rawScore >= 70 ? 'var(--green)' : s.rawScore < 0 ? 'var(--red)' : 'var(--white)'">
                    {{ s.rawScore | number:'1.2-2' }}
                  </td>
                  <td class="mono" [style.color]="s.accuracyPct >= 70 ? 'var(--green)' : 'var(--yellow)'">
                    {{ s.accuracyPct | number:'1.1-1' }}%
                  </td>
                  <td style="font-size:0.7rem; color:var(--grey-400); max-width:200px;">
                    {{ formatWeakTopics(s.weakTopicsJson) }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <div class="empty-state">No sessions recorded yet.</div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.5rem; }
    .page-title  { font-family:var(--mono); font-size:1.4rem; margin-bottom:0.3rem; }
    .page-sub    { font-size:0.78rem; color:var(--grey-400); }
    .empty-state { color:var(--grey-400); font-size:0.82rem; padding:1rem 0; font-family:var(--mono); }

    /* Bar Chart */
    .chart-area {
      display:flex; align-items:flex-end; gap:4px;
      height:120px; padding-top:1rem;
      overflow-x:auto;
    }
    .chart-bar-wrap { display:flex; flex-direction:column; align-items:center; gap:4px; min-width:24px; flex:1; }
    .chart-bar { width:100%; min-height:2px; transition:height 0.4s ease; }
    .chart-bar.high { background:var(--green); }
    .chart-bar.mid  { background:var(--yellow); }
    .chart-bar.low  { background:var(--red); }
    .chart-label { font-family:var(--mono); font-size:0.5rem; color:var(--grey-500); writing-mode:vertical-rl; transform:rotate(180deg); }
    .chart-legend { display:flex; gap:1rem; margin-top:0.75rem; font-size:0.65rem; font-family:var(--mono); }
    .legend-item.high { color:var(--green); }
    .legend-item.mid  { color:var(--yellow); }
    .legend-item.low  { color:var(--red); }
  `]
})
export class HistoryComponent implements OnInit {
  sessions: QuizSession[] = [];
  logs: DailyLog[] = [];
  maxScore = 100;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getAllSessions().subscribe({ next: s => this.sessions = s, error: () => {} });
    this.api.getLast30DaysLogs().subscribe({
      next: l => {
        this.logs = l;
        this.maxScore = Math.max(...l.map(x => x.score), 1);
      },
      error: () => {}
    });
  }

  barHeight(score: number): number {
    return Math.max(2, Math.round((score / this.maxScore) * 100));
  }

  formatWeakTopics(json: string): string {
    try {
      const arr: string[] = JSON.parse(json);
      return arr.length ? arr.slice(0, 3).join(', ') + (arr.length > 3 ? '...' : '') : '—';
    } catch { return '—'; }
  }
}
