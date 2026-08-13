import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface AuthResponse {
  jwt: string;
  username: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly tokenKey = 'mhc_auth_token';
  private readonly usernameKey = 'mhc_username';

  private currentUserSubject = new BehaviorSubject<string | null>(this.getUsername());

  constructor(private http: HttpClient) {}

  login(username: string, password: string):Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/v1/auth/login', { username, password })
      .pipe(tap(res => {
        localStorage.setItem(this.tokenKey, res.jwt);
        localStorage.setItem(this.usernameKey, res.username);
        this.currentUserSubject.next(res.username);
      }));
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.usernameKey);
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUsername(): string | null {
    return localStorage.getItem(this.usernameKey);
  }

  get currentUser$(): Observable<string | null> {
    return this.currentUserSubject.asObservable();
  }
}
