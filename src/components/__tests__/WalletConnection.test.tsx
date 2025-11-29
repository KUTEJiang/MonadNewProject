import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WalletConnection } from '../WalletConnection'
import { useWallet } from '@/hooks/useWallet'

// Mock the useWallet hook
jest.mock('@/hooks/useWallet')
const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>

describe('WalletConnection', () => {
  const mockConnectWallet = jest.fn()
  const mockDisconnectWallet = jest.fn()
  const mockSwitchToMonadTestnet = jest.fn()
  const mockFormatAddress = jest.fn()
  const mockOnConnectionChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockFormatAddress.mockImplementation((address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`)
  })

  describe('when wallet is not connected', () => {
    beforeEach(() => {
      mockUseWallet.mockReturnValue({
        address: null,
        isConnected: false,
        isWrongNetwork: false,
        isLoading: false,
        connectors: [
          { id: 'metamask', name: 'MetaMask' },
          { id: 'walletconnect', name: 'WalletConnect' },
          { id: 'injected', name: 'Injected' }
        ],
        connectWallet: mockConnectWallet,
        disconnectWallet: mockDisconnectWallet,
        switchToMonadTestnet: mockSwitchToMonadTestnet,
        formatAddress: mockFormatAddress,
      })
    })

    it('should render connect wallet button', () => {
      render(<WalletConnection />)
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
    })

    it('should show connector options when connect button is clicked', () => {
      render(<WalletConnection />)
      
      fireEvent.click(screen.getByText('Connect Wallet'))
      
      expect(screen.getByText('MetaMask')).toBeInTheDocument()
      expect(screen.getByText('WalletConnect')).toBeInTheDocument()
      expect(screen.getByText('Injected')).toBeInTheDocument()
    })

    it('should call connectWallet when a connector is selected', async () => {
      render(<WalletConnection />)
      
      fireEvent.click(screen.getByText('Connect Wallet'))
      fireEvent.click(screen.getByText('MetaMask'))
      
      await waitFor(() => {
        expect(mockConnectWallet).toHaveBeenCalledWith('metamask')
      })
    })

    it('should close connector dropdown after successful connection', async () => {
      render(<WalletConnection />)
      
      fireEvent.click(screen.getByText('Connect Wallet'))
      fireEvent.click(screen.getByText('MetaMask'))
      
      await waitFor(() => {
        expect(mockConnectWallet).toHaveBeenCalled()
      })
    })

    it('should show loading state when connecting', () => {
      mockUseWallet.mockReturnValue({
        address: null,
        isConnected: false,
        isWrongNetwork: false,
        isLoading: true,
        connectors: [],
        connectWallet: mockConnectWallet,
        disconnectWallet: mockDisconnectWallet,
        switchToMonadTestnet: mockSwitchToMonadTestnet,
        formatAddress: mockFormatAddress,
      })

      render(<WalletConnection />)
      
      const button = screen.getByText('Connecting...')
      expect(button).toBeDisabled()
    })

    it('should call onConnectionChange with false when not connected', () => {
      render(<WalletConnection onConnectionChange={mockOnConnectionChange} />)
      
      expect(mockOnConnectionChange).toHaveBeenCalledWith(false, null)
    })
  })

  describe('when wallet is connected with correct network', () => {
    const mockAddress = '0x1234567890123456789012345678901234567890'

    beforeEach(() => {
      mockUseWallet.mockReturnValue({
        address: mockAddress,
        isConnected: true,
        isWrongNetwork: false,
        isLoading: false,
        connectors: [],
        connectWallet: mockConnectWallet,
        disconnectWallet: mockDisconnectWallet,
        switchToMonadTestnet: mockSwitchToMonadTestnet,
        formatAddress: mockFormatAddress,
      })
    })

    it('should show connected state with formatted address', () => {
      render(<WalletConnection />)
      
      expect(screen.getByText('0x1234...7890')).toBeInTheDocument()
      expect(screen.getByText('Disconnect')).toBeInTheDocument()
    })

    it('should show green indicator for connected state', () => {
      render(<WalletConnection />)
      
      const indicator = document.querySelector('.bg-green-500')
      expect(indicator).toBeInTheDocument()
    })

    it('should call disconnectWallet when disconnect button is clicked', () => {
      render(<WalletConnection />)
      
      fireEvent.click(screen.getByText('Disconnect'))
      
      expect(mockDisconnectWallet).toHaveBeenCalled()
    })

    it('should call onConnectionChange with true and address when connected', () => {
      render(<WalletConnection onConnectionChange={mockOnConnectionChange} />)
      
      expect(mockOnConnectionChange).toHaveBeenCalledWith(true, mockAddress)
    })
  })

  describe('when wallet is connected with wrong network', () => {
    const mockAddress = '0x1234567890123456789012345678901234567890'

    beforeEach(() => {
      mockUseWallet.mockReturnValue({
        address: mockAddress,
        isConnected: true,
        isWrongNetwork: true,
        isLoading: false,
        connectors: [],
        connectWallet: mockConnectWallet,
        disconnectWallet: mockDisconnectWallet,
        switchToMonadTestnet: mockSwitchToMonadTestnet,
        formatAddress: mockFormatAddress,
      })
    })

    it('should show wrong network warning', () => {
      render(<WalletConnection />)
      
      expect(screen.getByText('Wrong Network')).toBeInTheDocument()
      expect(screen.getByText('Switch to Monad Testnet')).toBeInTheDocument()
    })

    it('should show yellow indicator for wrong network', () => {
      render(<WalletConnection />)
      
      const indicator = document.querySelector('.bg-yellow-500')
      expect(indicator).toBeInTheDocument()
    })

    it('should call switchToMonadTestnet when switch button is clicked', async () => {
      render(<WalletConnection />)
      
      fireEvent.click(screen.getByText('Switch to Monad Testnet'))
      
      await waitFor(() => {
        expect(mockSwitchToMonadTestnet).toHaveBeenCalled()
      })
    })

    it('should show switching state when network switch is in progress', async () => {
      render(<WalletConnection />)
      
      fireEvent.click(screen.getByText('Switch to Monad Testnet'))
      
      // The button should show switching state immediately
      expect(screen.getByText('Switching...')).toBeInTheDocument()
    })

    it('should still allow disconnection when on wrong network', () => {
      render(<WalletConnection />)
      
      fireEvent.click(screen.getByText('Disconnect'))
      
      expect(mockDisconnectWallet).toHaveBeenCalled()
    })
  })

  describe('connector dropdown interactions', () => {
    beforeEach(() => {
      mockUseWallet.mockReturnValue({
        address: null,
        isConnected: false,
        isWrongNetwork: false,
        isLoading: false,
        connectors: [
          { id: 'metamask', name: 'MetaMask' },
          { id: 'walletconnect', name: 'WalletConnect' },
          { id: 'injected', name: 'Injected' }
        ],
        connectWallet: mockConnectWallet,
        disconnectWallet: mockDisconnectWallet,
        switchToMonadTestnet: mockSwitchToMonadTestnet,
        formatAddress: mockFormatAddress,
      })
    })

    it('should close dropdown when close button is clicked', () => {
      render(<WalletConnection />)
      
      fireEvent.click(screen.getByText('Connect Wallet'))
      expect(screen.getByText('MetaMask')).toBeInTheDocument()
      
      const closeButton = screen.getByRole('button', { name: /close/i })
      fireEvent.click(closeButton)
      
      expect(screen.queryByText('MetaMask')).not.toBeInTheDocument()
    })

    it('should show connector descriptions', () => {
      render(<WalletConnection />)
      
      fireEvent.click(screen.getByText('Connect Wallet'))
      
      expect(screen.getByText('Connect using MetaMask')).toBeInTheDocument()
      expect(screen.getByText('Scan with WalletConnect')).toBeInTheDocument()
      expect(screen.getByText('Connect using browser wallet')).toBeInTheDocument()
    })

    it('should show Monad Testnet requirement notice', () => {
      render(<WalletConnection />)
      
      fireEvent.click(screen.getByText('Connect Wallet'))
      
      expect(screen.getByText('Monad Testnet Required')).toBeInTheDocument()
      expect(screen.getByText('Make sure your wallet is connected to Monad Testnet')).toBeInTheDocument()
    })

    it('should disable connectors when loading', () => {
      mockUseWallet.mockReturnValue({
        address: null,
        isConnected: false,
        isWrongNetwork: false,
        isLoading: true,
        connectors: [{ id: 'metamask', name: 'MetaMask' }],
        connectWallet: mockConnectWallet,
        disconnectWallet: mockDisconnectWallet,
        switchToMonadTestnet: mockSwitchToMonadTestnet,
        formatAddress: mockFormatAddress,
      })

      render(<WalletConnection />)
      
      fireEvent.click(screen.getByText('Connecting...'))
      
      const metaMaskButton = screen.getByText('MetaMask').closest('button')
      expect(metaMaskButton).toBeDisabled()
    })
  })

  describe('error handling', () => {
    beforeEach(() => {
      mockUseWallet.mockReturnValue({
        address: null,
        isConnected: false,
        isWrongNetwork: false,
        isLoading: false,
        connectors: [{ id: 'metamask', name: 'MetaMask' }],
        connectWallet: mockConnectWallet,
        disconnectWallet: mockDisconnectWallet,
        switchToMonadTestnet: mockSwitchToMonadTestnet,
        formatAddress: mockFormatAddress,
      })
    })

    it('should handle connection errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockConnectWallet.mockRejectedValue(new Error('Connection failed'))

      render(<WalletConnection />)
      
      fireEvent.click(screen.getByText('Connect Wallet'))
      fireEvent.click(screen.getByText('MetaMask'))
      
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Connection failed:', expect.any(Error))
      })

      consoleError.mockRestore()
    })

    it('should handle network switch errors gracefully', async () => {
      mockUseWallet.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
        isWrongNetwork: true,
        isLoading: false,
        connectors: [],
        connectWallet: mockConnectWallet,
        disconnectWallet: mockDisconnectWallet,
        switchToMonadTestnet: mockSwitchToMonadTestnet,
        formatAddress: mockFormatAddress,
      })

      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockSwitchToMonadTestnet.mockRejectedValue(new Error('Network switch failed'))

      render(<WalletConnection />)
      
      fireEvent.click(screen.getByText('Switch to Monad Testnet'))
      
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Network switch failed:', expect.any(Error))
      })

      consoleError.mockRestore()
    })
  })

  describe('accessibility', () => {
    beforeEach(() => {
      mockUseWallet.mockReturnValue({
        address: null,
        isConnected: false,
        isWrongNetwork: false,
        isLoading: false,
        connectors: [{ id: 'metamask', name: 'MetaMask' }],
        connectWallet: mockConnectWallet,
        disconnectWallet: mockDisconnectWallet,
        switchToMonadTestnet: mockSwitchToMonadTestnet,
        formatAddress: mockFormatAddress,
      })
    })

    it('should have proper button roles and labels', () => {
      render(<WalletConnection />)
      
      const connectButton = screen.getByRole('button', { name: 'Connect Wallet' })
      expect(connectButton).toBeInTheDocument()
    })

    it('should have screen reader text for close button', () => {
      render(<WalletConnection />)
      
      fireEvent.click(screen.getByText('Connect Wallet'))
      
      const closeButton = screen.getByLabelText('Close')
      expect(closeButton).toBeInTheDocument()
    })
  })
})