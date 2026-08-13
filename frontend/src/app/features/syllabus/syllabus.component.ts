import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { SyllabusCategory, SubTopic } from '../../core/models/models';

@Component({
  selector: 'app-syllabus',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="max-width:900px; margin:0 auto; padding-bottom:3rem;">
      <div class="page-header">
        <div>
          <h1 class="page-title">SYLLABUS TRACKER</h1>
          <div class="page-sub">Mark sub-topics as done. Expand categories. No mercy.</div>
        </div>
        <div class="overall-badge">
          <span class="stat-num" style="font-size:2.5rem"
                [class.green]="overallPct >= 70"
                [class.red]="overallPct < 30">
            {{ overallPct }}%
          </span>
          <span class="label" style="display:block">OVERALL</span>
        </div>
      </div>

      <!-- Ingest Panel -->
      <div class="card" style="margin-bottom:1.5rem;">
        <div class="card-title">BULK QUESTION IMPORT</div>
        <div class="ingest-row">
          <textarea [(ngModel)]="ingestText" rows="4"
            placeholder="Q: What is DBMS?&#10;A: Database Management System&#10;B: Data Backend Module System&#10;C: Distributed Backend Management&#10;D: None&#10;ANS: A&#10;TOPIC: DBMS Concepts & Architecture&#10;---&#10;Q: Next question..."></textarea>
          <div class="ingest-actions">
            <button class="btn btn-primary" (click)="ingestText_()" [disabled]="!ingestText.trim() || ingesting">
              {{ ingesting ? 'SAVING...' : '■ INGEST TEXT' }}
            </button>
            <label class="btn btn-ghost" style="cursor:pointer">
              ■ UPLOAD .TXT
              <input type="file" accept=".txt" (change)="onFileSelect($event)" style="display:none">
            </label>
          </div>
        </div>
        @if (ingestResult) {
          <div class="ingest-result" [class.success]="ingestResult.success">
            {{ ingestResult.message }}
          </div>
        }
      </div>

      <!-- Part Panels -->
      @for (part of ['A','B','C','D']; track part) {
        <div class="card" style="margin-bottom:1rem;">
          <div class="part-head">
            <div>
              <div class="card-title">PART-{{ part }} — {{ partMeta[part].label }}</div>
              <div class="progress-track" style="width:200px;">
                <div class="progress-fill" [class]="partMeta[part].color"
                     [style.width.%]="partPct[part] ?? 0"></div>
              </div>
            </div>
            <span class="stat-num" style="font-size:1.8rem"
                  [class.green]="(partPct[part]??0) >= 70"
                  [class.red]="(partPct[part]??0) < 30">
              {{ partPct[part] ?? 0 }}%
            </span>
          </div>

          <div class="accordion-list">
            @for (cat of categoriesByPart[part] ?? []; track cat.id) {
              <details class="accordion-item" [open]="part === 'B'">
                <summary class="accordion-header">
                  <span class="cat-name">{{ cat.name }}</span>
                  <div style="display:flex; gap: 0.5rem; align-items:center;">
                    @if (cat.negativeMarking) {
                      <span class="badge badge-red" style="font-size:0.55rem">-0.25 NEG</span>
                    }
                    <span class="badge" style="font-size:0.55rem">{{ cat.totalMarks }}M</span>
                  </div>
                </summary>
                <div class="accordion-content topic-grid">
                  @for (t of cat.subTopics; track t.id) {
                    <div class="topic-item" [class.done]="t.isCompleted" (click)="toggleTopic(t, cat)">
                      <span class="topic-check">{{ t.isCompleted ? '■' : '□' }}</span>
                      <span class="topic-name">{{ t.name }}</span>
                    </div>
                  }
                  @if (!cat.subTopics || cat.subTopics.length === 0) {
                     <div style="color:var(--grey-500); font-size:0.8rem; padding:0.5rem;">No sub-topics explicitly listed.</div>
                  }
                </div>
              </details>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.5rem; }
    .page-title  { font-family:var(--mono); font-size:1.4rem; color:var(--white); margin-bottom:0.3rem; }
    .page-sub    { font-size:0.78rem; color:var(--grey-400); }
    .overall-badge { text-align:right; }

    .ingest-row { display:grid; grid-template-columns:1fr auto; gap:1rem; align-items:flex-start; }
    .ingest-actions { display:flex; flex-direction:column; gap:0.5rem; }
    .ingest-result { margin-top:0.75rem; padding:0.5rem 0.75rem; font-family:var(--mono); font-size:0.72rem;
      background:var(--green-dim); color:var(--green); border:1px solid var(--green); }
    .ingest-result:not(.success) { background:var(--red-dim); color:var(--red); border-color:var(--red); }

    .part-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; }

    /* Accordion styles */
    .accordion-list { display:flex; flex-direction:column; gap:0.5rem; }
    .accordion-item { border: 1px solid var(--grey-800); background: #0a0a0a; border-radius: 2px; }
    .accordion-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0.75rem 1rem; cursor: pointer; color: var(--grey-200); font-family: var(--mono);
      font-size: 0.85rem; user-select: none;
    }
    .accordion-header:hover { background: #111; color: var(--white); }
    .accordion-header::-webkit-details-marker { display:none; }
    .cat-name { font-weight: 500; }
    .accordion-content { padding: 1rem; border-top: 1px solid var(--grey-800); background: #050505; }

    .topic-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(280px,1fr)); gap:0.4rem; }
    .topic-item {
      display:flex; align-items:center; gap:0.6rem;
      padding:0.5rem 0.75rem;
      border:1px solid #1a1a1a;
      cursor:pointer; font-size:0.8rem; color:var(--grey-300);
      transition:border-color 0.15s, background 0.15s;
    }
    .topic-item:hover { border-color:#333; background:#111; color:var(--white); }
    .topic-item.done  { background:rgba(22,163,74,0.06); border-color:rgba(22,163,74,0.2); color:var(--green); }
    .topic-check { font-size:0.9rem; flex-shrink:0; }
    .topic-name  { flex:1; line-height:1.3; }
  `]
})
export class SyllabusComponent implements OnInit {
  categories: SyllabusCategory[] = [];
  categoriesByPart: Record<string, SyllabusCategory[]> = {};
  partPct: Record<string, number> = {};
  overallPct = 0;

  ingestText = '';
  ingesting = false;
  ingestResult: { success: boolean; message: string } | null = null;

  partMeta: Record<string, { label: string; color: string }> = {
    A: { label: 'Tamil Eligibility Test (50 Marks)',         color: 'green' },
    B: { label: 'Technical Section (70 Marks)',              color: 'yellow' },
    C: { label: 'Skill Test (50 Marks)',                     color: 'blue' },
    D: { label: 'Viva-Voce (25 Marks)',                      color: '' }
  };

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.loadTopics(); }

  loadTopics(): void {
    this.api.getAllTopics().subscribe((categories: SyllabusCategory[]) => {
      this.categories = categories;
      this.categoriesByPart = {};
      ['A','B','C','D'].forEach(p => {
        const partCats = categories.filter(c => c.part === p);
        this.categoriesByPart[p] = partCats;

        let totalSubTopics = 0;
        let completedSubTopics = 0;
        partCats.forEach(c => {
          totalSubTopics += c.subTopics?.length || 0;
          completedSubTopics += (c.subTopics || []).filter(s => s.isCompleted).length;
        });

        this.partPct[p] = totalSubTopics > 0 ? Math.round((completedSubTopics / totalSubTopics) * 100) : 0;
      });

      let grandTotal = 0;
      let grandDone = 0;
      categories.forEach(c => {
        grandTotal += c.subTopics?.length || 0;
        grandDone += (c.subTopics || []).filter(s => s.isCompleted).length;
      });
      this.overallPct = grandTotal > 0 ? Math.round((grandDone / grandTotal) * 100) : 0;
    });
  }

  toggleTopic(subTopic: SubTopic, category: SyllabusCategory): void {
    this.api.toggleTopic(subTopic.id).subscribe(updated => {
      subTopic.isCompleted = updated.isCompleted;
      this.recalculatePcts();
    });
  }

  recalculatePcts() {
    ['A','B','C','D'].forEach(p => {
      const partCats = this.categoriesByPart[p] || [];
      let total = 0;
      let done = 0;
      partCats.forEach(c => {
        total += c.subTopics?.length || 0;
        done += (c.subTopics || []).filter(s => s.isCompleted).length;
      });
      this.partPct[p] = total > 0 ? Math.round((done / total) * 100) : 0;
    });

    let grandTotal = 0;
    let grandDone = 0;
    this.categories.forEach(c => {
      grandTotal += c.subTopics?.length || 0;
      grandDone += (c.subTopics || []).filter(s => s.isCompleted).length;
    });
    this.overallPct = grandTotal > 0 ? Math.round((grandDone / grandTotal) * 100) : 0;
  }

  ingestText_(): void {
    if (!this.ingestText.trim()) return;
    this.ingesting = true;
    this.ingestResult = null;
    this.api.ingestFromText(this.ingestText).subscribe({
      next: r => {
        this.ingestResult = { success: true, message: `■ ${r.count} questions imported successfully.` };
        this.ingestText = '';
        this.ingesting = false;
      },
      error: () => {
        this.ingestResult = { success: false, message: '■ Ingestion failed. Check backend is running.' };
        this.ingesting = false;
      }
    });
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.api.ingestFromFile(input.files[0]).subscribe({
      next: r => this.ingestResult = { success: true, message: `■ ${r.count} questions from file imported.` },
      error: () => this.ingestResult = { success: false, message: '■ File upload failed.' }
    });
  }
}
