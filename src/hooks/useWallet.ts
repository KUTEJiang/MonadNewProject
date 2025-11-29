'use client'

import { useAccount, useChainId, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { monadTestnet } from '@/lib/wagmi'
import { ErrorType } from '@/types'

export function useWallet() {
  const { address, isConnected, isConnecting } = useAccount()
  const { connect, connectors, isPending: isConnectPending } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitchPending } = useSwitchChain()

  const isWrongNetwork = isConnected && chainId !== monadTestnet.id
  const isLoading = isConnecting || isConnectPending || isSwitchPending

  const connectWallet = async (connectorId?: string) => {
    try {
      const connector = connectorId 
        ? connectors.find(c => c.id === connectorId)
        : connectors[0] // Default to first available connector

      if (!connector) {
        throw new Error('No wallet connector available')
      }

      await connect({ connector })
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      throw {
        type: ErrorType.WALLET_CONNECTION,
        message: 'Failed to connect wallet',
        details: error,
        retryable: true
      }
    }
  }

  const switchToMonadTestnet = async () => {
    try {
      await switchChain({ chainId: monadTestnet.id })
    } catch (error) {
      console.error('Failed to switch network:', error)
      throw {
        type: ErrorType.NETWORK_MISMATCH,
        message: 'Failed to switch to Monad Testnet',
        details: error,
        retryable: true
      }
    }
  }

  const disconnectWallet = () => {
    disconnect()
  }

  const getWalletStatus = () => {
    if (!isConnected) return 'disconnected'
    if (isWrongNetwork) return 'wrong-network'
    return 'connected'
  }

  const formatAddress = (addr?: string) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return {
    // State
    address,
    isConnected,
    isConnecting,
    isWrongNetwork,
    isLoading,
    chainId,
    connectors,
    
    // Actions
    connectWallet,
    disconnectWallet,
    switchToMonadTestnet,
    
    // Utilities
    getWalletStatus,
    formatAddress,
    
    // Network info
    targetChain: monadTestnet,
  }
}