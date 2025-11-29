import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorDisplay, ErrorToast } from '../ErrorDisplay'
import { ErrorState, ErrorType } from '@/types'
import { getUserFriendlyMessage, shouldShowRetry, getRetryButtonText } from '@/lib/errorHandling'

// Mock the error handling utilities
jest.mock('@/lib/errorHandling')
const mockGetUserFriendlyMessage = getUserFriendlyMessage as jest.MockedFunction<typeof getUserFriendlyMessage>
const mockShouldShowRetry = shouldShowRetry as jest.MockedFunction<typeof shouldShowRetry>
const mockGetRetryButtonText = getRetryButtonText as jest.MockedFunction<typeof getRetryButtonText>

describe('ErrorDisplay', () => {
  const mockOnRetry = jest.fn()
  const mockOnDismiss = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUserFriendlyMessage.mockReturnValue('A user-friendly error message')
    mockShouldShowRetry.mockReturnValue(true)
    mockGetRetryButtonText.mockReturnValue('Try Again')
  })

  const createMockError = (type: ErrorType = ErrorType.GENERATION_FAILED): ErrorState => ({
    type,
    message: 'Test error message',
    retryable: true,
    details: 'Additional error details',
    timestamp: Date.now()
  })

  describe('basic rendering', () => {
    it('should render error message', () => {
      const error = createMockError()
      render(<ErrorDisplay error={error} />)
      
      expect(screen.getByText('Error')).toBeInTheDocument()
      expect(screen.getByText('A user-friendly error message')).toBeInTheDocument()
    })

    it('should call getUserFriendlyMessage with the error', () => {
      const error = createMockError()
      render(<ErrorDisplay error={error} />)
      
      expect(mockGetUserFriendlyMessage).toHaveBeenCalledWith(error)
    })

    it('should apply custom className', () => {
      const error = createMockError()
      const { container } = render(<ErrorDisplay error={error} className="custom-class" />)
      
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('retry functionality', () => {
    it('should show retry button when error is retryable', () => {
      const error = createMockError()
      mockShouldShowRetry.mockReturnValue(true)
      
      render(<ErrorDisplay error={error} onRetry={mockOnRetry} />)
      
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })

    it('should not show retry button when error is not retryable', () => {
      const error = createMockError()
      mockShouldShowRetry.mockReturnValue(false)
      
      render(<ErrorDisplay error={error} onRetry={mockOnRetry} />)
      
      expect(screen.queryByText('Try Again')).not.toBeInTheDocument()
    })

    it('should not show retry button when onRetry is not provided', () => {
      const error = createMockError()
      mockShouldShowRetry.mockReturnValue(true)
      
      render(<ErrorDisplay error={error} />)
      
      expect(screen.queryByText('Try Again')).not.toBeInTheDocument()
    })

    it('should call onRetry when retry button is clicked', () => {
      const error = createMockError()
      mockShouldShowRetry.mockReturnValue(true)
      
      render(<ErrorDisplay error={error} onRetry={mockOnRetry} />)
      
      fireEvent.click(screen.getByText('Try Again'))
      expect(mockOnRetry).toHaveBeenCalled()
    })

    it('should use custom retry button text', () => {
      const error = createMockError()
      mockShouldShowRetry.mockReturnValue(true)
      mockGetRetryButtonText.mockReturnValue('Retry Operation')
      
      render(<ErrorDisplay error={error} onRetry={mockOnRetry} />)
      
      expect(screen.getByText('Retry Operation')).toBeInTheDocument()
    })
  })

  describe('dismiss functionality', () => {
    it('should show dismiss button when onDismiss is provided', () => {
      const error = createMockError()
      
      render(<ErrorDisplay error={error} onDismiss={mockOnDismiss} />)
      
      expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument()
    })

    it('should not show dismiss button when onDismiss is not provided', () => {
      const error = createMockError()
      
      render(<ErrorDisplay error={error} />)
      
      expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument()
    })

    it('should call onDismiss when dismiss button is clicked', () => {
      const error = createMockError()
      
      render(<ErrorDisplay error={error} onDismiss={mockOnDismiss} />)
      
      fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
      expect(mockOnDismiss).toHaveBeenCalled()
    })

    it('should call onDismiss when close icon is clicked', () => {
      const error = createMockError()
      
      render(<ErrorDisplay error={error} onDismiss={mockOnDismiss} />)
      
      const closeButton = screen.getByRole('button', { name: /dismiss/i })
      fireEvent.click(closeButton)
      expect(mockOnDismiss).toHaveBeenCalled()
    })
  })

  describe('technical details', () => {
    const originalEnv = process.env.NODE_ENV

    afterEach(() => {
      process.env.NODE_ENV = originalEnv
    })

    it('should show technical details in development mode', () => {
      process.env.NODE_ENV = 'development'
      const error = createMockError()
      
      render(<ErrorDisplay error={error} />)
      
      expect(screen.getByText('Technical Details')).toBeInTheDocument()
    })

    it('should not show technical details in production mode', () => {
      process.env.NODE_ENV = 'production'
      const error = createMockError()
      
      render(<ErrorDisplay error={error} />)
      
      expect(screen.queryByText('Technical Details')).not.toBeInTheDocument()
    })

    it('should display string details correctly', () => {
      process.env.NODE_ENV = 'development'
      const error = { ...createMockError(), details: 'String error details' }
      
      render(<ErrorDisplay error={error} />)
      
      fireEvent.click(screen.getByText('Technical Details'))
      expect(screen.getByText('String error details')).toBeInTheDocument()
    })

    it('should display object details as JSON', () => {
      process.env.NODE_ENV = 'development'
      const error = { ...createMockError(), details: { code: 'ERROR_CODE', data: 'test' } }
      
      render(<ErrorDisplay error={error} />)
      
      fireEvent.click(screen.getByText('Technical Details'))
      expect(screen.getByText(/"code": "ERROR_CODE"/)).toBeInTheDocument()
    })

    it('should not show technical details when details is null', () => {
      process.env.NODE_ENV = 'development'
      const error = { ...createMockError(), details: null }
      
      render(<ErrorDisplay error={error} />)
      
      expect(screen.queryByText('Technical Details')).not.toBeInTheDocument()
    })
  })

  describe('different error types', () => {
    it('should handle wallet connection errors', () => {
      const error = createMockError(ErrorType.WALLET_CONNECTION)
      render(<ErrorDisplay error={error} />)
      
      expect(mockGetUserFriendlyMessage).toHaveBeenCalledWith(error)
    })

    it('should handle network errors', () => {
      const error = createMockError(ErrorType.NETWORK_ERROR)
      render(<ErrorDisplay error={error} />)
      
      expect(mockGetUserFriendlyMessage).toHaveBeenCalledWith(error)
    })

    it('should handle generation errors', () => {
      const error = createMockError(ErrorType.GENERATION_FAILED)
      render(<ErrorDisplay error={error} />)
      
      expect(mockGetUserFriendlyMessage).toHaveBeenCalledWith(error)
    })
  })
})

describe('ErrorToast', () => {
  const mockOnRetry = jest.fn()
  const mockOnDismiss = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUserFriendlyMessage.mockReturnValue('Toast error message')
    mockShouldShowRetry.mockReturnValue(true)
  })

  const createMockError = (type: ErrorType = ErrorType.GENERATION_FAILED): ErrorState => ({
    type,
    message: 'Test error message',
    retryable: true,
    details: null,
    timestamp: Date.now()
  })

  describe('visibility', () => {
    it('should render when isVisible is true', () => {
      const error = createMockError()
      render(<ErrorToast error={error} onDismiss={mockOnDismiss} isVisible={true} />)
      
      expect(screen.getByText('Error')).toBeInTheDocument()
      expect(screen.getByText('Toast error message')).toBeInTheDocument()
    })

    it('should not render when isVisible is false', () => {
      const error = createMockError()
      render(<ErrorToast error={error} onDismiss={mockOnDismiss} isVisible={false} />)
      
      expect(screen.queryByText('Error')).not.toBeInTheDocument()
    })
  })

  describe('toast functionality', () => {
    it('should show retry button when error is retryable and onRetry is provided', () => {
      const error = createMockError()
      mockShouldShowRetry.mockReturnValue(true)
      
      render(<ErrorToast error={error} onRetry={mockOnRetry} onDismiss={mockOnDismiss} isVisible={true} />)
      
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })

    it('should call onRetry when retry button is clicked', () => {
      const error = createMockError()
      mockShouldShowRetry.mockReturnValue(true)
      
      render(<ErrorToast error={error} onRetry={mockOnRetry} onDismiss={mockOnDismiss} isVisible={true} />)
      
      fireEvent.click(screen.getByText('Try Again'))
      expect(mockOnRetry).toHaveBeenCalled()
    })

    it('should call onDismiss when close button is clicked', () => {
      const error = createMockError()
      
      render(<ErrorToast error={error} onDismiss={mockOnDismiss} isVisible={true} />)
      
      const closeButton = screen.getByRole('button', { name: /close/i })
      fireEvent.click(closeButton)
      expect(mockOnDismiss).toHaveBeenCalled()
    })

    it('should have proper styling for toast notification', () => {
      const error = createMockError()
      const { container } = render(<ErrorToast error={error} onDismiss={mockOnDismiss} isVisible={true} />)
      
      const toast = container.querySelector('.fixed.top-4.right-4')
      expect(toast).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have proper close button label', () => {
      const error = createMockError()
      
      render(<ErrorToast error={error} onDismiss={mockOnDismiss} isVisible={true} />)
      
      const closeButton = screen.getByRole('button', { name: /close/i })
      expect(closeButton).toBeInTheDocument()
    })
  })
})