import { http, createConfig } from 'wagmi'
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
export const config = createConfig({
  chains: [monadTestnet],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
    }),
  ],
  transports: {
    [monadTestnet.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}