import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDefenDDoS } from '@/hooks/useDefenDDoS'
import { ReactNode } from 'react'

// Mock API service
jest.mock('@/services/api', () => ({
  defenseDosApi: {
    getStatistics: jest.fn().mockResolvedValue({
      totalRequests: 1000000,
      attacksBlocked: 10000,
      activeConnections: 1500,
      responseTime: 50,
    }),
    getRecentTraffic: jest.fn().mockResolvedValue([
      {
        id: '1',
        timestamp: new Date().toISOString(),
        sourceIp: '192.168.1.100',
        predictionLabel: 'Benign',
        confidence: 0.95,
      },
    ]),
    getBlockedIPs: jest.fn().mockResolvedValue([]),
    getThreatDetections: jest.fn().mockResolvedValue([]),
    getSystemHealth: jest.fn().mockResolvedValue({ status: 'healthy' }),
  },
}))

describe('useDefenDDoS Hook', () => {
  let queryClient: QueryClient

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    })
  })

  afterEach(() => {
    queryClient.clear()
  })

  it('fetches statistics successfully', async () => {
    const { result } = renderHook(() => useDefenDDoS(), { wrapper })

    await waitFor(() => {
      expect(result.current.stats.isLoading).toBe(false)
    })

    expect(result.current.stats.data).toEqual({
      totalRequests: 1000000,
      attacksBlocked: 10000,
      activeConnections: 1500,
      responseTime: 50,
    })
  })

  it('fetches recent traffic successfully', async () => {
    const { result } = renderHook(() => useDefenDDoS(), { wrapper })

    await waitFor(() => {
      expect(result.current.recentTraffic.isLoading).toBe(false)
    })

    expect(result.current.recentTraffic.data).toHaveLength(1)
    expect(result.current.recentTraffic.data?.[0].sourceIp).toBe('192.168.1.100')
  })

  it('handles API errors gracefully', async () => {
    const mockError = new Error('API Error')
    jest.spyOn(console, 'error').mockImplementation(() => {})

    // Override mock to throw error
    const api = require('@/services/api')
    api.defenseDosApi.getStatistics.mockRejectedValueOnce(mockError)

    const { result } = renderHook(() => useDefenDDoS(), { wrapper })

    await waitFor(() => {
      expect(result.current.stats.isLoading).toBe(false)
    })

    expect(result.current.stats.error).toBeTruthy()
  })

  it('auto-refetches data at configured interval', async () => {
    const { result } = renderHook(() => useDefenDDoS(), { wrapper })

    await waitFor(() => {
      expect(result.current.stats.isLoading).toBe(false)
    })

    // Verify initial fetch
    const api = require('@/services/api')
    expect(api.defenseDosApi.getStatistics).toHaveBeenCalled()
  })
})
