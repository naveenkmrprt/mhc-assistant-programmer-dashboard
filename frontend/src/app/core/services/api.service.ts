import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  SyllabusCategory, Question, QuizSession, QuizStartResponse,
  DailyLog, DashboardSummary, IngestionResult, ProgressOverview
} from '../models/models';

/**
 * Central API service — all backend calls go through here.
 * baseUrl switches automatically between dev and prod via environment files.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  // ── Role Details ──────────────────────────────────────────────────────────
  getRoleDetails(): Observable<any> {
    return this.http.get<any>(`${this.base}/role/details`);
  }

  // ── Progress ─────────────────────────────────────────────────────────────
  getAllTopics(): Observable<SyllabusCategory[]> {
    return this.http.get<SyllabusCategory[]>(`${this.base}/progress/syllabus`);
  }

  getTopicsByPart(part: string): Observable<{ part: string; topics: SyllabusCategory[]; completionPct: number }> {
    return this.http.get<any>(`${this.base}/progress/part/${part}`);
  }

  toggleTopic(id: number): Observable<any> {
    return this.http.post<any>(`${this.base}/progress/topic/${id}/toggle`, {});
  }

  getProgressOverview(): Observable<ProgressOverview> {
    return this.http.get<ProgressOverview>(`${this.base}/progress/overview`);
  }

  // ── Quiz ─────────────────────────────────────────────────────────────────
  startQuiz(req: import('../models/models').QuizStartRequest): Observable<QuizStartResponse> {
    return this.http.post<QuizStartResponse>(`${this.base}/quiz/start`, req, {
      headers: { 'X-Session-Owner': 'dev-user-123' }
    });
  }

  autosaveQuiz(sessionId: number, req: import('../models/models').QuizSubmitRequest): Observable<QuizSession> {
    return this.http.post<QuizSession>(`${this.base}/quiz/${sessionId}/autosave`, req, {
      headers: { 'X-Session-Owner': 'dev-user-123' }
    });
  }

  submitQuiz(sessionId: number, req: import('../models/models').QuizSubmitRequest): Observable<QuizSession> {
    return this.http.post<QuizSession>(`${this.base}/quiz/${sessionId}/submit`, req, {
      headers: { 'X-Session-Owner': 'dev-user-123' }
    });
  }

  classifyErrors(sessionId: number, payload: import('../models/models').ErrorClassificationPayload): Observable<QuizSession> {
    return this.http.post<QuizSession>(`${this.base}/quiz/${sessionId}/classify-errors`, payload, {
      headers: { 'X-Session-Owner': 'dev-user-123' }
    });
  }

  getRandomQuestions(count = 10): Observable<Question[]> {
    return this.http.get<Question[]>(`${this.base}/quiz/questions`, {
      params: new HttpParams().set('count', count)
    });
  }

  // ── History ───────────────────────────────────────────────────────────────
  getDashboardSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.base}/history/summary`);
  }

  getLast30DaysLogs(): Observable<DailyLog[]> {
    return this.http.get<DailyLog[]>(`${this.base}/history/logs`);
  }

  getAllSessions(): Observable<QuizSession[]> {
    return this.http.get<QuizSession[]>(`${this.base}/history/sessions`);
  }

  // ── Ingestion ─────────────────────────────────────────────────────────────
  ingestFromText(text: string, source = 'MANUAL'): Observable<IngestionResult> {
    return this.http.post<IngestionResult>(`${this.base}/ingest/text`, { text, source });
  }

  ingestFromFile(file: File, source = 'FILE_UPLOAD'): Observable<IngestionResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source', source);
    return this.http.post<IngestionResult>(`${this.base}/ingest/file`, formData);
  }

  ingestFromJson(questions: Record<string, string>[]): Observable<IngestionResult> {
    return this.http.post<IngestionResult>(`${this.base}/ingest/json`, questions);
  }
}
