import { NFTMetadata, IPFSUploadResult } from '@/types';

// Download image from URL and convert to File
async function downloadImageAsFile(imageUrl: string, filename: string): Promise<File> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type });
}

// Upload file to Pinata IPFS
async function uploadToPinata(file: File): Promise<string> {
  const pinataApiKey = process.env.PINATA_API_KEY;
  const pinataSecretKey = process.env.PINATA_SECRET_KEY;
  
  if (!pinataApiKey || !pinataSecretKey) {
    throw new Error('Pinata API keys not configured');
  }

  const formData = new FormData();
  formData.append('file', file);
  
  // Add metadata
  const metadata = JSON.stringify({
    name: file.name,
    keyvalues: {
      uploadedBy: 'PromptMint',
      timestamp: new Date().toISOString()
    }
  });
  formData.append('pinataMetadata', metadata);

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      'pinata_api_key': pinataApiKey,
      'pinata_secret_api_key': pinataSecretKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pinata upload failed: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return result.IpfsHash;
}

// Upload image and metadata to IPFS
export async function uploadToIPFS(
  imageUrl: string,
  prompt: string,
  retryCount = 3
): Promise<IPFSUploadResult> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`IPFS upload attempt ${attempt}/${retryCount}`);
      
      // Download the image
      const imageFile = await downloadImageAsFile(imageUrl, 'generated-image.png');
      
      // Upload image to IPFS
      const imageCid = await uploadToPinata(imageFile);
      const imageIPFSUrl = `ipfs://${imageCid}`;
      
      console.log('Image uploaded to IPFS:', imageIPFSUrl);
      
      // Create NFT metadata
      const metadata: NFTMetadata = {
        name: `AI Generated Art: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`,
        description: `AI-generated artwork created from the prompt: "${prompt}"`,
        image: imageIPFSUrl,
        attributes: [
          {
            trait_type: "Generation Method",
            value: "DALL-E-3"
          },
          {
            trait_type: "Created At",
            value: new Date().toISOString().split('T')[0]
          },
          {
            trait_type: "Prompt Length",
            value: prompt.length.toString()
          }
        ],
        prompt: prompt,
        created_at: new Date().toISOString(),
        generated_by: "PromptMint"
      };
      
      // Upload metadata to IPFS
      const metadataFile = new File(
        [JSON.stringify(metadata, null, 2)],
        'metadata.json',
        { type: 'application/json' }
      );
      
      const metadataCid = await uploadToPinata(metadataFile);
      const tokenURI = `ipfs://${metadataCid}`;
      
      console.log('Metadata uploaded to IPFS:', tokenURI);
      
      // Create preview URL (using a public IPFS gateway)
      const previewURL = `https://ipfs.io/ipfs/${imageCid}`;
      
      return {
        cid: metadataCid,
        tokenURI,
        previewURL
      };
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`IPFS upload attempt ${attempt} failed:`, lastError.message);
      
      if (attempt < retryCount) {
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`IPFS upload failed after ${retryCount} attempts: ${lastError?.message}`);
}

// Test Pinata connection
export async function testPinataConnection(): Promise<boolean> {
  const pinataApiKey = process.env.PINATA_API_KEY;
  const pinataSecretKey = process.env.PINATA_SECRET_KEY;
  
  if (!pinataApiKey || !pinataSecretKey) {
    return false;
  }

  try {
    const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
      method: 'GET',
      headers: {
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretKey,
      },
    });
    
    return response.ok;
  } catch (error) {
    console.error('Pinata connection test failed:', error);
    return false;
  }
}