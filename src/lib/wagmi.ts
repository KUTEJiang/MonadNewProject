import { http, createConfig, type CreateConnectorFn } from 'wagmi'
import { defineChain } from 'viem'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'
import { getClientConfig } from './config'

const clientConfig = getClientConfig()

// Define Monad Testnet chain
export const monadTestnet = defineChain({
  id: clientConfig.chainId,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: [clientConfig.monadRpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://testnet.monadexplorer.com',
    },
  },
  testnet: true,
})

// Create Wagmi configuration
// Only add WalletConnect if project ID is configured
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
const connectors: CreateConnectorFn[] = [
  injected(),
  metaMask(),
]

if (walletConnectProjectId && walletConnectProjectId !== 'demo-project-id') {
  connectors.push(
    walletConnect({
      projectId: walletConnectProjectId,
    })
  )
} else {
  console.warn('WalletConnect project ID not configured. WalletConnect connector disabled.')
}

export const config = createConfig({
  chains: [monadTestnet],
  connectors,
  transports: {
    [monadTestnet.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}