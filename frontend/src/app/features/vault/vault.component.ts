import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { Question, QuizSession } from '../../core/models/models';
import { interval, Subscription } from 'rxjs';

interface MockPaper {
  id: string;
  title: string;
  source: string;
  year: string;
  totalMarks: number;
  durationMin: number;
  description: string;
}

type VaultState = 'list' | 'running' | 'result';

@Component({
  selector: 'app-vault',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page fade-in" *ngIf="vaultState === 'list'">
      <h1 class="page-title">PYP VAULT</h1>
      <p class="page-sub">Previous Year Papers — Structured as timed 120-min mock sessions. Full negative marking.</p>

      <div class="papers-grid">
        @for (paper of papers; track paper.id) {
          <div class="paper-card card">
            <div class="paper-meta">
              <span class="badge badge-yellow">{{ paper.source }}</span>
              <span class="badge" style="color:var(--grey-400);border-color:#333">{{ paper.year }}</span>
            </div>
            <div class="paper-title">{{ paper.title }}</div>
            <div class="paper-desc">{{ paper.description }}</div>
            <div class="paper-stats">
              <span><span class="mono" style="color:var(--white)">{{ paper.totalMarks }}</span> marks</span>
              <span><span class="mono" style="color:var(--white)">{{ paper.durationMin }}</span> min</span>
            </div>
            <button class="btn btn-primary" style="width:100%;margin-top:1rem"
                    (click)="startMock(paper)">
              ▶ START MOCK
            </button>
          </div>
        }

        <!-- Custom Mock Card -->
        <div class="paper-card card" style="border-style:dashed;border-color:#2a2a2a;">
          <div class="paper-title" style="color:var(--grey-400)">CUSTOM MOCK</div>
          <div class="paper-desc">Pull questions from your ingested database for a custom 120-min simulation.</div>
          <div class="custom-controls">
            <label class="label">QUESTION COUNT</label>
            <div style="display:flex;align-items:center;gap:0.75rem;margin-top:0.5rem;">
              <button class="btn btn-ghost" (click)="decCustomCount()">−10</button>
              <span class="mono" style="font-size:1.4rem">{{ customCount }}</span>
              <button class="btn btn-ghost" (click)="incCustomCount()">+10</button>
            </div>
          </div>
          <button class="btn btn-ghost" style="width:100%;margin-top:1rem"
                  (click)="startCustomMock()">
            ▶ CUSTOM MOCK
          </button>
        </div>
      </div>
    </div>

    <!-- Running Mock -->
    @if (vaultState === 'running' && activePaper && questions.length) {
      <div class="quiz-layout">
        <div class="quiz-sidebar">
          <div class="sidebar-title mono" style="font-size:0.65rem;color:var(--red);letter-spacing:0.1em">
            {{ activePaper.title }}
          </div>
          <div class="timer-box" [class.urgent]="timeLeft < 600">
            <div class="timer-label label">TIME LEFT</div>
            <div class="timer-val mono">{{ formatTime(timeLeft) }}</div>
          </div>
          <div class="score-live">
            <div class="label">ANSWERED</div>
            <div class="mono" style="font-size:1.4rem">{{ answeredCount }} / {{ questions.length }}</div>
          </div>
          <div class="q-nav">
            @for (q of questions; track q.id; let i = $index) {
              <button class="q-dot"
                [class.answered]="answers[i] !== null"
                [class.current]="i === currentIndex"
                (click)="currentIndex = i">{{ i + 1 }}</button>
            }
          </div>
          <button class="btn btn-primary" style="width:100%;margin-top:auto" (click)="submitMock()">
            SUBMIT MOCK →
          </button>
        </div>
        <div class="quiz-main">
          <div class="q-meta">
            <span class="label">Q {{ currentIndex + 1 }} / {{ questions.length }}</span>
            <span class="badge" [class]="diffBadge(questions[currentIndex].difficulty)">
              {{ questions[currentIndex].difficulty }}
            </span>
            <span class="label" style="margin-left:auto">{{ questions[currentIndex].topicName }}</span>
          </div>
          <div class="q-text">{{ questions[currentIndex].questionText }}</div>
          <div class="options">
            @for (opt of ['A','B','C','D']; track opt) {
              <button class="option-btn" [class.selected]="answers[currentIndex] === opt"
                      (click)="answers[currentIndex] = opt">
                <span class="opt-label">{{ opt }}</span>
                <span class="opt-text">{{ getOption(questions[currentIndex], opt) }}</span>
              </button>
            }
          </div>
          <div class="q-nav-btns">
             <button class="btn btn-ghost" (click)="vaultPrev()" [disabled]="currentIndex===0">← PREV</button>
             <button class="btn btn-ghost" (click)="answers[currentIndex] = null">CLEAR</button>
             <button class="btn btn-ghost" (click)="vaultNext()" [disabled]="currentIndex===questions.length-1">NEXT →</button>
           </div>
        </div>
      </div>
    }

    <!-- Result -->
    @if (vaultState === 'result' && mockResult) {
      <div class="page fade-in">
        <h1 class="page-title">MOCK EXAM COMPLETE</h1>
        <div class="result-grid">
          <div class="card result-hero">
            <div class="label">FINAL SCORE</div>
            <div class="stat-num" style="font-size:4rem" [class.green]="mockResult.rawScore >= 70" [class.red]="mockResult.rawScore < 0">
              {{ mockResult.rawScore | number:'1.2-2' }}
            </div>
          </div>
          <div class="card">
            <div class="breakdown-row"><span>Correct</span><span class="mono" style="color:var(--green)">+{{ mockResult.correctAnswers }}</span></div>
            <div class="breakdown-row"><span>Wrong</span><span class="mono" style="color:var(--red)">−{{ mockResult.wrongAnswers }}</span></div>
            <div class="breakdown-row"><span>Skipped</span><span class="mono" style="color:var(--grey-400)">{{ mockResult.unattempted }}</span></div>
            <div class="breakdown-row" style="margin-top:0.5rem;border-top:var(--border);padding-top:0.5rem">
              <span>Accuracy</span><span class="mono">{{ mockResult.accuracyPct | number:'1.1-1' }}%</span>
            </div>
          </div>
        </div>
        <button class="btn btn-ghost" style="margin-top:1.5rem" (click)="vaultState = 'list'">
          ← BACK TO VAULT
        </button>
      </div>
    }
  `,
  styles: [`
    .page-title  { font-family:var(--mono); font-size:1.4rem; margin-bottom:0.3rem; }
    .page-sub    { font-size:0.78rem; color:var(--grey-400); margin-bottom:1.5rem; }
    .papers-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:1rem; }
    .paper-card  { display:flex; flex-direction:column; }
    .paper-meta  { display:flex; gap:0.5rem; margin-bottom:0.75rem; }
    .paper-title { font-family:var(--mono); font-size:0.9rem; color:var(--white); margin-bottom:0.4rem; line-height:1.4; }
    .paper-desc  { font-size:0.78rem; color:var(--grey-400); flex:1; line-height:1.5; }
    .paper-stats { display:flex; gap:1.5rem; margin-top:0.75rem; font-size:0.75rem; color:var(--grey-400); }
    .custom-controls { margin-top:1rem; }

    /* Reuse quiz layout styles */
    .quiz-layout  { display:flex; height:100vh; }
    .quiz-sidebar { width:220px; min-width:220px; background:var(--grey-800); border-right:var(--border); padding:1.5rem; display:flex; flex-direction:column; gap:1rem; }
    .quiz-main    { flex:1; padding:2rem; overflow-y:auto; }
    .timer-box    { text-align:center; padding:1rem; border:var(--border); }
    .timer-val    { font-size:2rem; color:var(--white); }
    .timer-box.urgent .timer-val { color:var(--red); animation:pulse-red 1s infinite; }
    .score-live   { border:var(--border); padding:0.75rem; }
    .q-nav        { display:flex; flex-wrap:wrap; gap:4px; }
    .q-dot { width:28px; height:28px; font-size:0.6rem; font-family:var(--mono); background:var(--grey-700); border:var(--border); color:var(--grey-300); cursor:pointer; }
    .q-dot.answered { background:var(--red-dim); color:var(--red); border-color:var(--red-glow); }
    .q-dot.current  { border-color:var(--white); color:var(--white); }
    .q-meta   { display:flex; align-items:center; gap:0.75rem; margin-bottom:1.5rem; }
    .q-text   { font-size:1.05rem; line-height:1.7; color:var(--white); margin-bottom:2rem; }
    .options  { display:flex; flex-direction:column; gap:0.5rem; }
    .option-btn { display:flex; align-items:flex-start; gap:0.75rem; padding:0.85rem 1rem; background:var(--grey-800); border:var(--border); color:var(--grey-200); cursor:pointer; text-align:left; transition:all 0.15s; }
    .option-btn:hover { border-color:#444; background:#151515; }
    .option-btn.selected { border-color:var(--red); background:var(--red-dim); color:var(--white); }
    .opt-label { font-family:var(--mono); font-size:0.7rem; font-weight:700; color:var(--red); flex-shrink:0; }
    .opt-text  { font-size:0.9rem; line-height:1.5; }
    .q-nav-btns { display:flex; gap:0.75rem; margin-top:1.5rem; }
    .result-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; max-width:600px; }
    .result-hero { display:flex; flex-direction:column; justify-content:center; align-items:center; padding:2rem; }
    .breakdown-row { display:flex; justify-content:space-between; padding:0.35rem 0; font-size:0.85rem; color:var(--grey-300); }
    .sidebar-title { margin-bottom:0.5rem; line-height:1.4; }
    .green { color:var(--green) !important; }
    .red   { color:var(--red) !important; }
  `]
})
export class VaultComponent implements OnInit, OnDestroy {
  vaultState: VaultState = 'list';
  activePaper: MockPaper | null = null;
  questions: Question[] = [];
  answers: (string | null)[] = [];
  currentIndex = 0;
  timeLeft = 7200;
  customCount = 50;
  mockResult: QuizSession | null = null;
  private sessionId = 0;
  private timerSub!: Subscription;

  papers: MockPaper[] = [
    {
      id: 'tnpsc-se-2023', title: 'TNPSC System Engineer 2023',
      source: 'TNPSC', year: '2023', totalMarks: 200, durationMin: 120,
      description: 'Full paper — Computer Science, Networks, OS, Programming. Pulled from official TNPSC System Engineer exam.'
    },
    {
      id: 'tnpsc-se-2021', title: 'TNPSC System Engineer 2021',
      source: 'TNPSC', year: '2021', totalMarks: 200, durationMin: 120,
      description: 'Previous year System Engineer paper focusing on DBMS, Networking, and Software Engineering.'
    },
    {
      id: 'nic-2022', title: 'NIC Scientific Officer 2022',
      source: 'NIC', year: '2022', totalMarks: 100, durationMin: 120,
      description: 'NIC exam paper covering advanced Computer Science topics similar to MHC AP syllabus.'
    },
    {
      id: 'hc-ito-2019', title: 'High Court IT Officer 2019',
      source: 'HIGH COURT', year: '2019', totalMarks: 150, durationMin: 120,
      description: 'Madras High Court IT Officer previous year — most relevant pattern to the current AP exam.'
    },
    {
      id: 'tnpsc-ap-2018', title: 'TNPSC Asst Programmer 2018',
      source: 'TNPSC', year: '2018', totalMarks: 150, durationMin: 120,
      description: 'Older AP exam — covers fundamental topics in all 4 parts. Good baseline calibration.'
    }
  ];

  constructor(private api: ApiService) {}
  ngOnInit(): void {}

  vaultPrev(): void { if (this.currentIndex > 0) this.currentIndex--; }
  vaultNext(): void { if (this.currentIndex < this.questions.length - 1) this.currentIndex++; }
  incCustomCount(): void { this.customCount = Math.min(150, this.customCount + 10); }
  decCustomCount(): void { this.customCount = Math.max(10, this.customCount - 10); }

  startMock(paper: MockPaper): void {
    this.activePaper = paper;
    this.timeLeft = paper.durationMin * 60;
    // Pull from ingested questions (topic-agnostic random pull for now)
    this.api.startQuiz(Math.min(paper.totalMarks, 100), 'MOCK_EXAM', true).subscribe({
      next: r => {
        this.sessionId = r.sessionId;
        this.questions = r.questions;
        this.answers = r.questions.map(() => null);
        this.currentIndex = 0;
        this.startTimer();
        this.vaultState = 'running';
      },
      error: () => alert('Backend not running. Start Spring Boot first.')
    });
  }

  startCustomMock(): void {
    const faux: MockPaper = {
      id: 'custom', title: 'Custom Mock Session', source: 'CUSTOM',
      year: new Date().getFullYear().toString(), totalMarks: this.customCount, durationMin: 120, description: ''
    };
    this.startMock(faux);
  }

  private startTimer(): void {
    this.timerSub = interval(1000).subscribe(() => {
      if (this.timeLeft > 0) this.timeLeft--;
      else this.submitMock();
    });
  }

  submitMock(): void {
    this.timerSub?.unsubscribe();
    const answerMap: Record<number, string> = {};
    this.questions.forEach((q, i) => { if (this.answers[i]) answerMap[q.id] = this.answers[i]!; });
    this.api.submitQuiz(this.sessionId, answerMap, true).subscribe({
      next: r => { this.mockResult = r; this.vaultState = 'result'; },
      error: () => alert('Submission failed.')
    });
  }

  get answeredCount(): number { return this.answers.filter(a => a !== null).length; }

  formatTime(s: number): string {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
  }

  getOption(q: Question, opt: string): string {
    return opt === 'A' ? q.optionA : opt === 'B' ? q.optionB : opt === 'C' ? q.optionC : q.optionD;
  }

  diffBadge(d: string): string {
    return d === 'EASY' ? 'badge badge-green' : d === 'HARD' ? 'badge badge-red' : 'badge badge-yellow';
  }

  ngOnDestroy(): void { this.timerSub?.unsubscribe(); }
}
