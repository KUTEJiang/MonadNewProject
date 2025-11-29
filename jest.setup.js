import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock wagmi hooks
jest.mock('wagmi', () => ({
  useAccount: jest.fn(() => ({
    address: undefined,
    isConnected: false,
    isConnecting: false,
    isDisconnected: true,
  })),
  useConnect: jest.fn(() => ({
    connect: jest.fn(),
    connectors: [],
    isLoading: false,
    pendingConnector: null,
  })),
  useDisconnect: jest.fn(() => ({
    disconnect: jest.fn(),
  })),
  useSwitchChain: jest.fn(() => ({
    switchChain: jest.fn(),
    isLoading: false,
  })),
  useWriteContract: jest.fn(() => ({
    writeContract: jest.fn(),
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null,
  })),
  useWaitForTransactionReceipt: jest.fn(() => ({
    isLoading: false,
    isSuccess: false,
    isError: false,
    data: null,
  })),
  useReadContract: jest.fn(() => ({
    data: null,
    isLoading: false,
    isError: false,
  })),
}))

// Mock viem
jest.mock('viem', () => ({
  keccak256: jest.fn((data) => `0x${data.slice(2)}hash`),
  toUtf8Bytes: jest.fn((str) => `0x${Buffer.from(str).toString('hex')}`),
  formatEther: jest.fn((value) => '0.0'),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890'
process.env.NEXT_PUBLIC_MONAD_RPC_URL = 'https://testnet-rpc.monad.xyz'

// Mock fetch for API calls
global.fetch = jest.fn()

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}