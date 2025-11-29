import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { OperationHistory } from '../OperationHistory'
import { useAppContext, OperationHistoryItem } from '@/contexts/AppContext'
import { formatDistanceToNow } from 'date-fns'

// Mock the context and date-fns
jest.mock('@/contexts/AppContext')
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn()
}))

const mockUseAppContext = useAppContext as jest.MockedFunction<typeof useAppContext>
const mockFormatDistanceToNow = formatDistanceToNow as jest.MockedFunction<typeof formatDistanceToNow>

describe('OperationHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFormatDistanceToNow.mockReturnValue('2 minutes ago')
  })

  const createMockHistoryItem = (overrides: Partial<OperationHistoryItem> = {}): OperationHistoryItem => ({
    id: 'test-id',
    type: 'generation',
    prompt: 'Test prompt',
    status: 'success',
    timestamp: Date.now(),
    ...overrides
  })

  describe('empty state', () => {
    beforeEach(() => {
      mockUseAppContext.mockReturnValue({
        state: {
          operationHistory: [],
          prompt: '',
          generatedImage: null,
          tokenURI: null,
          generationState: { status: 'idle', progress: 0, error: null },
          mintingState: { status: 'idle', txHash: null, error: null },
          error: null,
          isLoading: false,
          lastUpdated: Date.now()
        }
      } as any)
    })

    it('should show empty state when no operations exist', () => {
      render(<OperationHistory />)
      
      expect(screen.getByText('Operation History')).toBeInTheDocument()
      expect(screen.getByText('No operations yet')).toBeInTheDocument()
      expect(screen.getByText('Your generation and minting history will appear here')).toBeInTheDocument()
    })

    it('should show empty state icon', () => {
      render(<OperationHistory />)
      
      const icon = document.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('with operation history', () => {
    const mockHistory = [
      createMockHistoryItem({
        id: '1',
        type: 'generation',
        prompt: 'A beautiful sunset',
        status: 'success',
        result: { imageUrl: 'https://example.com/image.jpg', tokenURI: 'ipfs://test' }
      }),
      createMockHistoryItem({
        id: '2',
        type: 'minting',
        prompt: 'A cat on a windowsill',
        status: 'success',
        result: { txHash: '0x123', explorerUrl: 'https://explorer.com/tx/0x123' }
      }),
      createMockHistoryItem({
        id: '3',
        type: 'generation',
        prompt: 'A failed generation',
        status: 'error',
        error: 'Generation failed'
      }),
      createMockHistoryItem({
        id: '4',
        type: 'minting',
        prompt: 'A pending mint',
        status: 'pending'
      })
    ]

    beforeEach(() => {
      mockUseAppContext.mockReturnValue({
        state: {
          operationHistory: mockHistory,
          prompt: '',
          generatedImage: null,
          tokenURI: null,
          generationState: { status: 'idle', progress: 0, error: null },
          mintingState: { status: 'idle', txHash: null, error: null },
          error: null,
          isLoading: false,
          lastUpdated: Date.now()
        }
      } as any)
    })

    it('should display operation count', () => {
      render(<OperationHistory />)
      
      expect(screen.getByText('4 operations')).toBeInTheDocument()
    })

    it('should display all operations', () => {
      render(<OperationHistory />)
      
      expect(screen.getByText('"A beautiful sunset"')).toBeInTheDocument()
      expect(screen.getByText('"A cat on a windowsill"')).toBeInTheDocument()
      expect(screen.getByText('"A failed generation"')).toBeInTheDocument()
      expect(screen.getByText('"A pending mint"')).toBeInTheDocument()
    })

    it('should show correct status indicators', () => {
      render(<OperationHistory />)
      
      // Success indicators (green)
      const successIndicators = document.querySelectorAll('.bg-green-500')
      expect(successIndicators).toHaveLength(2)
      
      // Error indicator (red)
      const errorIndicators = document.querySelectorAll('.bg-red-500')
      expect(errorIndicators).toHaveLength(1)
      
      // Pending indicator (blue, animated)
      const pendingIndicators = document.querySelectorAll('.bg-blue-500.animate-pulse')
      expect(pendingIndicators).toHaveLength(1)
    })

    it('should show correct status text', () => {
      render(<OperationHistory />)
      
      expect(screen.getByText('Generated successfully')).toBeInTheDocument()
      expect(screen.getByText('Minted successfully')).toBeInTheDocument()
      expect(screen.getByText('Generation failed')).toBeInTheDocument()
      expect(screen.getByText('Minting...')).toBeInTheDocument()
    })

    it('should show explorer links for successful mints', () => {
      render(<OperationHistory />)
      
      const explorerLink = screen.getByText('View on Explorer')
      expect(explorerLink).toBeInTheDocument()
      expect(explorerLink.closest('a')).toHaveAttribute('href', 'https://explorer.com/tx/0x123')
      expect(explorerLink.closest('a')).toHaveAttribute('target', '_blank')
    })

    it('should format timestamps correctly', () => {
      render(<OperationHistory />)
      
      expect(mockFormatDistanceToNow).toHaveBeenCalledTimes(4)
      expect(screen.getAllByText('2 minutes ago')).toHaveLength(4)
    })
  })

  describe('filtering', () => {
    const mockHistory = [
      createMockHistoryItem({ id: '1', type: 'generation', status: 'success' }),
      createMockHistoryItem({ id: '2', type: 'minting', status: 'success' }),
      createMockHistoryItem({ id: '3', type: 'generation', status: 'error' }),
      createMockHistoryItem({ id: '4', type: 'minting', status: 'pending' })
    ]

    beforeEach(() => {
      mockUseAppContext.mockReturnValue({
        state: {
          operationHistory: mockHistory,
          prompt: '',
          generatedImage: null,
          tokenURI: null,
          generationState: { status: 'idle', progress: 0, error: null },
          mintingState: { status: 'idle', txHash: null, error: null },
          error: null,
          isLoading: false,
          lastUpdated: Date.now()
        }
      } as any)
    })

    it('should show all operations by default', () => {
      render(<OperationHistory />)
      
      expect(screen.getAllByText(/Test prompt/)).toHaveLength(4)
    })

    it('should filter by generation type', () => {
      render(<OperationHistory />)
      
      fireEvent.click(screen.getByText('Generation'))
      
      // Should show only generation operations
      expect(screen.getAllByText(/Test prompt/)).toHaveLength(2)
    })

    it('should filter by minting type', () => {
      render(<OperationHistory />)
      
      fireEvent.click(screen.getByText('Minting'))
      
      // Should show only minting operations
      expect(screen.getAllByText(/Test prompt/)).toHaveLength(2)
    })

    it('should highlight active filter', () => {
      render(<OperationHistory />)
      
      const allButton = screen.getByText('All')
      const generationButton = screen.getByText('Generation')
      
      // All should be active by default
      expect(allButton).toHaveClass('bg-blue-100', 'text-blue-700')
      
      fireEvent.click(generationButton)
      
      // Generation should be active after click
      expect(generationButton).toHaveClass('bg-purple-100', 'text-purple-700')
    })

    it('should return to all filter', () => {
      render(<OperationHistory />)
      
      // Filter by generation first
      fireEvent.click(screen.getByText('Generation'))
      expect(screen.getAllByText(/Test prompt/)).toHaveLength(2)
      
      // Then return to all
      fireEvent.click(screen.getByText('All'))
      expect(screen.getAllByText(/Test prompt/)).toHaveLength(4)
    })
  })

  describe('expansion', () => {
    const createManyHistoryItems = (count: number): OperationHistoryItem[] => {
      return Array.from({ length: count }, (_, i) => 
        createMockHistoryItem({
          id: `item-${i}`,
          prompt: `Test prompt ${i}`,
          status: 'success'
        })
      )
    }

    it('should show only first 5 items initially when there are more than 5', () => {
      const manyItems = createManyHistoryItems(10)
      mockUseAppContext.mockReturnValue({
        state: {
          operationHistory: manyItems,
          prompt: '',
          generatedImage: null,
          tokenURI: null,
          generationState: { status: 'idle', progress: 0, error: null },
          mintingState: { status: 'idle', txHash: null, error: null },
          error: null,
          isLoading: false,
          lastUpdated: Date.now()
        }
      } as any)

      render(<OperationHistory />)
      
      // Should show first 5 items
      expect(screen.getByText('"Test prompt 0"')).toBeInTheDocument()
      expect(screen.getByText('"Test prompt 4"')).toBeInTheDocument()
      expect(screen.queryByText('"Test prompt 5"')).not.toBeInTheDocument()
      
      // Should show expand button
      expect(screen.getByText('Show 5 More')).toBeInTheDocument()
    })

    it('should expand to show all items when expand button is clicked', () => {
      const manyItems = createManyHistoryItems(8)
      mockUseAppContext.mockReturnValue({
        state: {
          operationHistory: manyItems,
          prompt: '',
          generatedImage: null,
          tokenURI: null,
          generationState: { status: 'idle', progress: 0, error: null },
          mintingState: { status: 'idle', txHash: null, error: null },
          error: null,
          isLoading: false,
          lastUpdated: Date.now()
        }
      } as any)

      render(<OperationHistory />)
      
      fireEvent.click(screen.getByText('Show 3 More'))
      
      // Should show all items
      expect(screen.getByText('"Test prompt 0"')).toBeInTheDocument()
      expect(screen.getByText('"Test prompt 7"')).toBeInTheDocument()
      
      // Should show collapse button
      expect(screen.getByText('Show Less')).toBeInTheDocument()
    })

    it('should collapse back to 5 items when show less is clicked', () => {
      const manyItems = createManyHistoryItems(8)
      mockUseAppContext.mockReturnValue({
        state: {
          operationHistory: manyItems,
          prompt: '',
          generatedImage: null,
          tokenURI: null,
          generationState: { status: 'idle', progress: 0, error: null },
          mintingState: { status: 'idle', txHash: null, error: null },
          error: null,
          isLoading: false,
          lastUpdated: Date.now()
        }
      } as any)

      render(<OperationHistory />)
      
      // Expand first
      fireEvent.click(screen.getByText('Show 3 More'))
      expect(screen.getByText('"Test prompt 7"')).toBeInTheDocument()
      
      // Then collapse
      fireEvent.click(screen.getByText('Show Less'))
      expect(screen.queryByText('"Test prompt 7"')).not.toBeInTheDocument()
      expect(screen.getByText('Show 3 More')).toBeInTheDocument()
    })

    it('should not show expand button when there are 5 or fewer items', () => {
      const fewItems = createManyHistoryItems(3)
      mockUseAppContext.mockReturnValue({
        state: {
          operationHistory: fewItems,
          prompt: '',
          generatedImage: null,
          tokenURI: null,
          generationState: { status: 'idle', progress: 0, error: null },
          mintingState: { status: 'idle', txHash: null, error: null },
          error: null,
          isLoading: false,
          lastUpdated: Date.now()
        }
      } as any)

      render(<OperationHistory />)
      
      expect(screen.queryByText(/Show.*More/)).not.toBeInTheDocument()
    })
  })

  describe('type icons', () => {
    const mockHistory = [
      createMockHistoryItem({ id: '1', type: 'generation' }),
      createMockHistoryItem({ id: '2', type: 'minting' })
    ]

    beforeEach(() => {
      mockUseAppContext.mockReturnValue({
        state: {
          operationHistory: mockHistory,
          prompt: '',
          generatedImage: null,
          tokenURI: null,
          generationState: { status: 'idle', progress: 0, error: null },
          mintingState: { status: 'idle', txHash: null, error: null },
          error: null,
          isLoading: false,
          lastUpdated: Date.now()
        }
      } as any)
    })

    it('should show correct icons for different operation types', () => {
      render(<OperationHistory />)
      
      // Check for generation icon (image icon)
      const generationIcon = document.querySelector('.text-purple-600')
      expect(generationIcon).toBeInTheDocument()
      
      // Check for minting icon (coin icon)
      const mintingIcon = document.querySelector('.text-green-600')
      expect(mintingIcon).toBeInTheDocument()
    })
  })

  describe('custom className', () => {
    beforeEach(() => {
      mockUseAppContext.mockReturnValue({
        state: {
          operationHistory: [],
          prompt: '',
          generatedImage: null,
          tokenURI: null,
          generationState: { status: 'idle', progress: 0, error: null },
          mintingState: { status: 'idle', txHash: null, error: null },
          error: null,
          isLoading: false,
          lastUpdated: Date.now()
        }
      } as any)
    })

    it('should apply custom className', () => {
      const { container } = render(<OperationHistory className="custom-class" />)
      
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })
})