'use client'

import { useCallback, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { keccak256, toBytes } from 'viem'
import { useAppContext } from '@/contexts/AppContext'
import { useWallet } from '@/hooks/useWallet'
import { getClientConfig } from '@/lib/config'
import { GenerateRequest, GenerateResponse, APIError, ErrorType } from '@/types'
import { withRetry, classifyError, AppError, checkNetworkStatus } from '@/lib/errorHandling'

// Contract ABI for the mint function
const PROMPT_MINT_ABI = [
  {
    inputs: [
      { name: 'promptHash', type: 'bytes32' },
      { name: 'tokenURI', type: 'string' }
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'promptHash', type: 'bytes32' }],
    name: 'isPromptUsed',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

export function useAppOperations() {
  const {
    state,
    startGeneration,
    updateGenerationProgress,
    completeGeneration,
    failGeneration,
    startMinting,
    updateMintingStatus,
    completeMinting,
    failMinting,
    addOperationToHistory,
    updateOperationInHistory,
    clearError
  } = useAppContext()

  const { isConnected, isWrongNetwork } = useWallet()
  const config = getClientConfig()

  // Wagmi hooks for contract interaction
  const { 
    writeContract, 
    isPending: isWritePending, 
    error: writeError, 
    data: txHash,
    reset: resetWrite
  } = useWriteContract()

  const { 
    isLoading: isTxLoading, 
    isSuccess: isTxSuccess,
    error: txError
  } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // Input validation
  const validatePrompt = useCallback((prompt: string): { isValid: boolean; error?: AppError } => {
    const trimmedPrompt = prompt.trim()
    
    if (!trimmedPrompt) {
      return { 
        isValid: false, 
        error: new AppError(
          ErrorType.VALIDATION_ERROR,
          'Please enter a prompt to generate an image',
          false
        )
      }
    }
    
    if (trimmedPrompt.length < 3) {
      return { 
        isValid: false, 
        error: new AppError(
          ErrorType.VALIDATION_ERROR,
          'Prompt must be at least 3 characters long',
          false
        )
      }
    }
    
    if (trimmedPrompt.length > 500) {
      return { 
        isValid: false, 
        error: new AppError(
          ErrorType.VALIDATION_ERROR,
          'Prompt must be less than 500 characters',
          false
        )
      }
    }
    
    return { isValid: true }
  }, [])

  // Generate image operation
  const generateImage = useCallback(async () => {
    // Check network connectivity first
    const isOnline = await checkNetworkStatus()
    if (!isOnline) {
      failGeneration(new AppError(
        ErrorType.NETWORK_ERROR,
        'No internet connection. Please check your network and try again.',
        true
      ))
      return
    }

    const validation = validatePrompt(state.prompt)
    if (!validation.isValid) {
      failGeneration(validation.error!)
      return
    }

    // Start generation and add to history
    startGeneration()
    const operationId = addOperationToHistory({
      type: 'generation',
      prompt: state.prompt.trim(),
      status: 'pending'
    })

    try {
      const data = await withRetry(
        async () => {
          // Simulate progress updates
          const progressInterval = setInterval(() => {
            updateGenerationProgress(
              Math.min(state.generationState.progress + 10, 80),
              'generating'
            )
          }, 500)

          try {
            const requestBody: GenerateRequest = { prompt: state.prompt.trim() }
            
            const response = await fetch('/api/generate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody),
            })

            clearInterval(progressInterval)

            if (!response.ok) {
              const errorData: APIError = await response.json()
              
              // Map API error codes to appropriate error types
              let errorType = ErrorType.GENERATION_FAILED
              if (errorData.code === 'RATE_LIMITED') {
                errorType = ErrorType.RATE_LIMIT_ERROR
              } else if (errorData.code === 'TIMEOUT') {
                errorType = ErrorType.TIMEOUT_ERROR
              } else if (errorData.code === 'AUTH_FAILED') {
                errorType = ErrorType.AUTHENTICATION_ERROR
              } else if (errorData.code === 'CONTENT_POLICY_VIOLATION') {
                errorType = ErrorType.CONTENT_POLICY_ERROR
              }
              
              throw new AppError(
                errorType,
                errorData.error || `HTTP ${response.status}: ${response.statusText}`,
                errorType === ErrorType.RATE_LIMIT_ERROR || errorType === ErrorType.TIMEOUT_ERROR,
                errorData
              )
            }

            // Update progress to uploading
            updateGenerationProgress(90, 'uploading')

            const data: GenerateResponse = await response.json()
            
            if (!data.success) {
              throw new AppError(
                ErrorType.GENERATION_FAILED,
                data.error || 'Generation failed',
                true
              )
            }

            if (!data.previewURL || !data.tokenURI) {
              throw new AppError(
                ErrorType.GENERATION_FAILED,
                'Invalid response: missing image URL or token URI',
                true,
                data
              )
            }

            return data
          } finally {
            clearInterval(progressInterval)
          }
        },
        {
          maxRetries: 2,
          baseDelay: 1000,
          maxDelay: 5000,
          backoffMultiplier: 2
        },
        (attempt, error) => {
          console.warn(`Generation attempt ${attempt} failed:`, error.message)
          updateGenerationProgress(10, 'generating') // Reset progress for retry
        }
      )

      // Success - update state and history
      if (!data.previewURL || !data.tokenURI) {
        throw new AppError(
          ErrorType.GENERATION_FAILED,
          'Invalid response: missing image URL or token URI',
          true,
          data
        )
      }
      
      completeGeneration(data.previewURL, data.tokenURI)
      updateOperationInHistory(operationId, {
        status: 'success',
        result: {
          imageUrl: data.previewURL,
          tokenURI: data.tokenURI
        }
      })

    } catch (error) {
      console.error('Image generation failed:', error)
      
      const appError = classifyError(error)
      failGeneration(appError)
      updateOperationInHistory(operationId, {
        status: 'error',
        error: appError.message
      })
    }
  }, [
    state.prompt,
    state.generationState.progress,
    validatePrompt,
    startGeneration,
    updateGenerationProgress,
    completeGeneration,
    failGeneration,
    addOperationToHistory,
    updateOperationInHistory
  ])

  // Mint NFT operation
  const mintNFT = useCallback(async () => {
    // Validation checks
    if (!isConnected) {
      failMinting(new AppError(
        ErrorType.WALLET_CONNECTION,
        'Please connect your wallet first',
        false
      ))
      return
    }

    if (isWrongNetwork) {
      failMinting(new AppError(
        ErrorType.NETWORK_MISMATCH,
        'Please switch to Monad Testnet in your wallet',
        false
      ))
      return
    }

    if (!state.tokenURI || !state.prompt.trim()) {
      failMinting(new AppError(
        ErrorType.VALIDATION_ERROR,
        'Missing required data for minting',
        false
      ))
      return
    }

    // Check network connectivity
    const isOnline = await checkNetworkStatus()
    if (!isOnline) {
      failMinting(new AppError(
        ErrorType.NETWORK_ERROR,
        'No internet connection. Please check your network and try again.',
        true
      ))
      return
    }

    // Start minting and add to history
    startMinting()
    const operationId = addOperationToHistory({
      type: 'minting',
      prompt: state.prompt.trim(),
      status: 'pending'
    })

    try {
      // Set minting state to preparing
      updateMintingStatus('preparing')

      // Calculate prompt hash
      const promptHash = keccak256(toBytes(state.prompt.trim()))
      console.log('Calculated prompt hash:', promptHash)

      // Set minting state to signing
      updateMintingStatus('signing')

      // Reset any previous write errors
      resetWrite()

      // Call the smart contract mint function with retry logic
      if (!state.tokenURI) {
        throw new Error('Token URI is required for minting')
      }

      const tokenURI = state.tokenURI; // Type-safe local variable

      await withRetry(
        async () => {
          await writeContract({
            address: config.contractAddress as `0x${string}`,
            abi: PROMPT_MINT_ABI,
            functionName: 'mint',
            args: [promptHash, tokenURI],
          })
        },
        {
          maxRetries: 1, // Only retry once for blockchain transactions
          baseDelay: 2000,
          maxDelay: 5000,
          backoffMultiplier: 1.5
        },
        (attempt, error) => {
          console.warn(`Minting attempt ${attempt} failed:`, error.message)
        }
      )

      console.log('Transaction submitted successfully')

    } catch (error) {
      console.error('Minting failed:', error)
      
      const appError = classifyError(error)
      failMinting(appError)
      updateOperationInHistory(operationId, {
        status: 'error',
        error: appError.message
      })
    }
  }, [
    isConnected,
    isWrongNetwork,
    state.tokenURI,
    state.prompt,
    config.contractAddress,
    writeContract,
    resetWrite,
    startMinting,
    updateMintingStatus,
    failMinting,
    addOperationToHistory,
    updateOperationInHistory
  ])

  // Handle transaction hash received
  useEffect(() => {
    if (txHash && state.mintingState.status === 'signing') {
      console.log('Transaction hash received:', txHash)
      updateMintingStatus('mining', txHash)
      
      // Update operation history with transaction hash
      const mintingOperation = state.operationHistory.find(
        op => op.type === 'minting' && op.status === 'pending'
      )
      if (mintingOperation) {
        updateOperationInHistory(mintingOperation.id, {
          result: {
            ...mintingOperation.result,
            txHash,
            explorerUrl: `https://testnet.monadexplorer.com/tx/${txHash}`
          }
        })
      }
    }
  }, [txHash, state.mintingState.status, state.operationHistory, updateMintingStatus, updateOperationInHistory])

  // Handle transaction completion
  useEffect(() => {
    if (isTxSuccess && state.mintingState.status === 'mining' && txHash) {
             // Get transaction receipt to extract Token ID from event logs
       const getTransactionReceipt = async () => {
         try {
           const response = await fetch(`https://testnet.monadexplorer.com/api/v2/transactions/${txHash}`)
           const data = await response.json()
           const receipt = data.data
           
           // Look for PromptMinted event in logs
           let tokenId: string | undefined
           if (receipt?.logs) {
             for (const log of receipt.logs) {
               // Check if this is a PromptMinted event 
               // You would need to replace this with the actual event signature
               if (log.topics && log.topics.length > 3) {
                 // Parse the event data to extract tokenId
                 // The tokenId is typically in the third topic (after event signature and indexed parameters)
                 try {
                   // Convert hex to decimal for token ID
                   tokenId = parseInt(log.topics[3], 16).toString()
                   break
                 } catch (e) {
                   console.warn('Failed to parse tokenId from log:', e)
                 }
               }
             }
           }
          
          completeMinting(txHash)
          
          // Update operation history with success and token ID
          const mintingOperation = state.operationHistory.find(
            op => op.type === 'minting' && op.status === 'pending'
          )
          if (mintingOperation) {
            updateOperationInHistory(mintingOperation.id, {
              status: 'success',
              result: {
                ...mintingOperation.result,
                tokenId
              }
            })
          }
        } catch (error) {
          console.warn('Failed to get transaction receipt:', error)
          // Fallback to just completing without token ID
          completeMinting(txHash)
          
          const mintingOperation = state.operationHistory.find(
            op => op.type === 'minting' && op.status === 'pending'
          )
          if (mintingOperation) {
            updateOperationInHistory(mintingOperation.id, {
              status: 'success'
            })
          }
        }
      }
      
      getTransactionReceipt()
    }
  }, [isTxSuccess, state.mintingState.status, txHash, state.operationHistory, completeMinting, updateOperationInHistory])

  // Handle write contract errors
  useEffect(() => {
    if (writeError && state.mintingState.status !== 'error') {
      console.error('Write contract error:', writeError)
      
      const appError = classifyError(writeError)
      failMinting(appError)
      
      // Update operation history with error
      const mintingOperation = state.operationHistory.find(
        op => op.type === 'minting' && op.status === 'pending'
      )
      if (mintingOperation) {
        updateOperationInHistory(mintingOperation.id, {
          status: 'error',
          error: appError.message
        })
      }
    }
  }, [writeError, state.mintingState.status, state.operationHistory, failMinting, updateOperationInHistory])

  // Handle transaction errors
  useEffect(() => {
    if (txError && state.mintingState.status === 'mining') {
      console.error('Transaction error:', txError)
      
      const appError = classifyError(txError)
      failMinting(appError)
      
      // Update operation history with error
      const mintingOperation = state.operationHistory.find(
        op => op.type === 'minting' && op.status === 'pending'
      )
      if (mintingOperation) {
        updateOperationInHistory(mintingOperation.id, {
          status: 'error',
          error: appError.message
        })
      }
    }
  }, [txError, state.mintingState.status, state.operationHistory, failMinting, updateOperationInHistory])

  // Retry operations
  const retryGeneration = useCallback(() => {
    clearError()
    generateImage()
  }, [clearError, generateImage])

  const retryMinting = useCallback(() => {
    clearError()
    mintNFT()
  }, [clearError, mintNFT])

  // Get explorer link for transaction
  const getExplorerLink = useCallback((txHash: string) => {
    return `https://testnet.monadexplorer.com/tx/${txHash}`
  }, [])

  return {
    // Operations
    generateImage,
    mintNFT,
    retryGeneration,
    retryMinting,
    
    // Validation
    validatePrompt,
    
    // Utilities
    getExplorerLink,
    
    // Loading states (from wagmi)
    isWritePending,
    isTxLoading,
    
    // Transaction info
    txHash,
    isTxSuccess
  }
}