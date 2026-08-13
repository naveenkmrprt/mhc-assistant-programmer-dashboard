import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuizComponent } from './quiz.component';
import { ApiService } from '../../core/services/api.service';
import { of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { QuizStartResponse, QuizSession } from '../../core/models/models';

describe('QuizComponent', () => {
  let component: QuizComponent;
  let fixture: ComponentFixture<QuizComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', ['startQuiz', 'autosaveQuiz', 'submitQuiz', 'classifyErrors']);

    await TestBed.configureTestingModule({
      imports: [QuizComponent, FormsModule],
      providers: [
        { provide: ApiService, useValue: mockApiService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(QuizComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should toggle guess flag', () => {
    // Setup state
    component.state = 'active';
    component.questions = [{ id: 1, questionText: 'Q1', optionA: 'A', optionB: 'B', optionC: 'C', optionD: 'D' }];
    component.answers = [{ questionId: 1, selectedOption: undefined, isGuess: false }];
    component.currentIndex = 0;
    mockApiService.autosaveQuiz.and.returnValue(of({} as QuizSession));
    fixture.detectChanges();

    const checkbox = fixture.debugElement.query(By.css('input[type="checkbox"]'));
    expect(checkbox.nativeElement.checked).toBeFalse();

    // Act
    checkbox.nativeElement.checked = true;
    checkbox.nativeElement.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    // Assert
    expect(component.answers[0].isGuess).toBeTrue();
    expect(mockApiService.autosaveQuiz).toHaveBeenCalled();
  });

  it('should display source status labels', () => {
    component.state = 'active';
    component.questions = [{ id: 1, questionText: 'Q1', optionA: 'A', optionB: 'B', optionC: 'C', optionD: 'D', verificationStatus: 'OFFICIAL_CONFIRMED' }];
    component.answers = [{ questionId: 1, selectedOption: undefined, isGuess: false }];
    component.currentIndex = 0;
    fixture.detectChanges();

    const badge = fixture.debugElement.query(By.css('.badge-green'));
    expect(badge).toBeTruthy();
    expect(badge.nativeElement.textContent.trim()).toBe('OFFICIAL');
  });

  it('should display incomplete analysis warning and require classification', () => {
    component.state = 'result';
    component.result = {
      id: 1, mockMode: 'BALANCED_DIAGNOSTIC', sessionStatus: 'SUBMITTED', analysisStatus: 'ANALYSIS_PENDING',
      startedAt: '2025-01-01', totalQuestions: 1, correctAnswers: 0, wrongAnswers: 1, unattempted: 0,
      rawScore: -0.25, accuracyPct: 0, durationSeconds: 10, weakTopicsJson: '[]'
    };
    
    // One pending answer (answered, wrong/guessed)
    component.answers = [{ questionId: 1, selectedOption: 'A', isGuess: true, errorType: '' }];
    component.questions = [{ id: 1, questionText: 'Q1', optionA: 'A', optionB: 'B', optionC: 'C', optionD: 'D' }];
    fixture.detectChanges();

    const warning = fixture.debugElement.query(By.css('.error-bar'));
    expect(warning.nativeElement.textContent).toContain('You have unclassified errors');

    const submitBtn = fixture.debugElement.query(By.css('.btn-primary'));
    expect(submitBtn.nativeElement.disabled).toBeTrue(); // Disabled because errorType is empty
    
    // Act
    component.answers[0].errorType = 'KNOWLEDGE_GAP';
    fixture.detectChanges();

    // Assert
    expect(component.canSubmitClassifications()).toBeTrue();
  });
});
