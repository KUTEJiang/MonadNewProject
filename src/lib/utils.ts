import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Network utilities
export function isMonadTestnet(chainId: number): boolean {
  return chainId === 10143
}

export function getNetworkName(chainId: number): string {
  switch (chainId) {
    case 1:
      return 'Ethereum Mainnet'
    case 5:
      return 'Goerli Testnet'
    case 11155111:
      return 'Sepolia Testnet'
    case 10143:
      return 'Monad Testnet'
    default:
      return `Unknown Network (${chainId})`
  }
}

// Address utilities
export function formatAddress(address: string, chars = 4): string {
  if (!address) return ''
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

// Validation utilities
export function isValidPrompt(prompt: string): boolean {
  return prompt.trim().length > 0 && prompt.trim().length <= 1000
}

export function validatePrompt(prompt: string): { isValid: boolean; error?: string } {
  if (!prompt.trim()) {
    return { isValid: false, error: 'Prompt cannot be empty' }
  }
  
  if (prompt.trim().length > 1000) {
    return { isValid: false, error: 'Prompt must be less than 1000 characters' }
  }
  
  return { isValid: true }
}