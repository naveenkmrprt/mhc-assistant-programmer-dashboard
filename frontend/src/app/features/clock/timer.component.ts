import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { CountdownTime } from '../../core/models/models';

/**
 * Doomsday Clock Component
 * Counts down to September 6, 2026 10:00 AM IST (UTC+5:30)
 */
@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="clock-shell">
      <div class="clock-header">
        <span class="clock-label">TIME REMAINING UNTIL ANNIHILATION</span>
        <span class="clock-date">06.09.2026 · 10:00 AM IST</span>
      </div>

      <div class="clock-grid">
        <div class="clock-block">
          <div class="clock-digits" [class.pulse]="time.days <= 7">
            {{ time.days.toString().padStart(3, '0') }}
          </div>
          <div class="clock-unit">DAYS</div>
        </div>

        <div class="clock-separator">:</div>

        <div class="clock-block">
          <div class="clock-digits">
            {{ time.hours.toString().padStart(2, '0') }}
          </div>
          <div class="clock-unit">HRS</div>
        </div>

        <div class="clock-separator">:</div>

        <div class="clock-block">
          <div class="clock-digits">
            {{ time.minutes.toString().padStart(2, '0') }}
          </div>
          <div class="clock-unit">MIN</div>
        </div>

        <div class="clock-separator">:</div>

        <div class="clock-block">
          <div class="clock-digits tick">
            {{ time.seconds.toString().padStart(2, '0') }}
          </div>
          <div class="clock-unit">SEC</div>
        </div>
      </div>

      <div class="clock-sub">
        <span class="sub-item">
          <span class="sub-val">{{ totalHours }}</span> total hours left
        </span>
        <span class="sub-sep">·</span>
        <span class="sub-item">
          <span class="sub-val">{{ studyDaysLeft }}</span> study days available
        </span>
        <span class="sub-sep">·</span>
        <span class="sub-item">
          <span class="sub-val red">{{ urgencyLabel }}</span>
        </span>
      </div>
    </div>
  `,
  styles: [`
    .clock-shell {
      background: #060606;
      border: 2px solid #1a1a1a;
      border-top: 2px solid var(--red);
      padding: 2.5rem 3rem;
      position: relative;
    }

    .clock-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .clock-label {
      font-family: var(--mono);
      font-size: 0.6rem;
      letter-spacing: 0.2em;
      color: var(--red);
      text-transform: uppercase;
    }

    .clock-date {
      font-family: var(--mono);
      font-size: 0.6rem;
      letter-spacing: 0.1em;
      color: #333;
    }

    .clock-grid {
      display: flex;
      align-items: center;
      gap: 0;
    }

    .clock-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
    }

    .clock-digits {
      font-family: var(--mono);
      font-size: clamp(3rem, 6vw, 5.5rem);
      font-weight: 700;
      color: var(--white);
      line-height: 1;
      letter-spacing: -0.02em;
      transition: color 0.3s;
    }

    .clock-digits.pulse {
      color: var(--red);
      animation: pulse-red 1s ease-in-out infinite;
    }

    .clock-digits.tick {
      color: var(--grey-300);
    }

    .clock-separator {
      font-family: var(--mono);
      font-size: clamp(2rem, 4vw, 4rem);
      color: #2a2a2a;
      padding: 0 0.5rem;
      line-height: 1;
      margin-bottom: 1.2rem;
    }

    .clock-unit {
      font-family: var(--mono);
      font-size: 0.55rem;
      letter-spacing: 0.2em;
      color: #444;
      margin-top: 0.5rem;
      text-transform: uppercase;
    }

    .clock-sub {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #1a1a1a;
      font-size: 0.75rem;
      color: #555;
    }

    .sub-val {
      color: var(--white);
      font-family: var(--mono);
      font-weight: 700;
    }

    .sub-val.red { color: var(--red); }

    .sub-sep { color: #222; }
  `]
})
export class TimerComponent implements OnInit, OnDestroy {
  // IST is UTC+5:30 → offset = 5.5 * 3600 * 1000 ms
  private readonly targetMs =
    new Date('2026-09-06T10:00:00+05:30').getTime();

  time: CountdownTime = { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
  totalHours = 0;
  studyDaysLeft = 0;
  urgencyLabel = '';

  private sub!: Subscription;

  ngOnInit(): void {
    this.tick();
    this.sub = interval(1000).subscribe(() => this.tick());
  }

  private tick(): void {
    const now = Date.now();
    const diff = this.targetMs - now;

    if (diff <= 0) {
      this.time = { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
      this.urgencyLabel = 'EXAM DAY';
      return;
    }

    const totalSec = Math.floor(diff / 1000);
    const days    = Math.floor(totalSec / 86400);
    const hours   = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    this.time = { days, hours, minutes, seconds, totalSeconds: totalSec };
    this.totalHours = Math.floor(totalSec / 3600);
    this.studyDaysLeft = days; // minus Sundays or rest days = user decides

    if (days > 90)      this.urgencyLabel = 'GRIND MODE';
    else if (days > 30) this.urgencyLabel = 'HIGH ALERT';
    else if (days > 14) this.urgencyLabel = 'CRITICAL';
    else                this.urgencyLabel = 'TERMINAL';
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
