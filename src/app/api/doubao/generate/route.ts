import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { saveDoubaoImage } from '@/lib/db';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { prompt, size = '1024x1024', seed = 42 } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: '请提供提示词' },
        { status: 400 }
      );
    }

    console.log(`🎨 Generating Doubao image with prompt: "${prompt}"`);

    // Call Doubao API
    const doubaoResponse = await axios.post(
      process.env.DOUBAO_API_URL || 'https://ark.cn-beijing.volces.com/api/v3/images/generations',
      {
        guidance_scale: 2.5,
        model: 'doubao-seedream-3-0-t2i-250415',
        prompt: prompt,
        response_format: 'url',
        seed: seed,
        size: size,
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

    console.log(`✅ Doubao API response received`);

    const imageUrl = doubaoResponse.data.data?.[0]?.url;

    if (!imageUrl) {
      console.error('❌ No image URL in response:', doubaoResponse.data);
      return NextResponse.json(
        { error: '未能从豆包API获取图像URL' },
        { status: 500 }
      );
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Doubao image generation complete in ${duration}ms`);

    // Generate a unique filename for reference
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const fileName = `doubao-${timestamp}-${random}.png`;

    // Save to database (using original URL as both image_url and minio_url)
    saveDoubaoImage({
      prompt,
      image_url: imageUrl,
      minio_url: imageUrl, // Use original URL since we're not using MinIO
      file_name: fileName,
      size,
      seed,
      created_at: timestamp,
    });

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
      originalUrl: imageUrl,
      fileName: fileName,
      duration,
      timestamp,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Error generating Doubao image (${duration}ms):`, error);

    let errorMessage = '生成图像失败';
    let details = error instanceof Error ? error.message : 'Unknown error';

    if ((error as { code?: string }).code === 'ECONNABORTED') {
      errorMessage = '请求超时，请稍后重试';
    } else if ((error as { response?: { status: number; data: unknown } }).response) {
      const err = error as { response: { status: number; data: unknown } };
      errorMessage = `API错误: ${err.response.status}`;
      details = JSON.stringify(err.response.data);
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details
      },
      { status: (error as { response?: { status: number } }).response?.status || 500 }
    );
  }
}
