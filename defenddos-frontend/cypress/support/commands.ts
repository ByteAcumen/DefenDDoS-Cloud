/// <reference types="cypress" />

// Custom Commands for DefenDDoS Testing

Cypress.Commands.add('login', (username: string, password: string) => {
  cy.visit('/login')
  cy.get('input[name="username"]').type(username)
  cy.get('input[name="password"]').type(password)
  cy.get('button[type="submit"]').click()
  cy.url().should('include', '/dashboard')
})

Cypress.Commands.add('logout', () => {
  cy.get('[data-test="user-menu"]').click()
  cy.get('[data-test="logout-button"]').click()
  cy.url().should('include', '/login')
})

Cypress.Commands.add('getBySel', (selector: string) => {
  return cy.get(`[data-test="${selector}"]`)
})

Cypress.Commands.add('getBySelLike', (selector: string) => {
  return cy.get(`[data-test*="${selector}"]`)
})

// Prevent TypeScript errors
export {}
