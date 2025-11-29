'use client'

import { useWallet } from '@/hooks/useWallet'
import { useEffect, useState } from 'react'

interface WalletConnectionComponentProps {
  onConnectionChange?: (isConnected: boolean, address: string | null) => void
}

export function WalletConnection({ onConnectionChange }: WalletConnectionComponentProps) {
  const {
    address,
    isConnected,
    isWrongNetwork,
    isLoading,
    connectors,
    connectWallet,
    disconnectWallet,
    switchToMonadTestnet,
    formatAddress,
  } = useWallet()
  
  const [showConnectors, setShowConnectors] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)

  // Notify parent component of connection changes
  useEffect(() => {
    onConnectionChange?.(isConnected, address || null)
  }, [isConnected, address, onConnectionChange])

  const handleConnect = async (connectorId: string) => {
    try {
      await connectWallet(connectorId)
      setShowConnectors(false)
    } catch (error) {
      console.error('Connection failed:', error)
    }
  }

  const handleSwitchNetwork = async () => {
    try {
      setIsSwitching(true)
      await switchToMonadTestnet()
    } catch (error) {
      console.error('Network switch failed:', error)
    } finally {
      setIsSwitching(false)
    }
  }

  if (isConnected && !isWrongNetwork) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium">
            {formatAddress(address!)}
          </span>
        </div>
        <button
          onClick={disconnectWallet}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Disconnect
        </button>
      </div>
    )
  }

  if (isWrongNetwork) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-yellow-50 text-yellow-700 px-3 py-2 rounded-lg">
          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          <span className="text-sm font-medium">Wrong Network</span>
        </div>
        <button
          onClick={handleSwitchNetwork}
          disabled={isSwitching}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSwitching ? 'Switching...' : 'Switch to Monad Testnet'}
        </button>
        <button
          onClick={disconnectWallet}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      {!showConnectors ? (
        <button
          onClick={() => setShowConnectors(true)}
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <div className="absolute right-0 top-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-64 z-10">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-gray-900">Connect Wallet</h3>
            <button
              onClick={() => setShowConnectors(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-2">
            {connectors.map((connector) => (
              <button
                key={connector.id}
                onClick={() => handleConnect(connector.id)}
                disabled={isLoading}
                className="w-full flex items-center gap-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  {connector.name === 'MetaMask' && (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  )}
                  {connector.name === 'WalletConnect' && (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5.5 8.5c3.5-3.5 9.5-3.5 13 0l.5.5-2 2-.5-.5c-2.5-2.5-6.5-2.5-9 0l-.5.5-2-2 .5-.5zm7 7c1.5-1.5 1.5-3.5 0-5s-3.5-1.5-5 0-1.5 3.5 0 5 3.5 1.5 5 0z"/>
                    </svg>
                  )}
                  {connector.name === 'Injected' && (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{connector.name}</div>
                  <div className="text-sm text-gray-500">
                    {connector.name === 'MetaMask' && 'Connect using MetaMask'}
                    {connector.name === 'WalletConnect' && 'Scan with WalletConnect'}
                    {connector.name === 'Injected' && 'Connect using browser wallet'}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-700">
              <div className="font-medium mb-1">Monad Testnet Required</div>
              <div>Make sure your wallet is connected to Monad Testnet</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}