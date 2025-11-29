'use client'

import React from 'react'
import { ErrorState } from '@/types'
import { getUserFriendlyMessage, shouldShowRetry, getRetryButtonText } from '@/lib/errorHandling'
import { Button } from '@/components/ui/Button'

interface ErrorDisplayProps {
  error: ErrorState
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
}

export function ErrorDisplay({ error, onRetry, onDismiss, className = '' }: ErrorDisplayProps) {
  const friendlyMessage = getUserFriendlyMessage(error)
  const showRetry = shouldShowRetry(error)
  const retryText = getRetryButtonText(error)

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Error
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{friendlyMessage}</p>
            {error.details && process.env.NODE_ENV === 'development' ? (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-red-600 hover:text-red-800">
                  Technical Details
                </summary>
                <pre className="mt-1 text-xs bg-red-100 p-2 rounded overflow-auto">
                  {typeof error.details === 'string' 
                    ? error.details 
                    : JSON.stringify(error.details, null, 2)
                  }
                </pre>
              </details>
            ) : null}
          </div>
          <div className="mt-4 flex space-x-2">
            {showRetry && onRetry && (
              <Button
                onClick={onRetry}
                variant="secondary"
                size="sm"
                className="bg-white hover:bg-red-50 text-red-700 border-red-300"
              >
                {retryText}
              </Button>
            )}
            {onDismiss && (
              <Button
                onClick={onDismiss}
                variant="secondary"
                size="sm"
                className="text-red-700 hover:bg-red-50"
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={onDismiss}
                className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Toast-style error notification
interface ErrorToastProps {
  error: ErrorState
  onRetry?: () => void
  onDismiss: () => void
  isVisible: boolean
}

export function ErrorToast({ error, onRetry, onDismiss, isVisible }: ErrorToastProps) {
  const friendlyMessage = getUserFriendlyMessage(error)
  const showRetry = shouldShowRetry(error)

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <div className="bg-red-600 text-white rounded-lg shadow-lg p-4 transform transition-all duration-300 ease-in-out">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-200"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium">Error</p>
            <p className="mt-1 text-sm text-red-200">{friendlyMessage}</p>
            {showRetry && onRetry && (
              <button
                onClick={onRetry}
                className="mt-2 text-xs bg-red-700 hover:bg-red-800 px-2 py-1 rounded transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={onDismiss}
              className="inline-flex text-red-200 hover:text-white focus:outline-none focus:text-white"
            >
              <span className="sr-only">Close</span>
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}