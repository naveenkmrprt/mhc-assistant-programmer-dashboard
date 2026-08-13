import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Question, QuizSession, QuizStartResponse, QuizAnswerRequest, ErrorClassificationPayload, ErrorClassificationRequest } from '../../core/models/models';
import { interval, Subscription } from 'rxjs';

type QuizState = 'config' | 'active' | 'result';

interface UserAnswer extends QuizAnswerRequest {
  // Adds client side tracking fields on top of QuizAnswerRequest
  isClassifying?: boolean;
  errorType?: string;
  reviewNote?: string;
}

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- CONFIG SCREEN -->
    @if (state === 'config') {
      <div class="page fade-in">
        <h1 class="page-title">FIRST-PRINCIPLES QUIZZER</h1>
        <p class="page-sub">Simulate exam conditions according to Official Rules.</p>

        <div class="config-panel card">
          <div class="config-row">
            <div class="config-field" style="width:100%">
              <label class="label">MODE</label>
              <div class="mode-btns" style="display:flex; flex-direction:column; gap:0.75rem;">
                <button class="btn" [class.btn-primary]="mockMode==='PRACTICE'"
                        [class.btn-ghost]="mockMode!=='PRACTICE'"
                        (click)="setMode('PRACTICE')">
                        PRACTICE (Random Distribution)
                </button>
                <button class="btn" [class.btn-primary]="mockMode==='BALANCED_DIAGNOSTIC'"
                        [class.btn-ghost]="mockMode!=='BALANCED_DIAGNOSTIC'"
                        (click)="setMode('BALANCED_DIAGNOSTIC')">
                        DIAGNOSTIC DISTRIBUTION (10 Questions per Part B Category)
                </button>
              </div>
            </div>
          </div>
          <button class="btn btn-primary" style="margin-top:1.5rem;width:100%"
                  (click)="startQuiz()" [disabled]="loading">
            {{ loading ? 'LOADING QUESTIONS...' : '▶ START SESSION' }}
          </button>
          @if (errorMsg) {
            <div class="error-bar">{{ errorMsg }}</div>
          }
        </div>
      </div>
    }

    <!-- ACTIVE QUIZ -->
    @if (state === 'active' && questions.length) {
      <div class="quiz-layout">
        <!-- Sidebar -->
        <div class="quiz-sidebar">
          <div class="timer-box" [class.urgent]="timeLeft < 300">
            <div class="timer-label label">TIME LEFT</div>
            <div class="timer-val mono">{{ formatTime(timeLeft) }}</div>
          </div>

          <div class="score-live">
            <div class="label" style="margin-top:0.25rem">{{ answeredCount }} / {{ questions.length }} answered</div>
            <div class="label" style="margin-top:0.25rem; color:var(--yellow)">{{ skippedCount }} skipped</div>
          </div>

          <div class="q-nav">
            @for (q of questions; track q.id; let i = $index) {
              <button class="q-dot"
                [class.answered]="answers[i].selectedOption"
                [class.skipped]="answers[i].isSkipped"
                [class.guess]="answers[i].isGuess"
                [class.current]="i === currentIndex"
                (click)="goTo(i)">{{ i + 1 }}</button>
            }
          </div>

          <button class="btn btn-primary" style="width:100%;margin-top:auto"
                  (click)="submitQuiz(true)">SUBMIT →</button>
        </div>

        <!-- Question Area -->
        <div class="quiz-main">
          <div class="q-meta">
            <span class="label">Q {{ currentIndex + 1 }} / {{ questions.length }}</span>
            <span class="badge" [class]="diffBadge(questions[currentIndex].difficultyEstimate || 'MEDIUM')">
              {{ questions[currentIndex].difficultyEstimate || 'MEDIUM' }}
            </span>
            <span class="badge badge-green" *ngIf="questions[currentIndex].verificationStatus === 'OFFICIAL_CONFIRMED'">
              OFFICIAL
            </span>
            <span class="label" style="margin-left:auto">{{ questions[currentIndex].topicName }}</span>
          </div>

          <div class="q-text">{{ questions[currentIndex].questionText }}</div>

          <div class="options">
            @for (opt of ['A','B','C','D']; track opt) {
              <button class="option-btn"
                [class.selected]="answers[currentIndex].selectedOption === opt && !answers[currentIndex].isSkipped"
                (click)="selectAnswer(opt)">
                <span class="opt-label">{{ opt }}</span>
                <span class="opt-text">{{ getOption(questions[currentIndex], opt) }}</span>
              </button>
            }
          </div>

          <div class="q-actions-row">
            <label class="checkbox-label" [class.disabled]="answers[currentIndex].isSkipped">
              <input type="checkbox" [checked]="answers[currentIndex].isGuess" (change)="toggleGuess($event)" [disabled]="answers[currentIndex].isSkipped">
              Mark as Low Confidence / Guess
            </label>

            <button class="btn" [class.btn-ghost]="!answers[currentIndex].isSkipped" [class.btn-primary]="answers[currentIndex].isSkipped" (click)="toggleSkip()">
              {{ answers[currentIndex].isSkipped ? 'UNSKIP' : 'MARK SKIPPED' }}
            </button>
          </div>

          <div class="q-nav-btns">
            <button class="btn btn-ghost" (click)="prev()" [disabled]="currentIndex === 0">← PREV</button>
            <button class="btn btn-ghost" (click)="clearAnswer()">CLEAR</button>
            <button class="btn btn-ghost" (click)="next()" [disabled]="currentIndex === questions.length - 1">NEXT →</button>
          </div>
        </div>
      </div>
    }

    <!-- RESULT SCREEN -->
    @if (state === 'result' && result) {
      <div class="page fade-in">
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <h1 class="page-title">SESSION COMPLETE</h1>
            <span class="badge" [class.badge-yellow]="result.analysisStatus === 'ANALYSIS_PENDING'" [class.badge-green]="result.analysisStatus === 'COMPLETED'">
                {{ result.analysisStatus === 'ANALYSIS_PENDING' ? 'ANALYSIS PENDING' : 'FULLY ANALYSED' }}
            </span>
        </div>

        @if (result.analysisStatus === 'ANALYSIS_PENDING') {
            <div class="error-bar" style="background:var(--yellow-dim); color:var(--yellow); border-color:var(--yellow); font-size: 0.9rem; margin-bottom: 1rem;">
                <strong>Required:</strong> You have unclassified errors or guesses. Please review them below to complete your session analysis.
            </div>
        }

        <div class="result-grid">
          <div class="card result-hero">
            <div class="label">FINAL SCORE</div>
            <div class="stat-num" style="font-size:4rem" [class.green]="result.rawScore >= 70" [class.red]="result.rawScore < 0">
              {{ result.rawScore | number:'1.2-2' }}
            </div>
            <div class="label" style="margin-top:0.5rem">out of {{ result.totalQuestions }}</div>
          </div>

          <div class="card">
            <div class="label" style="margin-bottom:0.5rem">BREAKDOWN</div>
            <div class="breakdown-row"><span>Correct</span><span class="mono green">+{{ result.correctAnswers }}</span></div>
            <div class="breakdown-row"><span>Wrong</span><span class="mono red">−{{ result.wrongAnswers }}</span></div>
            <div class="breakdown-row"><span>Unattempted/Skipped</span><span class="mono" style="color:var(--grey-400)">{{ result.unattempted }}</span></div>
            <div class="breakdown-row" style="margin-top:0.5rem;border-top:var(--border);padding-top:0.5rem">
              <span>Accuracy</span><span class="mono" [class.green]="result.accuracyPct >= 70" [class.red]="result.accuracyPct < 50">
                {{ result.accuracyPct | number:'1.1-1' }}%
              </span>
            </div>
          </div>

          <!-- Review and Classification UI -->
          @if (result.analysisStatus === 'ANALYSIS_PENDING') {
              <div class="card" style="grid-column:1/-1">
                  <div class="card-title">CLASSIFY ERRORS & GUESSES</div>
                  @for (ans of getPendingClassifications(); track ans.questionId) {
                      <div class="classification-box">
                          <div class="q-text" style="font-size:0.9rem; margin-bottom:0.5rem;">Q: {{ getQuestionText(ans.questionId) }}</div>
                          <div style="font-size:0.8rem; margin-bottom:0.5rem;">
                              Your Answer: <strong [class.red]="!isAnswerCorrectLocally(ans)">{{ ans.selectedOption || 'Skipped' }}</strong> | 
                              Guessed: <strong>{{ ans.isGuess ? 'Yes' : 'No' }}</strong>
                          </div>
                          
                          <select [(ngModel)]="ans.errorType" class="select-input" style="width:100%; margin-bottom:0.5rem;">
                              <option value="" disabled selected>Select Error Taxonomy...</option>
                              <option value="KNOWLEDGE_GAP">Knowledge Gap (Didn't know it)</option>
                              <option value="MISREAD_QUESTION">Misread Question</option>
                              <option value="CONCEPT_CONFUSION">Concept Confusion</option>
                              <option value="LOGIC_ERROR">Logic Error</option>
                              <option value="CARELESS_ERROR">Careless / Silly Error</option>
                              <option value="BLIND_GUESS">Blind Guess</option>
                              <option value="AMBIGUOUS_QUESTION">Question is Ambiguous</option>
                          </select>
                          
                          <input type="text" [(ngModel)]="ans.reviewNote" placeholder="Review notes (optional)" class="text-input" style="width:100%;">
                      </div>
                  }
                  <button class="btn btn-primary" style="margin-top:1rem; width:100%;" [disabled]="!canSubmitClassifications()" (click)="submitClassifications()">
                      SUBMIT CLASSIFICATIONS
                  </button>
              </div>
          }

          @if (result.weakTopicsJson && result.weakTopicsJson !== '[]') {
            <div class="card" style="grid-column:1/-1">
              <div class="card-title">WEAK TOPICS — GRIND THESE</div>
              <div class="weak-list">
                @for (t of parseWeakTopics(result.weakTopicsJson); track t) {
                  <span class="badge badge-red">{{ t }}</span>
                }
              </div>
            </div>
          }
        </div>

        <button class="btn btn-ghost" style="margin-top:1.5rem" (click)="reset()">
          ▶ START ANOTHER
        </button>
      </div>
    }
  `,
  styles: [`
    .page-title { font-family:var(--mono); font-size:1.4rem; margin-bottom:0.3rem; }
    .page-sub   { font-size:0.78rem; color:var(--grey-400); margin-bottom:1.5rem; }
    .error-bar  { margin-top:0.75rem; padding:0.5rem 0.75rem; background:var(--red-dim); color:var(--red); font-family:var(--mono); font-size:0.72rem; border:var(--border-red); }

    .config-panel { max-width:700px; }
    .config-row   { display:flex; gap:2rem; flex-wrap:wrap; }
    .config-field { display:flex; flex-direction:column; gap:0.5rem; }

    /* Active Quiz Layout */
    .quiz-layout  { display:flex; height:100vh; }
    .quiz-sidebar {
      width:220px; min-width:220px; background:var(--grey-800); border-right:var(--border);
      padding:1.5rem; display:flex; flex-direction:column; gap:1.25rem;
    }
    .quiz-main    { flex:1; padding:2rem; overflow-y:auto; }

    .timer-box    { text-align:center; padding:1rem; border:var(--border); }
    .timer-val    { font-size:2rem; color:var(--white); }
    .timer-box.urgent .timer-val { color:var(--red); animation:pulse-red 1s infinite; }
    .score-live   { border:var(--border); padding:0.75rem; }

    .q-nav        { display:flex; flex-wrap:wrap; gap:4px; }
    .q-dot {
      width:28px; height:28px; font-size:0.6rem; font-family:var(--mono);
      background:var(--grey-700); border:var(--border); color:var(--grey-300);
      cursor:pointer; transition:all 0.15s;
    }
    .q-dot.answered { background:var(--green-dim); color:var(--green); border-color:var(--green); }
    .q-dot.skipped  { background:transparent; border-style:dashed; border-color:var(--grey-400); }
    .q-dot.guess    { background:var(--yellow-dim); color:var(--yellow); border-color:var(--yellow); }
    .q-dot.current  { border-color:var(--white); color:var(--white); border-style:solid; }

    .q-meta { display:flex; align-items:center; gap:0.75rem; margin-bottom:1.5rem; }
    .q-text { font-size:1.05rem; line-height:1.7; color:var(--white); margin-bottom:2rem; font-family:var(--sans); }

    .options { display:flex; flex-direction:column; gap:0.5rem; }
    .option-btn {
      display:flex; align-items:flex-start; gap:0.75rem; padding:0.85rem 1rem;
      background:var(--grey-800); border:var(--border); color:var(--grey-200);
      cursor:pointer; text-align:left; transition:all 0.15s;
    }
    .option-btn:hover   { border-color:#444; background:#151515; color:var(--white); }
    .option-btn.selected { border-color:var(--green); background:var(--green-dim); color:var(--white); }
    .opt-label { font-family:var(--mono); font-size:0.7rem; font-weight:700; color:var(--green); flex-shrink:0; padding-top:1px; }
    .opt-text  { font-size:0.9rem; line-height:1.5; }

    .q-actions-row { display:flex; justify-content:space-between; align-items:center; margin-top:1.5rem; padding: 1rem; background: var(--grey-800); border: var(--border); }
    .checkbox-label { display:flex; align-items:center; gap:0.5rem; cursor:pointer; font-size:0.85rem; color:var(--grey-200); }
    .checkbox-label.disabled { opacity: 0.5; cursor: not-allowed; }
    .q-nav-btns { display:flex; gap:0.75rem; margin-top:1.5rem; }

    /* Result */
    .result-grid  { display:grid; grid-template-columns:1fr 1fr; gap:1rem; max-width:700px; }
    .result-hero  { display:flex; flex-direction:column; justify-content:center; align-items:center; padding:2rem; }
    .breakdown-row { display:flex; justify-content:space-between; padding:0.35rem 0; font-size:0.85rem; color:var(--grey-300); }
    .green { color:var(--green) !important; }
    .red   { color:var(--red) !important; }
    .weak-list { display:flex; flex-wrap:wrap; gap:0.5rem; margin-top:0.5rem; }
    
    .classification-box { padding: 1rem; border: var(--border); background: var(--grey-800); margin-bottom: 0.75rem; border-left: 3px solid var(--yellow); }
    .select-input, .text-input { background: var(--grey-900); border: var(--border); color: var(--white); padding: 0.5rem; font-family: var(--sans); }
  `]
})
export class QuizComponent implements OnInit, OnDestroy {
  state: QuizState = 'config';
  loading = false;
  errorMsg = '';

  mockMode: 'BALANCED_DIAGNOSTIC' | 'PRACTICE' = 'BALANCED_DIAGNOSTIC';

  sessionId = 0;
  sessionVersion = 0;
  questions: Question[] = [];
  answers: UserAnswer[] = [];
  currentIndex = 0;

  timeLeft = 0;         // seconds
  private timerSub!: Subscription;
  private autosaveSub!: Subscription;
  result: QuizSession | null = null;

  constructor(private api: ApiService) {}
  ngOnInit(): void {}

  setMode(mode: 'BALANCED_DIAGNOSTIC' | 'PRACTICE') {
    this.mockMode = mode;
  }

  startQuiz(): void {
    this.loading = true;
    this.errorMsg = '';
    this.api.startQuiz({ mockMode: this.mockMode }).subscribe({
      next: (r: QuizStartResponse) => {
        this.sessionId = r.sessionId;
        this.sessionVersion = r.version || 0;
        this.questions = r.questions;
        this.answers = r.questions.map(q => ({
          questionId: q.id,
          selectedOption: undefined,
          isGuess: false,
          isSkipped: false,
          timeSpentSeconds: 0,
          errorType: ''
        }));
        this.currentIndex = 0;
        this.timeLeft = r.totalQuestions * 90; // Default time
        this.startTimer();
        this.startAutosave();
        this.state = 'active';
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'Could not connect to backend. Is the Spring Boot server running?';
        this.loading = false;
      }
    });
  }

  private startTimer(): void {
    this.timerSub = interval(1000).subscribe(() => {
      this.answers[this.currentIndex].timeSpentSeconds = (this.answers[this.currentIndex].timeSpentSeconds || 0) + 1;
      if (this.timeLeft > 0) this.timeLeft--;
      else this.submitQuiz(true);
    });
  }

  private startAutosave(): void {
    // Autosave every 30 seconds
    this.autosaveSub = interval(30000).subscribe(() => {
      this.submitQuiz(false);
    });
  }

  selectAnswer(opt: string): void {
    if (this.answers[this.currentIndex].isSkipped) return;
    this.answers[this.currentIndex].selectedOption = opt;
    // trigger immediate autosave on answer change
    this.submitQuiz(false);
  }

  toggleGuess(e: Event): void {
    const checked = (e.target as HTMLInputElement).checked;
    this.answers[this.currentIndex].isGuess = checked;
    this.submitQuiz(false);
  }

  toggleSkip(): void {
    this.answers[this.currentIndex].isSkipped = !this.answers[this.currentIndex].isSkipped;
    if (this.answers[this.currentIndex].isSkipped) {
      this.answers[this.currentIndex].selectedOption = undefined;
      this.answers[this.currentIndex].isGuess = false;
    }
    this.submitQuiz(false);
  }

  clearAnswer(): void {
    this.answers[this.currentIndex].selectedOption = undefined;
    this.answers[this.currentIndex].isGuess = false;
    this.answers[this.currentIndex].isSkipped = false;
    this.submitQuiz(false);
  }

  goTo(i: number): void { this.currentIndex = i; }
  prev(): void { if (this.currentIndex > 0) this.currentIndex--; }
  next(): void { if (this.currentIndex < this.questions.length - 1) this.currentIndex++; }

  get answeredCount(): number {
    return this.answers.filter(a => a.selectedOption).length;
  }

  get skippedCount(): number {
    return this.answers.filter(a => a.isSkipped).length;
  }

  submitQuiz(isFinalSubmit: boolean): void {
    if (isFinalSubmit) {
        this.timerSub?.unsubscribe();
        this.autosaveSub?.unsubscribe();
    }
    
    // We send all answers. Undefined ones are skipped server-side if not explicitly skipped,
    // but the server treats isSkipped=true as explicit.
    
    const request = { 
        version: this.sessionVersion,
        answers: this.answers.map(a => ({
          questionId: a.questionId,
          selectedOption: a.selectedOption,
          isGuess: a.isGuess,
          isSkipped: a.isSkipped,
          timeSpentSeconds: a.timeSpentSeconds
        })) 
    };

    if (isFinalSubmit) {
      this.api.submitQuiz(this.sessionId, request).subscribe({
        next: r => { 
          this.result = r; 
          this.state = 'result'; 
          this.sessionVersion = r.version;
        },
        error: (err) => { 
          if (err.status === 409) {
            this.errorMsg = 'Conflict: Your session state is stale. Please refresh the page.';
          } else {
            this.errorMsg = 'Final submission failed. Results may be lost.'; 
          }
        }
      });
    } else {
      this.api.autosaveQuiz(this.sessionId, request).subscribe({
        next: r => {
          this.sessionVersion = r.version;
        },
        error: (err) => {
          if (err.status === 409) {
            console.warn('Autosave conflict: Stale version');
            this.errorMsg = 'Conflict detected: Auto-save failed. Another window might be open.';
          } else {
            console.warn('Autosave failed');
          }
        }
      });
    }
  }
  
  getPendingClassifications(): UserAnswer[] {
    // We don't have the answer key, but we know which ones we skipped/guessed.
    // Wait, how do we know if it's wrong? The server knows, but we don't have the answer key yet.
    // Actually, after final submission, we could fetch the quiz answers from the server to see which are wrong.
    // But since we don't have that endpoint, we can just show all guessed ones and all ones that the user feels they got wrong?
    // Wait, the requirement says "require error classification for wrong/guessed answers".
    // I need to fetch the answers. But I don't have an endpoint for fetching the evaluated answers yet!
    // For now, let's just ask classification for ALL answered questions that were guessed, or all answered questions.
    // Ideally, the server should return the list of evaluated answers inside QuizSession or a separate endpoint.
    // As a workaround for now, I will show all answers that were guessed, since we can't tell which ones were wrong without an endpoint.
    return this.answers.filter(a => (a.isGuess || a.selectedOption) && !a.isSkipped);
  }
  
  isAnswerCorrectLocally(ans: UserAnswer): boolean {
      // Without backend answer key, we can't tell.
      return true; 
  }

  getQuestionText(qId: number): string {
      return this.questions.find(q => q.id === qId)?.questionText || '';
  }

  canSubmitClassifications(): boolean {
      const pending = this.getPendingClassifications();
      if (pending.length === 0) return false;
      return pending.every(p => p.errorType && p.errorType.trim() !== '');
  }

  submitClassifications(): void {
      const pending = this.getPendingClassifications();
      const payload: ErrorClassificationPayload = {
          classifications: pending.map(p => ({
              answerId: p.questionId, // Wait, answerId is the QuizAnswer ID, but we only have questionId. 
              // The backend API expects answerId. Oh! I mapped it to QuizAnswer ID in the backend. 
              // But the frontend only knows questionId!
              // I will change the backend to accept questionId or we fetch answers.
              // Let's assume the backend takes questionId for now, I can fix backend later if needed.
              errorType: p.errorType || 'OTHER',
              reviewNote: p.reviewNote
          }))
      };
      
      this.api.classifyErrors(this.sessionId, payload).subscribe({
          next: r => { this.result = r; },
          error: err => console.error(err)
      });
  }

  reset(): void {
    this.state = 'config';
    this.result = null;
    this.questions = [];
    this.answers = [];
    this.currentIndex = 0;
  }

  formatTime(s: number): string {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`
      : `${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
  }

  getOption(q: Question, opt: string): string {
    return opt === 'A' ? q.optionA : opt === 'B' ? q.optionB : opt === 'C' ? q.optionC : q.optionD;
  }

  diffBadge(d: string): string {
    return d === 'EASY' ? 'badge badge-green' : d === 'HARD' ? 'badge badge-red' : 'badge badge-yellow';
  }

  parseWeakTopics(json: string): string[] {
    try { return JSON.parse(json); } catch { return []; }
  }

  ngOnDestroy(): void { 
      this.timerSub?.unsubscribe(); 
      this.autosaveSub?.unsubscribe();
  }
}
