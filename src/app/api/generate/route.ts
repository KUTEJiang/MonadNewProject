import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { GenerateRequest, GenerateResponse, APIError } from '@/types';
import { uploadToIPFS } from '@/lib/ipfs';

// Input validation function
function validatePrompt(prompt: string): { isValid: boolean; error?: string } {
  if (!prompt || typeof prompt !== 'string') {
    return { isValid: false, error: 'Prompt is required and must be a string' };
  }

  if (prompt.trim().length === 0) {
    return { isValid: false, error: 'Prompt cannot be empty' };
  }

  if (prompt.length > 1000) {
    return { isValid: false, error: 'Prompt must be less than 1000 characters' };
  }

  // Check for potentially harmful content
  const forbiddenWords = ['nsfw', 'explicit', 'violence', 'hate'];
  const lowerPrompt = prompt.toLowerCase();
  for (const word of forbiddenWords) {
    if (lowerPrompt.includes(word)) {
      return { isValid: false, error: 'Prompt contains inappropriate content' };
    }
  }

  return { isValid: true };
}

// Error response helper
function createErrorResponse(error: string, code: string, status: number, details?: unknown): NextResponse<APIError> {
  return NextResponse.json(
    {
      error,
      code,
      details,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

export async function POST(request: NextRequest) {
  try {
    // Check if Doubao API key is configured
    if (!process.env.DOUBAO_API_KEY) {
      console.error('DOUBAO_API_KEY is not configured');
      return createErrorResponse(
        'Image generation service is not configured',
        'MISSING_API_TOKEN',
        500
      );
    }

    // Parse request body
    let body: GenerateRequest;
    try {
      body = await request.json();
    } catch (error) {
      return createErrorResponse(
        'Invalid JSON in request body',
        'INVALID_JSON',
        400,
        error
      );
    }

    // Validate input
    const validation = validatePrompt(body.prompt);
    if (!validation.isValid) {
      return createErrorResponse(
        validation.error!,
        'INVALID_PROMPT',
        400
      );
    }

    console.log('Generating image with Doubao for prompt:', body.prompt);

    // Generate image using Doubao API
    const doubaoResponse = await axios.post(
      process.env.DOUBAO_API_URL || 'https://ark.cn-beijing.volces.com/api/v3/images/generations',
      {
        guidance_scale: 2.5,
        model: 'doubao-seedream-3-0-t2i-250415',
        prompt: body.prompt,
        response_format: 'url',
        seed: 42,
        size: '1024x1024',
        watermark: true,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DOUBAO_API_KEY}`,
        },
        timeout: 60000,
      }
    );

    // Validate Doubao response
    const imageUrl = doubaoResponse.data.data?.[0]?.url;

    if (!imageUrl || typeof imageUrl !== 'string') {
      console.error('Invalid response from Doubao:', doubaoResponse.data);
      return createErrorResponse(
        'Failed to generate image',
        'GENERATION_FAILED',
        500,
        { doubaoResponse: doubaoResponse.data }
      );
    }

    console.log('Image generated successfully with Doubao:', imageUrl);

    // Upload to IPFS
    console.log('Uploading to IPFS...');
    let ipfsResult;
    try {
      ipfsResult = await uploadToIPFS(imageUrl, body.prompt);
      console.log('IPFS upload successful:', ipfsResult);
    } catch (ipfsError) {
      console.error('IPFS upload failed:', ipfsError);
      return createErrorResponse(
        'Failed to upload to IPFS',
        'IPFS_UPLOAD_FAILED',
        500,
        ipfsError instanceof Error ? ipfsError.message : 'Unknown IPFS error'
      );
    }

    // Return success response with image URL and tokenURI
    const result: GenerateResponse = {
      success: true,
      previewURL: ipfsResult.previewURL,
      tokenURI: ipfsResult.tokenURI
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in /api/generate:', error);

    // Handle specific Doubao/Axios errors
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        return createErrorResponse(
          'Authentication failed with Doubao service',
          'AUTH_FAILED',
          401,
          error.response.data
        );
      }

      if (error.response?.status === 429) {
        return createErrorResponse(
          'Rate limit exceeded. Please try again later',
          'RATE_LIMITED',
          429,
          error.response.data
        );
      }

      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return createErrorResponse(
          'Image generation timed out. Please try again',
          'TIMEOUT',
          408,
          error.message
        );
      }

      if (error.response) {
        return createErrorResponse(
          'Doubao API error',
          'API_ERROR',
          error.response.status,
          error.response.data
        );
      }
    }

    if (error instanceof Error) {
      if (error.message.includes('authentication') || error.message.includes('401')) {
        return createErrorResponse(
          'Authentication failed with image generation service',
          'AUTH_FAILED',
          401,
          error.message
        );
      }

      if (error.message.includes('timeout')) {
        return createErrorResponse(
          'Image generation timed out. Please try again',
          'TIMEOUT',
          408,
          error.message
        );
      }
    }

    // Generic error response
    return createErrorResponse(
      'Internal server error during image generation',
      'INTERNAL_ERROR',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return createErrorResponse(
    'Method not allowed. Use POST to generate images',
    'METHOD_NOT_ALLOWED',
    405
  );
}

export async function PUT() {
  return createErrorResponse(
    'Method not allowed. Use POST to generate images',
    'METHOD_NOT_ALLOWED',
    405
  );
}

export async function DELETE() {
  return createErrorResponse(
    'Method not allowed. Use POST to generate images',
    'METHOD_NOT_ALLOWED',
    405
  );
}