declare namespace NodeJS {
  interface ProcessEnv {
    // Server-side environment variables
    REPLICATE_API_TOKEN: string;
    WEB3_STORAGE_TOKEN: string;
    
    // Client-side environment variables (NEXT_PUBLIC_*)
    NEXT_PUBLIC_CONTRACT_ADDRESS: string;
    NEXT_PUBLIC_MONAD_RPC_URL: string;
    NEXT_PUBLIC_CHAIN_ID: string;
    NEXT_PUBLIC_APP_NAME: string;
    NEXT_PUBLIC_APP_DESCRIPTION: string;
  }
}