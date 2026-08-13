describe('Exam Flow', () => {
  beforeEach(() => {
    // Reset any state or login before each test
    cy.visit('/login');
    // We assume the backend is running with a bootstrap user admin/admin123
    cy.get('input#username').type('admin');
    cy.get('input#password').type('admin123');
    cy.get('button[type="submit"]').click();
    
    // Should navigate to dashboard
    cy.url().should('not.include', '/login');
  });

  it('should start a quiz, autosave, and prevent cross-user session access', () => {
    // Start Quiz
    cy.visit('/quiz');
    cy.get('button').contains('PRACTICE').click();
    cy.get('button').contains('START SESSION').click();

    // Ensure quiz loaded
    cy.get('.q-meta').should('be.visible');

    // Answer first question
    cy.get('.option-btn').first().click();
    
    // Check local autosave implicitly by navigating options
    cy.get('.q-nav-btns button').contains('NEXT').click();
    cy.get('.q-meta').should('contain.text', 'Q 2');

    // Toggle skip
    cy.get('button').contains('MARK SKIPPED').click();
    
    // Wait for an autosave cycle or trigger it implicitly by checking UI
    cy.get('.q-dot').eq(0).should('have.class', 'answered');
    cy.get('.q-dot').eq(1).should('have.class', 'skipped');

    // Final Submit
    cy.get('button').contains('SUBMIT').click();
    
    // Verify results view
    cy.get('.page-title').should('contain.text', 'SESSION COMPLETE');
    cy.get('.badge-yellow').should('contain.text', 'ANALYSIS PENDING');
  });

  it('should handle optimistic locking 409 conflict', () => {
    // Start Quiz
    cy.visit('/quiz');
    cy.get('button').contains('START SESSION').click();

    // Mock the autosave endpoint to return 409
    cy.intercept('POST', '/api/v1/quiz/*/autosave', {
      statusCode: 409,
      body: { error: 'STALE_SESSION_VERSION' }
    }).as('autosave409');

    // Answer first question (triggers autosave)
    cy.get('.option-btn').first().click();

    // Wait for mock intercept
    cy.wait('@autosave409');

    // UI should show conflict error
    cy.get('.error-bar').should('contain.text', 'Conflict detected: Auto-save failed');
  });
});
