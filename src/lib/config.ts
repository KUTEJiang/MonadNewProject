import { AppConfig } from '@/types';

// Validate required environment variables
function validateEnvVar(name: string, value: string | undefined, defaultValue?: string): string {
  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    // During build time, allow missing env vars with placeholder values
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'preview') {
      return `placeholder_${name.toLowerCase()}`;
    }
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Server-side configuration (includes sensitive data)
export function getServerConfig(): Pick<AppConfig, 'replicateApiToken' | 'web3StorageToken'> & { pinataApiKey?: string; pinataSecretKey?: string } {
  return {
    replicateApiToken: validateEnvVar('REPLICATE_API_TOKEN', process.env.REPLICATE_API_TOKEN, ''),
    web3StorageToken: validateEnvVar('WEB3_STORAGE_TOKEN', process.env.WEB3_STORAGE_TOKEN, ''),
    pinataApiKey: validateEnvVar('PINATA_API_KEY', process.env.PINATA_API_KEY, ''),
    pinataSecretKey: validateEnvVar('PINATA_SECRET_KEY', process.env.PINATA_SECRET_KEY, ''),
  };
}

// Client-side configuration (only public data)
export function getClientConfig(): Omit<AppConfig, 'replicateApiToken' | 'web3StorageToken'> {
  return {
    contractAddress: validateEnvVar('NEXT_PUBLIC_CONTRACT_ADDRESS', process.env.NEXT_PUBLIC_CONTRACT_ADDRESS, ''),
    monadRpcUrl: validateEnvVar('NEXT_PUBLIC_MONAD_RPC_URL', process.env.NEXT_PUBLIC_MONAD_RPC_URL, 'https://testnet-rpc.monad.xyz'),
    chainId: parseInt(validateEnvVar('NEXT_PUBLIC_CHAIN_ID', process.env.NEXT_PUBLIC_CHAIN_ID, '10143')),
    appName: validateEnvVar('NEXT_PUBLIC_APP_NAME', process.env.NEXT_PUBLIC_APP_NAME, 'PromptMint'),
    appDescription: validateEnvVar('NEXT_PUBLIC_APP_DESCRIPTION', process.env.NEXT_PUBLIC_APP_DESCRIPTION, 'Generate AI images and mint them as NFTs on Monad Testnet'),
  };
}

// Full configuration (server-side only)
export function getFullConfig(): AppConfig {
  return {
    ...getServerConfig(),
    ...getClientConfig(),
  };
}

// Monad Testnet configuration
export const MONAD_TESTNET = {
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://testnet.monadexplorer.com',
    },
  },
} as const;