import { POST } from '../generate/route'
import { NextRequest } from 'next/server'

// Mock the external dependencies
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      images: {
        generate: jest.fn()
      }
    }))
  }
})

jest.mock('@/lib/ipfs', () => ({
  uploadToIPFS: jest.fn()
}))

// Import mocked modules
import OpenAI from 'openai'
import { uploadToIPFS } from '@/lib/ipfs'

const mockOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>
const mockUploadToIPFS = uploadToIPFS as jest.MockedFunction<typeof uploadToIPFS>

describe('/api/generate', () => {
  let mockGenerate: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup OpenAI mock
    mockGenerate = jest.fn()
    mockOpenAI.mockImplementation(() => ({
      images: {
        generate: mockGenerate
      }
    } as any))

    // Mock environment variables
    process.env.OPENAI_API_KEY = 'test-api-key'
    process.env.WEB3_STORAGE_TOKEN = 'test-storage-token'
  })

  const createMockRequest = (body: any): NextRequest => {
    return new NextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  describe('successful generation', () => {
    it('should generate image and upload to IPFS successfully', async () => {
      const mockImageResponse = {
        data: [{
          url: 'https://example.com/generated-image.jpg'
        }]
      }

      const mockIPFSResponse = {
        tokenURI: 'ipfs://QmTestHash/metadata.json',
        previewURL: 'https://ipfs.io/ipfs/QmTestHash/image.jpg'
      }

      mockGenerate.mockResolvedValue(mockImageResponse)
      mockUploadToIPFS.mockResolvedValue(mockIPFSResponse)

      const request = createMockRequest({ prompt: 'A beautiful sunset' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        tokenURI: mockIPFSResponse.tokenURI,
        previewURL: mockIPFSResponse.previewURL
      })

      expect(mockGenerate).toHaveBeenCalledWith({
        model: 'dall-e-3',
        prompt: 'A beautiful sunset',
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'url'
      })

      expect(mockUploadToIPFS).toHaveBeenCalledWith(
        mockImageResponse.data[0].url,
        'A beautiful sunset'
      )
    })

    it('should handle different prompt lengths', async () => {
      const longPrompt = 'A very long and detailed prompt that describes exactly what should be in the image with lots of specific details and requirements'
      
      const mockImageResponse = {
        data: [{ url: 'https://example.com/image.jpg' }]
      }

      const mockIPFSResponse = {
        tokenURI: 'ipfs://QmHash/metadata.json',
        previewURL: 'https://ipfs.io/ipfs/QmHash/image.jpg'
      }

      mockGenerate.mockResolvedValue(mockImageResponse)
      mockUploadToIPFS.mockResolvedValue(mockIPFSResponse)

      const request = createMockRequest({ prompt: longPrompt })
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: longPrompt
        })
      )
    })
  })

  describe('input validation', () => {
    it('should return 400 for missing prompt', async () => {
      const request = createMockRequest({})
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        error: 'Prompt is required',
        code: 'MISSING_PROMPT'
      })
    })

    it('should return 400 for empty prompt', async () => {
      const request = createMockRequest({ prompt: '' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        error: 'Prompt is required',
        code: 'MISSING_PROMPT'
      })
    })

    it('should return 400 for whitespace-only prompt', async () => {
      const request = createMockRequest({ prompt: '   ' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        error: 'Prompt is required',
        code: 'MISSING_PROMPT'
      })
    })

    it('should return 400 for non-string prompt', async () => {
      const request = createMockRequest({ prompt: 123 })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        error: 'Prompt must be a string',
        code: 'INVALID_PROMPT_TYPE'
      })
    })

    it('should return 400 for prompt that is too long', async () => {
      const veryLongPrompt = 'a'.repeat(1001) // Assuming 1000 is the limit
      
      const request = createMockRequest({ prompt: veryLongPrompt })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.code).toBe('PROMPT_TOO_LONG')
    })
  })

  describe('OpenAI API errors', () => {
    it('should handle OpenAI rate limiting', async () => {
      const rateLimitError = new Error('Rate limit exceeded')
      ;(rateLimitError as any).status = 429
      mockGenerate.mockRejectedValue(rateLimitError)

      const request = createMockRequest({ prompt: 'Test prompt' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data).toEqual({
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        code: 'RATE_LIMITED'
      })
    })

    it('should handle OpenAI content policy violations', async () => {
      const contentPolicyError = new Error('Content policy violation')
      ;(contentPolicyError as any).status = 400
      ;(contentPolicyError as any).code = 'content_policy_violation'
      mockGenerate.mockRejectedValue(contentPolicyError)

      const request = createMockRequest({ prompt: 'Inappropriate content' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        error: 'Content violates OpenAI usage policies. Please modify your prompt.',
        code: 'CONTENT_POLICY_VIOLATION'
      })
    })

    it('should handle OpenAI authentication errors', async () => {
      const authError = new Error('Invalid API key')
      ;(authError as any).status = 401
      mockGenerate.mockRejectedValue(authError)

      const request = createMockRequest({ prompt: 'Test prompt' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        error: 'Service configuration error. Please try again later.',
        code: 'AUTH_FAILED'
      })
    })

    it('should handle OpenAI timeout errors', async () => {
      const timeoutError = new Error('Request timeout')
      ;(timeoutError as any).code = 'ECONNABORTED'
      mockGenerate.mockRejectedValue(timeoutError)

      const request = createMockRequest({ prompt: 'Test prompt' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(408)
      expect(data).toEqual({
        success: false,
        error: 'Request timed out. Please try again.',
        code: 'TIMEOUT'
      })
    })

    it('should handle generic OpenAI errors', async () => {
      const genericError = new Error('Something went wrong')
      mockGenerate.mockRejectedValue(genericError)

      const request = createMockRequest({ prompt: 'Test prompt' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        error: 'Failed to generate image. Please try again.',
        code: 'GENERATION_FAILED'
      })
    })
  })

  describe('IPFS upload errors', () => {
    it('should handle IPFS upload failures', async () => {
      const mockImageResponse = {
        data: [{ url: 'https://example.com/image.jpg' }]
      }

      mockGenerate.mockResolvedValue(mockImageResponse)
      mockUploadToIPFS.mockRejectedValue(new Error('IPFS upload failed'))

      const request = createMockRequest({ prompt: 'Test prompt' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        error: 'Failed to upload to IPFS. Please try again.',
        code: 'IPFS_UPLOAD_FAILED'
      })
    })

    it('should handle IPFS network errors', async () => {
      const mockImageResponse = {
        data: [{ url: 'https://example.com/image.jpg' }]
      }

      const networkError = new Error('Network error')
      ;(networkError as any).code = 'ENOTFOUND'

      mockGenerate.mockResolvedValue(mockImageResponse)
      mockUploadToIPFS.mockRejectedValue(networkError)

      const request = createMockRequest({ prompt: 'Test prompt' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.code).toBe('IPFS_UPLOAD_FAILED')
    })
  })

  describe('malformed requests', () => {
    it('should handle invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/generate', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.code).toBe('INVALID_JSON')
    })

    it('should handle missing content-type header', async () => {
      const request = new NextRequest('http://localhost:3000/api/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt: 'Test prompt' })
      })

      const response = await POST(request)
      
      // Should still work as Next.js handles this gracefully
      expect(response.status).not.toBe(415)
    })
  })

  describe('environment configuration', () => {
    it('should handle missing OpenAI API key', async () => {
      delete process.env.OPENAI_API_KEY

      const request = createMockRequest({ prompt: 'Test prompt' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        error: 'Service configuration error. Please try again later.',
        code: 'CONFIG_ERROR'
      })
    })

    it('should handle missing Web3 Storage token', async () => {
      delete process.env.WEB3_STORAGE_TOKEN

      const mockImageResponse = {
        data: [{ url: 'https://example.com/image.jpg' }]
      }

      mockGenerate.mockResolvedValue(mockImageResponse)

      const request = createMockRequest({ prompt: 'Test prompt' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.code).toBe('CONFIG_ERROR')
    })
  })

  describe('response format', () => {
    it('should return consistent error format', async () => {
      mockGenerate.mockRejectedValue(new Error('Test error'))

      const request = createMockRequest({ prompt: 'Test prompt' })
      const response = await POST(request)
      const data = await response.json()

      expect(data).toHaveProperty('success', false)
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('code')
      expect(typeof data.error).toBe('string')
      expect(typeof data.code).toBe('string')
    })

    it('should return consistent success format', async () => {
      const mockImageResponse = {
        data: [{ url: 'https://example.com/image.jpg' }]
      }

      const mockIPFSResponse = {
        tokenURI: 'ipfs://QmHash/metadata.json',
        previewURL: 'https://ipfs.io/ipfs/QmHash/image.jpg'
      }

      mockGenerate.mockResolvedValue(mockImageResponse)
      mockUploadToIPFS.mockResolvedValue(mockIPFSResponse)

      const request = createMockRequest({ prompt: 'Test prompt' })
      const response = await POST(request)
      const data = await response.json()

      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('tokenURI')
      expect(data).toHaveProperty('previewURL')
      expect(typeof data.tokenURI).toBe('string')
      expect(typeof data.previewURL).toBe('string')
    })
  })

  describe('edge cases', () => {
    it('should handle OpenAI returning no images', async () => {
      const mockImageResponse = {
        data: []
      }

      mockGenerate.mockResolvedValue(mockImageResponse)

      const request = createMockRequest({ prompt: 'Test prompt' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.code).toBe('GENERATION_FAILED')
    })

    it('should handle OpenAI returning malformed response', async () => {
      mockGenerate.mockResolvedValue({ invalid: 'response' })

      const request = createMockRequest({ prompt: 'Test prompt' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.code).toBe('GENERATION_FAILED')
    })

    it('should trim whitespace from prompts', async () => {
      const mockImageResponse = {
        data: [{ url: 'https://example.com/image.jpg' }]
      }

      const mockIPFSResponse = {
        tokenURI: 'ipfs://QmHash/metadata.json',
        previewURL: 'https://ipfs.io/ipfs/QmHash/image.jpg'
      }

      mockGenerate.mockResolvedValue(mockImageResponse)
      mockUploadToIPFS.mockResolvedValue(mockIPFSResponse)

      const request = createMockRequest({ prompt: '  Test prompt  ' })
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'Test prompt'
        })
      )
    })
  })
})