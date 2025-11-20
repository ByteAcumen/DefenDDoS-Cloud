import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@testing-library/jest-dom'
import Dashboard from '@/app/dashboard/page'

// Mock the useDefenDDoS hook
jest.mock('@/hooks/useDefenDDoS', () => ({
  useDefenDDoS: () => ({
    stats: {
      data: {
        totalRequests: 1250000,
        attacksBlocked: 15234,
        activeConnections: 1523,
        responseTime: 45,
      },
      isLoading: false,
      error: null,
    },
    recentTraffic: {
      data: [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          sourceIp: '192.168.1.100',
          destinationIp: '10.0.0.1',
          protocol: 'TCP',
          predictionLabel: 'Benign',
          confidence: 0.95,
          threatLevel: 'low',
        },
      ],
      isLoading: false,
      error: null,
    },
    blockedIPs: {
      data: [],
      isLoading: false,
      error: null,
    },
  }),
}))

describe('Dashboard Page', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
  })

  afterEach(() => {
    queryClient.clear()
  })

  it('renders dashboard with statistics', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/1,250,000/i)).toBeInTheDocument()
      expect(screen.getByText(/15,234/i)).toBeInTheDocument()
      expect(screen.getByText(/1,523/i)).toBeInTheDocument()
    })
  })

  it('displays loading state initially', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    )

    // Add assertions for loading state if implemented
  })

  it('displays recent traffic data', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('192.168.1.100')).toBeInTheDocument()
      expect(screen.getByText('Benign')).toBeInTheDocument()
    })
  })
})
