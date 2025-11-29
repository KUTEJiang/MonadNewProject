import { renderHook, act } from '@testing-library/react'
import { useAppOperations } from '../useAppOperations'
import { useAppContext } from '@/contexts/AppContext'
import { useWallet } from '@/hooks/useWallet'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { getClientConfig } from '@/lib/config'
import { checkNetworkStatus } from '@/lib/errorHandling'

// Mock all dependencies
jest.mock('@/contexts/AppContext')
jest.mock('@/hooks/useWallet')
jest.mock('wagmi')
jest.mock('@/lib/config')
jest.mock('@/lib/errorHandling')

const mockUseAppContext = useAppContext as jest.MockedFunction<typeof useAppContext>
const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>
const mockUseWriteContract = useWriteContract as jest.MockedFunction<typeof useWriteContract>
const mockUseWaitForTransactionReceipt = useWaitForTransactionReceipt as jest.MockedFunction<typeof useWaitForTransactionReceipt>
const mockGetClientConfig = getClientConfig as jest.MockedFunction<typeof getClientConfig>
const mockCheckNetworkStatus = checkNetworkStatus as jest.MockedFunction<typeof checkNetworkStatus>

// Mock fetch globally
global.fetch = jest.fn()

describe('useAppOperations', () => {
  const mockStartGeneration = jest.fn()
  const mockUpdateGenerationProgress = jest.fn()
  const mockCompleteGeneration = jest.fn()
  const mockFailGeneration = jest.fn()
  const mockStartMinting = jest.fn()
  const mockUpdateMintingStatus = jest.fn()
  const mockCompleteMinting = jest.fn()
  const mockFailMinting = jest.fn()
  const mockAddOperationToHistory = jest.fn()
  const mockUpdateOperationInHistory = jest.fn()
  const mockClearError = jest.fn()
  const mockWriteContract = jest.fn()
  const mockResetWrite = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock fetch
    ;(global.fetch as jest.Mock).mockClear()
    
    // Mock network status
    mockCheckNetworkStatus.mockResolvedValue(true)
    
    // Mock app context
    mockUseAppContext.mockReturnValue({
      state: {
        prompt: 'Test prompt',
        generatedImage: null,
        tokenURI: null,
        generationState: { status: 'idle', progress: 0, error: null },
        mintingState: { status: 'idle', txHash: null, error: null },
        error: null,
        operationHistory: [],
        isLoading: false,
        lastUpdated: Date.now()
      },
      startGeneration: mockStartGeneration,
      updateGenerationProgress: mockUpdateGenerationProgress,
      completeGeneration: mockCompleteGeneration,
      failGeneration: mockFailGeneration,
      startMinting: mockStartMinting,
      updateMintingStatus: mockUpdateMintingStatus,
      completeMinting: mockCompleteMinting,
      failMinting: mockFailMinting,
      addOperationToHistory: mockAddOperationToHistory,
      updateOperationInHistory: mockUpdateOperationInHistory,
      clearError: mockClearError
    } as any)

    // Mock wallet
    mockUseWallet.mockReturnValue({
      isConnected: true,
      isWrongNetwork: false
    } as any)

    // Mock wagmi hooks
    mockUseWriteContract.mockReturnValue({
      writeContract: mockWriteContract,
      isPending: false,
      error: null,
      data: null,
      reset: mockResetWrite
    } as any)

    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: false,
      isSuccess: false,
      error: null
    } as any)

    // Mock config
    mockGetClientConfig.mockReturnValue({
      contractAddress: '0x1234567890123456789012345678901234567890'
    } as any)

    // Mock operation history ID
    mockAddOperationToHistory.mockReturnValue('operation-id-123')
  })

  describe('validatePrompt', () => {
    it('should validate empty prompt', () => {
      mockUseAppContext.mockReturnValue({
        ...mockUseAppContext(),
        state: { ...mockUseAppContext().state, prompt: '' }
      } as any)

      const { result } = renderHook(() => useAppOperations())
      
      const validation = result.current.validatePrompt('')
      expect(validation.isValid).toBe(false)
      expect(validation.error?.message).toContain('Please enter a prompt')
    })

    it('should validate short prompt', () => {
      const { result } = renderHook(() => useAppOperations())
      
      const validation = result.current.validatePrompt('ab')
      expect(validation.isValid).toBe(false)
      expect(validation.error?.message).toContain('at least 3 characters')
    })

    it('should validate long prompt', () => {
      const { result } = renderHook(() => useAppOperations())
      
      const longPrompt = 'a'.repeat(501)
      const validation = result.current.validatePrompt(longPrompt)
      expect(validation.isValid).toBe(false)
      expect(validation.error?.message).toContain('less than 500 characters')
    })

    it('should validate valid prompt', () => {
      const { result } = renderHook(() => useAppOperations())
      
      const validation = result.current.validatePrompt('Valid prompt')
      expect(validation.isValid).toBe(true)
      expect(validation.error).toBeUndefined()
    })
  })

  describe('generateImage', () => {
    it('should handle successful image generation', async () => {
      const mockResponse = {
        success: true,
        previewURL: 'https://example.com/image.jpg',
        tokenURI: 'ipfs://test-hash/metadata.json'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const { result } = renderHook(() => useAppOperations())

      await act(async () => {
        await result.current.generateImage()
      })

      expect(mockStartGeneration).toHaveBeenCalled()
      expect(mockAddOperationToHistory).toHaveBeenCalledWith({
        type: 'generation',
        prompt: 'Test prompt',
        status: 'pending'
      })
      expect(mockCompleteGeneration).toHaveBeenCalledWith(
        mockResponse.previewURL,
        mockResponse.tokenURI
      )
    })

    it('should handle network connectivity issues', async () => {
      mockCheckNetworkStatus.mockResolvedValue(false)

      const { result } = renderHook(() => useAppOperations())

      await act(async () => {
        await result.current.generateImage()
      })

      expect(mockFailGeneration).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('No internet connection')
        })
      )
    })

    it('should handle API errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'Server error', code: 'SERVER_ERROR' })
      })

      const { result } = renderHook(() => useAppOperations())

      await act(async () => {
        await result.current.generateImage()
      })

      expect(mockFailGeneration).toHaveBeenCalled()
      expect(mockUpdateOperationInHistory).toHaveBeenCalledWith(
        'operation-id-123',
        { status: 'error', error: expect.any(String) }
      )
    })

    it('should handle invalid prompt', async () => {
      mockUseAppContext.mockReturnValue({
        ...mockUseAppContext(),
        state: { ...mockUseAppContext().state, prompt: '' }
      } as any)

      const { result } = renderHook(() => useAppOperations())

      await act(async () => {
        await result.current.generateImage()
      })

      expect(mockFailGeneration).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Please enter a prompt')
        })
      )
    })

    it('should update progress during generation', async () => {
      const mockResponse = {
        success: true,
        previewURL: 'https://example.com/image.jpg',
        tokenURI: 'ipfs://test-hash/metadata.json'
      }

      ;(global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve(mockResponse)
            })
          }, 100)
        })
      )

      const { result } = renderHook(() => useAppOperations())

      await act(async () => {
        await result.current.generateImage()
      })

      expect(mockUpdateGenerationProgress).toHaveBeenCalled()
    })
  })

  describe('mintNFT', () => {
    beforeEach(() => {
      mockUseAppContext.mockReturnValue({
        ...mockUseAppContext(),
        state: {
          ...mockUseAppContext().state,
          tokenURI: 'ipfs://test-hash/metadata.json',
          prompt: 'Test prompt'
        }
      } as any)
    })

    it('should handle successful minting', async () => {
      const { result } = renderHook(() => useAppOperations())

      await act(async () => {
        await result.current.mintNFT()
      })

      expect(mockStartMinting).toHaveBeenCalled()
      expect(mockAddOperationToHistory).toHaveBeenCalledWith({
        type: 'minting',
        prompt: 'Test prompt',
        status: 'pending'
      })
      expect(mockUpdateMintingStatus).toHaveBeenCalledWith('preparing')
      expect(mockUpdateMintingStatus).toHaveBeenCalledWith('signing')
      expect(mockWriteContract).toHaveBeenCalled()
    })

    it('should handle wallet not connected', async () => {
      mockUseWallet.mockReturnValue({
        isConnected: false,
        isWrongNetwork: false
      } as any)

      const { result } = renderHook(() => useAppOperations())

      await act(async () => {
        await result.current.mintNFT()
      })

      expect(mockFailMinting).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('connect your wallet')
        })
      )
    })

    it('should handle wrong network', async () => {
      mockUseWallet.mockReturnValue({
        isConnected: true,
        isWrongNetwork: true
      } as any)

      const { result } = renderHook(() => useAppOperations())

      await act(async () => {
        await result.current.mintNFT()
      })

      expect(mockFailMinting).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('switch to Monad Testnet')
        })
      )
    })

    it('should handle missing tokenURI', async () => {
      mockUseAppContext.mockReturnValue({
        ...mockUseAppContext(),
        state: {
          ...mockUseAppContext().state,
          tokenURI: null,
          prompt: 'Test prompt'
        }
      } as any)

      const { result } = renderHook(() => useAppOperations())

      await act(async () => {
        await result.current.mintNFT()
      })

      expect(mockFailMinting).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Missing required data')
        })
      )
    })

    it('should handle contract write errors', async () => {
      mockWriteContract.mockRejectedValue(new Error('Transaction failed'))

      const { result } = renderHook(() => useAppOperations())

      await act(async () => {
        await result.current.mintNFT()
      })

      expect(mockFailMinting).toHaveBeenCalled()
      expect(mockUpdateOperationInHistory).toHaveBeenCalledWith(
        'operation-id-123',
        { status: 'error', error: expect.any(String) }
      )
    })

    it('should handle network connectivity issues during minting', async () => {
      mockCheckNetworkStatus.mockResolvedValue(false)

      const { result } = renderHook(() => useAppOperations())

      await act(async () => {
        await result.current.mintNFT()
      })

      expect(mockFailMinting).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('No internet connection')
        })
      )
    })
  })

  describe('transaction handling', () => {
    beforeEach(() => {
      mockUseAppContext.mockReturnValue({
        ...mockUseAppContext(),
        state: {
          ...mockUseAppContext().state,
          mintingState: { status: 'signing', txHash: null, error: null },
          operationHistory: [{
            id: 'test-operation',
            type: 'minting',
            prompt: 'Test prompt',
            status: 'pending',
            timestamp: Date.now()
          }]
        }
      } as any)
    })

    it('should handle transaction hash received', () => {
      const txHash = '0xabcdef123456789'
      
      mockUseWriteContract.mockReturnValue({
        writeContract: mockWriteContract,
        isPending: false,
        error: null,
        data: txHash,
        reset: mockResetWrite
      } as any)

      renderHook(() => useAppOperations())

      expect(mockUpdateMintingStatus).toHaveBeenCalledWith('mining', txHash)
      expect(mockUpdateOperationInHistory).toHaveBeenCalledWith(
        'test-operation',
        expect.objectContaining({
          result: expect.objectContaining({
            txHash,
            explorerUrl: `https://testnet.monadexplorer.com/tx/${txHash}`
          })
        })
      )
    })

    it('should handle transaction success', () => {
      const txHash = '0xabcdef123456789'
      
      mockUseWriteContract.mockReturnValue({
        writeContract: mockWriteContract,
        isPending: false,
        error: null,
        data: txHash,
        reset: mockResetWrite
      } as any)

      mockUseWaitForTransactionReceipt.mockReturnValue({
        isLoading: false,
        isSuccess: true,
        error: null
      } as any)

      mockUseAppContext.mockReturnValue({
        ...mockUseAppContext(),
        state: {
          ...mockUseAppContext().state,
          mintingState: { status: 'mining', txHash, error: null },
          operationHistory: [{
            id: 'test-operation',
            type: 'minting',
            prompt: 'Test prompt',
            status: 'pending',
            timestamp: Date.now()
          }]
        }
      } as any)

      renderHook(() => useAppOperations())

      expect(mockCompleteMinting).toHaveBeenCalledWith(txHash)
      expect(mockUpdateOperationInHistory).toHaveBeenCalledWith(
        'test-operation',
        { status: 'success' }
      )
    })

    it('should handle transaction errors', () => {
      const txError = new Error('Transaction failed')
      
      mockUseWaitForTransactionReceipt.mockReturnValue({
        isLoading: false,
        isSuccess: false,
        error: txError
      } as any)

      mockUseAppContext.mockReturnValue({
        ...mockUseAppContext(),
        state: {
          ...mockUseAppContext().state,
          mintingState: { status: 'mining', txHash: '0x123', error: null },
          operationHistory: [{
            id: 'test-operation',
            type: 'minting',
            prompt: 'Test prompt',
            status: 'pending',
            timestamp: Date.now()
          }]
        }
      } as any)

      renderHook(() => useAppOperations())

      expect(mockFailMinting).toHaveBeenCalled()
      expect(mockUpdateOperationInHistory).toHaveBeenCalledWith(
        'test-operation',
        { status: 'error', error: expect.any(String) }
      )
    })
  })

  describe('retry operations', () => {
    it('should retry generation', async () => {
      const { result } = renderHook(() => useAppOperations())

      await act(async () => {
        result.current.retryGeneration()
      })

      expect(mockClearError).toHaveBeenCalled()
      expect(mockStartGeneration).toHaveBeenCalled()
    })

    it('should retry minting', async () => {
      mockUseAppContext.mockReturnValue({
        ...mockUseAppContext(),
        state: {
          ...mockUseAppContext().state,
          tokenURI: 'ipfs://test-hash/metadata.json',
          prompt: 'Test prompt'
        }
      } as any)

      const { result } = renderHook(() => useAppOperations())

      await act(async () => {
        result.current.retryMinting()
      })

      expect(mockClearError).toHaveBeenCalled()
      expect(mockStartMinting).toHaveBeenCalled()
    })
  })

  describe('utility functions', () => {
    it('should generate correct explorer link', () => {
      const { result } = renderHook(() => useAppOperations())
      
      const txHash = '0xabcdef123456789'
      const explorerLink = result.current.getExplorerLink(txHash)
      
      expect(explorerLink).toBe(`https://testnet.monadexplorer.com/tx/${txHash}`)
    })
  })

  describe('loading states', () => {
    it('should return correct loading states from wagmi', () => {
      mockUseWriteContract.mockReturnValue({
        writeContract: mockWriteContract,
        isPending: true,
        error: null,
        data: null,
        reset: mockResetWrite
      } as any)

      mockUseWaitForTransactionReceipt.mockReturnValue({
        isLoading: true,
        isSuccess: false,
        error: null
      } as any)

      const { result } = renderHook(() => useAppOperations())

      expect(result.current.isWritePending).toBe(true)
      expect(result.current.isTxLoading).toBe(true)
    })
  })
})