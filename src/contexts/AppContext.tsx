'use client'

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { GenerationState, MintingState, ErrorState } from '@/types'
import { classifyError, reportError } from '@/lib/errorHandling'

// Extended state interfaces for global management
export interface AppState {
  // Core application state
  prompt: string
  generatedImage: string | null
  tokenURI: string | null
  
  // Operation states
  generationState: GenerationState
  mintingState: MintingState
  
  // Error handling
  error: ErrorState | null
  
  // Operation history
  operationHistory: OperationHistoryItem[]
  
  // UI state
  isLoading: boolean
  lastUpdated: number
}

export interface OperationHistoryItem {
  id: string
  type: 'generation' | 'minting'
  prompt: string
  status: 'success' | 'error' | 'pending'
  timestamp: number
  result?: {
    imageUrl?: string
    tokenURI?: string
    txHash?: string
    explorerUrl?: string
    tokenId?: string
  }
  error?: string
}

// Action types for state management
export type AppAction =
  | { type: 'SET_PROMPT'; payload: string }
  | { type: 'START_GENERATION' }
  | { type: 'UPDATE_GENERATION_PROGRESS'; payload: { progress: number; status: GenerationState['status'] } }
  | { type: 'GENERATION_SUCCESS'; payload: { imageUrl: string; tokenURI: string } }
  | { type: 'GENERATION_ERROR'; payload: string | Error | ErrorState }
  | { type: 'START_MINTING' }
  | { type: 'UPDATE_MINTING_STATUS'; payload: { status: MintingState['status']; txHash?: string } }
  | { type: 'MINTING_SUCCESS'; payload: { txHash: string } }
  | { type: 'MINTING_ERROR'; payload: string | Error | ErrorState }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET_GENERATION' }
  | { type: 'RESET_MINTING' }
  | { type: 'LOAD_PERSISTED_STATE'; payload: Partial<AppState> }
  | { type: 'ADD_OPERATION_HISTORY'; payload: OperationHistoryItem }
  | { type: 'UPDATE_OPERATION_HISTORY'; payload: { id: string; updates: Partial<OperationHistoryItem> } }

// Initial state
const initialState: AppState = {
  prompt: '',
  generatedImage: null,
  tokenURI: null,
  generationState: {
    status: 'idle',
    progress: 0,
    error: null
  },
  mintingState: {
    status: 'idle',
    txHash: null,
    error: null
  },
  error: null,
  operationHistory: [],
  isLoading: false,
  lastUpdated: Date.now()
}

// State reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
      case 'SET_PROMPT':
        return {
          ...state,
          prompt: action.payload,
          error: null, // Clear errors when user changes prompt
          lastUpdated: Date.now()
        }

      case 'START_GENERATION':
        return {
          ...state,
          generationState: {
            status: 'generating',
            progress: 10,
            error: null
          },
          generatedImage: null,
          tokenURI: null,
          error: null,
          isLoading: true,
          lastUpdated: Date.now()
        }

      case 'UPDATE_GENERATION_PROGRESS':
        return {
          ...state,
          generationState: {
            ...state.generationState,
            progress: action.payload.progress,
            status: action.payload.status
          },
          lastUpdated: Date.now()
        }

      case 'GENERATION_SUCCESS':
        return {
          ...state,
          generatedImage: action.payload.imageUrl,
          tokenURI: action.payload.tokenURI,
          generationState: {
            status: 'completed',
            progress: 100,
            error: null
          },
          isLoading: false,
          error: null,
          lastUpdated: Date.now()
        }

      case 'GENERATION_ERROR': {
        const appError = typeof action.payload === 'string' 
          ? classifyError(new Error(action.payload))
          : classifyError(action.payload)
        
        const errorState = appError.toErrorState()
        
        // Report error for monitoring
        reportError(errorState, { operation: 'generation', prompt: state.prompt })
        
        return {
          ...state,
          generationState: {
            status: 'error',
            progress: 0,
            error: errorState.message
          },
          error: errorState,
          isLoading: false,
          lastUpdated: Date.now()
        }
      }

      case 'START_MINTING':
        return {
          ...state,
          mintingState: {
            status: 'preparing',
            txHash: null,
            error: null
          },
          error: null,
          isLoading: true,
          lastUpdated: Date.now()
        }

      case 'UPDATE_MINTING_STATUS':
        return {
          ...state,
          mintingState: {
            ...state.mintingState,
            status: action.payload.status,
            txHash: action.payload.txHash || state.mintingState.txHash
          },
          lastUpdated: Date.now()
        }

      case 'MINTING_SUCCESS':
        return {
          ...state,
          mintingState: {
            status: 'completed',
            txHash: action.payload.txHash,
            error: null
          },
          isLoading: false,
          error: null,
          lastUpdated: Date.now()
        }

      case 'MINTING_ERROR': {
        const appError = typeof action.payload === 'string' 
          ? classifyError(new Error(action.payload))
          : classifyError(action.payload)
        
        const errorState = appError.toErrorState()
        
        // Report error for monitoring
        reportError(errorState, { operation: 'minting', prompt: state.prompt })
        
        return {
          ...state,
          mintingState: {
            status: 'error',
            txHash: null,
            error: errorState.message
          },
          error: errorState,
          isLoading: false,
          lastUpdated: Date.now()
        }
      }

      case 'CLEAR_ERROR':
        return {
          ...state,
          error: null,
          lastUpdated: Date.now()
        }

      case 'RESET_GENERATION':
        return {
          ...state,
          generationState: {
            status: 'idle',
            progress: 0,
            error: null
          },
          generatedImage: null,
          tokenURI: null,
          error: null,
          isLoading: false,
          lastUpdated: Date.now()
        }

      case 'RESET_MINTING':
        return {
          ...state,
          mintingState: {
            status: 'idle',
            txHash: null,
            error: null
          },
          error: null,
          isLoading: false,
          lastUpdated: Date.now()
        }

      case 'LOAD_PERSISTED_STATE': {
        const persistedGenerationState = action.payload.generationState
        const persistedMintingState = action.payload.mintingState
        
        // Determine safe status for generation state
        let safeGenerationStatus: GenerationState['status'] = 'idle'
        if (persistedGenerationState?.status && 
            persistedGenerationState.status !== 'generating' && 
            persistedGenerationState.status !== 'uploading') {
          safeGenerationStatus = persistedGenerationState.status
        }
        
        // Determine safe status for minting state
        let safeMintingStatus: MintingState['status'] = 'idle'
        if (persistedMintingState?.status && 
            persistedMintingState.status !== 'preparing' && 
            persistedMintingState.status !== 'signing' && 
            persistedMintingState.status !== 'mining') {
          safeMintingStatus = persistedMintingState.status
        }
        
        return {
          ...state,
          ...action.payload,
          // Don't persist loading states
          isLoading: false,
          generationState: {
            status: safeGenerationStatus,
            progress: persistedGenerationState?.progress || 0,
            error: persistedGenerationState?.error || null
          },
          mintingState: {
            status: safeMintingStatus,
            txHash: persistedMintingState?.txHash || null,
            error: persistedMintingState?.error || null
          },
          lastUpdated: Date.now()
        }
      }

      case 'ADD_OPERATION_HISTORY':
        return {
          ...state,
          operationHistory: [action.payload, ...state.operationHistory].slice(0, 50), // Keep last 50 operations
          lastUpdated: Date.now()
        }

      case 'UPDATE_OPERATION_HISTORY':
        return {
          ...state,
          operationHistory: state.operationHistory.map(item =>
            item.id === action.payload.id
              ? { ...item, ...action.payload.updates }
              : item
          ),
          lastUpdated: Date.now()
        }

      default:
        return state
    }
  
  // This should never be reached due to the switch statement above
  // but TypeScript requires it for exhaustive checking
}

// Context
interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  
  // Convenience methods
  setPrompt: (prompt: string) => void
  startGeneration: () => void
  updateGenerationProgress: (progress: number, status: GenerationState['status']) => void
  completeGeneration: (imageUrl: string, tokenURI: string) => void
  failGeneration: (error: string | Error | ErrorState) => void
  startMinting: () => void
  updateMintingStatus: (status: MintingState['status'], txHash?: string) => void
  completeMinting: (txHash: string) => void
  failMinting: (error: string | Error | ErrorState) => void
  clearError: () => void
  resetGeneration: () => void
  resetMinting: () => void
  addOperationToHistory: (operation: Omit<OperationHistoryItem, 'id' | 'timestamp'>) => string
  updateOperationInHistory: (id: string, updates: Partial<OperationHistoryItem>) => void
  
  // Computed values
  canGenerate: boolean
  canMint: boolean
  isGenerating: boolean
  isMinting: boolean
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// Storage key for persistence
const STORAGE_KEY = 'promptmint_app_state'

// Persistence utilities
function saveStateToStorage(state: AppState) {
  try {
    const stateToSave = {
      prompt: state.prompt,
      generatedImage: state.generatedImage,
      tokenURI: state.tokenURI,
      generationState: state.generationState,
      mintingState: state.mintingState,
      operationHistory: state.operationHistory,
      lastUpdated: state.lastUpdated
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
  } catch (error) {
    console.warn('Failed to save state to localStorage:', error)
  }
}

function loadStateFromStorage(): Partial<AppState> | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return null
    
    const parsed = JSON.parse(saved)
    
    // Validate the loaded data
    if (typeof parsed !== 'object' || !parsed.lastUpdated) {
      return null
    }
    
    // Don't load state older than 24 hours
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    if (Date.now() - parsed.lastUpdated > maxAge) {
      return null
    }
    
    return parsed
  } catch (error) {
    console.warn('Failed to load state from localStorage:', error)
    return null
  }
}

// Provider component
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Load persisted state on mount
  useEffect(() => {
    const persistedState = loadStateFromStorage()
    if (persistedState) {
      dispatch({ type: 'LOAD_PERSISTED_STATE', payload: persistedState })
    }
  }, [])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    saveStateToStorage(state)
  }, [state])

  // Convenience methods
  const setPrompt = useCallback((prompt: string) => {
    dispatch({ type: 'SET_PROMPT', payload: prompt })
  }, [])

  const startGeneration = useCallback(() => {
    dispatch({ type: 'START_GENERATION' })
  }, [])

  const updateGenerationProgress = useCallback((progress: number, status: GenerationState['status']) => {
    dispatch({ type: 'UPDATE_GENERATION_PROGRESS', payload: { progress, status } })
  }, [])

  const completeGeneration = useCallback((imageUrl: string, tokenURI: string) => {
    dispatch({ type: 'GENERATION_SUCCESS', payload: { imageUrl, tokenURI } })
  }, [])

  const failGeneration = useCallback((error: string | Error | ErrorState) => {
    dispatch({ type: 'GENERATION_ERROR', payload: error })
  }, [])

  const startMinting = useCallback(() => {
    dispatch({ type: 'START_MINTING' })
  }, [])

  const updateMintingStatus = useCallback((status: MintingState['status'], txHash?: string) => {
    dispatch({ type: 'UPDATE_MINTING_STATUS', payload: { status, txHash } })
  }, [])

  const completeMinting = useCallback((txHash: string) => {
    dispatch({ type: 'MINTING_SUCCESS', payload: { txHash } })
  }, [])

  const failMinting = useCallback((error: string | Error | ErrorState) => {
    dispatch({ type: 'MINTING_ERROR', payload: error })
  }, [])

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' })
  }, [])

  const resetGeneration = useCallback(() => {
    dispatch({ type: 'RESET_GENERATION' })
  }, [])

  const resetMinting = useCallback(() => {
    dispatch({ type: 'RESET_MINTING' })
  }, [])

  const addOperationToHistory = useCallback((operation: Omit<OperationHistoryItem, 'id' | 'timestamp'>) => {
    const id = `${operation.type}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    const historyItem: OperationHistoryItem = {
      ...operation,
      id,
      timestamp: Date.now()
    }
    dispatch({ type: 'ADD_OPERATION_HISTORY', payload: historyItem })
    return id
  }, [])

  const updateOperationInHistory = useCallback((id: string, updates: Partial<OperationHistoryItem>) => {
    dispatch({ type: 'UPDATE_OPERATION_HISTORY', payload: { id, updates } })
  }, [])

  // Computed values
  const canGenerate = state.prompt.trim().length > 0 && 
                     state.generationState.status !== 'generating' && 
                     state.generationState.status !== 'uploading' &&
                     state.mintingState.status !== 'preparing' &&
                     state.mintingState.status !== 'signing' &&
                     state.mintingState.status !== 'mining'

  const canMint = state.tokenURI !== null && 
                 state.generatedImage !== null &&
                 state.mintingState.status !== 'preparing' &&
                 state.mintingState.status !== 'signing' &&
                 state.mintingState.status !== 'mining' &&
                 state.mintingState.status !== 'completed'

  const isGenerating = state.generationState.status === 'generating' || 
                      state.generationState.status === 'uploading'

  const isMinting = state.mintingState.status === 'preparing' ||
                   state.mintingState.status === 'signing' ||
                   state.mintingState.status === 'mining'

  const contextValue: AppContextType = {
    state,
    dispatch,
    setPrompt,
    startGeneration,
    updateGenerationProgress,
    completeGeneration,
    failGeneration,
    startMinting,
    updateMintingStatus,
    completeMinting,
    failMinting,
    clearError,
    resetGeneration,
    resetMinting,
    addOperationToHistory,
    updateOperationInHistory,
    canGenerate,
    canMint,
    isGenerating,
    isMinting
  }

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  )
}

// Hook to use the context
export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}