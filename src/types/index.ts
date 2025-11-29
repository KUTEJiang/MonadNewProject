// Application State Types
export interface GenerationState {
  status: 'idle' | 'generating' | 'uploading' | 'completed' | 'error';
  progress: number;
  error: string | null;
}

export interface MintingState {
  status: 'idle' | 'preparing' | 'signing' | 'mining' | 'completed' | 'error';
  txHash: string | null;
  error: string | null;
}

export interface AppState {
  prompt: string;
  generatedImage: string | null;
  tokenURI: string | null;
  isGenerating: boolean;
  isMinting: boolean;
  txHash: string | null;
}

// API Types
export interface GenerateRequest {
  prompt: string;
}

export interface GenerateResponse {
  success: boolean;
  tokenURI?: string;
  previewURL?: string;
  error?: string;
}

export interface IPFSUploadResult {
  cid: string;
  tokenURI: string;
  previewURL: string;
}

export interface APIError {
  error: string;
  code: string;
  details?: unknown;
  timestamp: string;
}

// NFT Metadata Types
export interface NFTMetadata {
  name: string;
  description: string;
  image: string; // IPFS URL
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
  prompt: string;
  created_at: string;
  generated_by: string;
}

// Error Types
export enum ErrorType {
  WALLET_CONNECTION = 'WALLET_CONNECTION',
  NETWORK_MISMATCH = 'NETWORK_MISMATCH',
  GENERATION_FAILED = 'GENERATION_FAILED',
  IPFS_UPLOAD_FAILED = 'IPFS_UPLOAD_FAILED',
  MINTING_FAILED = 'MINTING_FAILED',
  PROMPT_ALREADY_USED = 'PROMPT_ALREADY_USED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  CONTENT_POLICY_ERROR = 'CONTENT_POLICY_ERROR',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  USER_REJECTED = 'USER_REJECTED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ErrorState {
  type: ErrorType;
  message: string;
  details?: unknown;
  retryable: boolean;
  timestamp: number;
  retryCount?: number;
  maxRetries?: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

// Configuration Types
export interface AppConfig {
  contractAddress: string;
  replicateApiToken: string;
  web3StorageToken: string;
  monadRpcUrl: string;
  chainId: number;
  appName: string;
  appDescription: string;
}

// Component Props Types
export interface WalletConnectionProps {
  onConnect: () => void;
  onDisconnect: () => void;
  isConnected: boolean;
  address: string | null;
}

export interface ImageGenerationProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  generatedImage: string | null;
}

export interface NFTMintingProps {
  tokenURI: string | null;
  onMint: () => void;
  isMinting: boolean;
  txHash: string | null;
}