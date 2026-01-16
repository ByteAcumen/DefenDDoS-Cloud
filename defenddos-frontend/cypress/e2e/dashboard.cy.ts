describe('DefenDDoS Dashboard E2E Tests', () => {
  beforeEach(() => {
    // Login before each test
    cy.login('admin', 'admin123')
  })

  afterEach(() => {
    cy.logout()
  })

  it('should load the dashboard page successfully', () => {
    cy.visit('/dashboard')
    cy.url().should('include', '/dashboard')
    cy.contains('Dashboard').should('be.visible')
  })

  it('should display key metrics cards', () => {
    cy.visit('/dashboard')

    // Check for metric cards
    cy.getBySel('total-requests-card').should('be.visible')
    cy.getBySel('attacks-blocked-card').should('be.visible')
    cy.getBySel('active-connections-card').should('be.visible')
    cy.getBySel('response-time-card').should('be.visible')
  })

  it('should show real-time traffic data', () => {
    cy.visit('/dashboard')

    // Wait for traffic data to load
    cy.getBySel('traffic-table', { timeout: 10000 }).should('be.visible')

    // Verify table has data
    cy.get('table tbody tr').should('have.length.greaterThan', 0)
  })

  it('should navigate to analytics page', () => {
    cy.visit('/dashboard')

    cy.getBySel('nav-analytics').click()
    cy.url().should('include', '/analytics')
    cy.contains('Analytics').should('be.visible')
  })

  it('should navigate to blocked IPs page', () => {
    cy.visit('/dashboard')

    cy.getBySel('nav-blocked-ips').click()
    cy.url().should('include', '/blocked-ips')
    cy.contains('Blocked IP Addresses').should('be.visible')
  })

  it('should navigate to threat detection page', () => {
    cy.visit('/dashboard')

    cy.getBySel('nav-threat-detection').click()
    cy.url().should('include', '/threat-detection')
    cy.contains('Threat Detection').should('be.visible')
  })

  it('should refresh data on button click', () => {
    cy.visit('/dashboard')

    cy.intercept('GET', '/api/statistics').as('getStats')

    cy.getBySel('refresh-button').click()

    cy.wait('@getStats').its('response.statusCode').should('eq', 200)
  })

  it('should display threat alerts', () => {
    cy.visit('/dashboard')

    // Mock high-severity threat
    cy.intercept('GET', '/api/threat-detections', {
      statusCode: 200,
      body: [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          sourceIp: '192.168.1.100',
          severity: 'high',
          attackType: 'DDoS',
        },
      ],
    })

    cy.visit('/threat-detection')

    cy.getBySel('threat-alert').should('be.visible')
    cy.getBySel('threat-alert').should('contain', 'high')
  })

  it('should filter traffic by source IP', () => {
    cy.visit('/traffic')

    cy.getBySel('filter-source-ip').type('192.168.1.100')
    cy.getBySel('apply-filter').click()

    cy.get('table tbody tr').each(($row) => {
      cy.wrap($row).should('contain', '192.168.1.100')
    })
  })

  it('should block an IP address', () => {
    cy.visit('/traffic')

    // Intercept block IP request
    cy.intercept('POST', '/api/mitigation/block/**').as('blockIP')

    cy.get('table tbody tr').first().find('[data-test="block-ip"]').click()

    cy.getBySel('confirm-block').click()

    cy.wait('@blockIP').its('response.statusCode').should('eq', 200)

    cy.contains('IP blocked successfully').should('be.visible')
  })

  it('should unblock an IP address', () => {
    cy.visit('/blocked-ips')

    cy.intercept('DELETE', '/api/mitigation/unblock/**').as('unblockIP')

    cy.get('table tbody tr').first().find('[data-test="unblock-ip"]').click()

    cy.getBySel('confirm-unblock').click()

    cy.wait('@unblockIP').its('response.statusCode').should('eq', 200)

    cy.contains('IP unblocked successfully').should('be.visible')
  })

  it('should display system health status', () => {
    cy.visit('/system')

    cy.getBySel('system-health').should('be.visible')
    cy.getBySel('influxdb-status').should('contain', 'healthy')
    cy.getBySel('ml-service-status').should('contain', 'healthy')
  })

  it('should export analytics data', () => {
    cy.visit('/analytics')

    cy.getBySel('export-button').click()
    cy.getBySel('export-csv').click()

    // Verify download was triggered (file existence check would require cypress-downloadfile plugin)
    cy.contains('Export started').should('be.visible')
  })

  it('should handle API errors gracefully', () => {
    // Mock API error
    cy.intercept('GET', '/api/statistics', {
      statusCode: 500,
      body: { error: 'Internal Server Error' },
    })

    cy.visit('/dashboard')

    cy.contains('Error loading data').should('be.visible')
    cy.getBySel('retry-button').should('be.visible')
  })

  it('should auto-refresh data every 5 seconds', () => {
    cy.visit('/dashboard')

    cy.intercept('GET', '/api/traffic/recent').as('getTraffic')

    // Wait for initial load
    cy.wait('@getTraffic')

    // Wait for auto-refresh (5 seconds)
    cy.wait('@getTraffic', { timeout: 6000 })

    // Verify second request was made
    cy.get('@getTraffic.all').should('have.length.greaterThan', 1)
  })

  it('should be responsive on mobile devices', () => {
    cy.viewport('iphone-x')
    cy.visit('/dashboard')

    cy.getBySel('mobile-menu').should('be.visible')
    cy.getBySel('mobile-menu').click()

    cy.getBySel('nav-sidebar').should('be.visible')
  })
})
