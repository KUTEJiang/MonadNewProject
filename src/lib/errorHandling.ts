import { ErrorType, ErrorState, RetryConfig } from '@/types'

// Default retry configuration
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
}

// Error classification and mapping
export class AppError extends Error {
  public readonly type: ErrorType
  public readonly retryable: boolean
  public readonly details?: unknown
  public readonly timestamp: number

  constructor(
    type: ErrorType,
    message: string,
    retryable: boolean = false,
    details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.retryable = retryable
    this.details = details
    this.timestamp = Date.now()
  }

  toErrorState(retryCount?: number, maxRetries?: number): ErrorState {
    return {
      type: this.type,
      message: this.message,
      details: this.details,
      retryable: this.retryable,
      timestamp: this.timestamp,
      retryCount,
      maxRetries
    }
  }
}

// Error classification functions
export function classifyError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    // Network-related errors
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return new AppError(
        ErrorType.NETWORK_ERROR,
        'Network connection failed. Please check your internet connection.',
        true,
        error.message
      )
    }

    // Timeout errors
    if (message.includes('timeout') || message.includes('408')) {
      return new AppError(
        ErrorType.TIMEOUT_ERROR,
        'Request timed out. Please try again.',
        true,
        error.message
      )
    }

    // Rate limit errors
    if (message.includes('rate limit') || message.includes('429')) {
      return new AppError(
        ErrorType.RATE_LIMIT_ERROR,
        'Too many requests. Please wait a moment before trying again.',
        true,
        error.message
      )
    }

    // Authentication errors
    if (message.includes('authentication') || message.includes('401') || message.includes('unauthorized')) {
      return new AppError(
        ErrorType.AUTHENTICATION_ERROR,
        'Authentication failed. Please check your configuration.',
        false,
        error.message
      )
    }

    // Content policy errors
    if (message.includes('content_policy_violation') || message.includes('inappropriate')) {
      return new AppError(
        ErrorType.CONTENT_POLICY_ERROR,
        'Content policy violation. Please modify your prompt and try again.',
        false,
        error.message
      )
    }

    // Wallet-related errors
    if (message.includes('user rejected') || message.includes('user denied')) {
      return new AppError(
        ErrorType.USER_REJECTED,
        'Transaction was rejected by user.',
        false,
        error.message
      )
    }

    if (message.includes('insufficient funds') || message.includes('insufficient balance')) {
      return new AppError(
        ErrorType.INSUFFICIENT_FUNDS,
        'Insufficient funds to complete the transaction.',
        false,
        error.message
      )
    }

    // Prompt already used error
    if (message.includes('promptalreadyused') || message.includes('already been used')) {
      return new AppError(
        ErrorType.PROMPT_ALREADY_USED,
        'This prompt has already been used to mint an NFT. Please try a different prompt.',
        false,
        error.message
      )
    }

    // Generic error with original message
    return new AppError(
      ErrorType.UNKNOWN_ERROR,
      error.message || 'An unexpected error occurred.',
      true,
      error.message
    )
  }

  // Non-Error objects
  return new AppError(
    ErrorType.UNKNOWN_ERROR,
    'An unexpected error occurred.',
    true,
    error
  )
}

// Retry logic with exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onRetry?: (attempt: number, error: AppError) => void
): Promise<T> {
  let lastError: AppError
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = classifyError(error)
      
      // Don't retry if error is not retryable or we've reached max retries
      if (!lastError.retryable || attempt === config.maxRetries) {
        throw lastError
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelay
      )

      // Add jitter to prevent thundering herd
      const jitteredDelay = delay + Math.random() * 1000

      console.warn(`Operation failed (attempt ${attempt + 1}/${config.maxRetries + 1}):`, lastError.message)
      console.warn(`Retrying in ${Math.round(jitteredDelay)}ms...`)

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, lastError)
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, jitteredDelay))
    }
  }

  throw lastError!
}

// User-friendly error messages
export function getUserFriendlyMessage(error: ErrorState): string {
  switch (error.type) {
    case ErrorType.NETWORK_ERROR:
      return 'Connection failed. Please check your internet connection and try again.'
    
    case ErrorType.TIMEOUT_ERROR:
      return 'The request took too long to complete. Please try again.'
    
    case ErrorType.RATE_LIMIT_ERROR:
      return 'Too many requests. Please wait a moment before trying again.'
    
    case ErrorType.AUTHENTICATION_ERROR:
      return 'Authentication failed. Please check your configuration.'
    
    case ErrorType.CONTENT_POLICY_ERROR:
      return 'Your prompt violates content policy. Please modify it and try again.'
    
    case ErrorType.WALLET_CONNECTION:
      return 'Failed to connect to wallet. Please make sure your wallet is installed and unlocked.'
    
    case ErrorType.NETWORK_MISMATCH:
      return 'Please switch to Monad Testnet in your wallet.'
    
    case ErrorType.USER_REJECTED:
      return 'Transaction was cancelled. You can try again when ready.'
    
    case ErrorType.INSUFFICIENT_FUNDS:
      return 'Insufficient funds for gas fees. Please add more MON to your wallet.'
    
    case ErrorType.PROMPT_ALREADY_USED:
      return 'This prompt has already been used. Please try a different prompt.'
    
    case ErrorType.GENERATION_FAILED:
      return 'Failed to generate image. Please try again with a different prompt.'
    
    case ErrorType.IPFS_UPLOAD_FAILED:
      return 'Failed to upload to IPFS. Please try again.'
    
    case ErrorType.MINTING_FAILED:
      return 'Failed to mint NFT. Please try again.'
    
    case ErrorType.VALIDATION_ERROR:
      return error.message || 'Invalid input. Please check your input and try again.'
    
    default:
      return error.message || 'An unexpected error occurred. Please try again.'
  }
}

// Check if error should show retry button
export function shouldShowRetry(error: ErrorState): boolean {
  return error.retryable && (!error.maxRetries || !error.retryCount || error.retryCount < error.maxRetries)
}

// Get retry button text
export function getRetryButtonText(error: ErrorState): string {
  if (error.retryCount && error.retryCount > 0) {
    return `Retry (${error.retryCount}/${error.maxRetries || 3})`
  }
  return 'Try Again'
}

// Network status checker
export function checkNetworkStatus(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!navigator.onLine) {
      resolve(false)
      return
    }

    // Try to fetch a small resource to verify connectivity
    const timeout = setTimeout(() => resolve(false), 5000)
    
    fetch('/api/health', { 
      method: 'HEAD',
      cache: 'no-cache'
    })
      .then(() => {
        clearTimeout(timeout)
        resolve(true)
      })
      .catch(() => {
        clearTimeout(timeout)
        resolve(false)
      })
  })
}

// Error reporting (for analytics/monitoring)
export function reportError(error: ErrorState, context?: Record<string, unknown>): void {
  // In a production app, you would send this to your error tracking service
  console.error('Error reported:', {
    type: error.type,
    message: error.message,
    timestamp: error.timestamp,
    retryCount: error.retryCount,
    context,
    details: error.details
  })

  // Example: Send to Sentry, LogRocket, etc.
  // Sentry.captureException(error, { contexts: { custom: context } })
}