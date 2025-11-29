import { NextResponse } from 'next/server';
import { getRecentDoubaoImages } from '@/lib/db';

export async function GET() {
  try {
    const images = getRecentDoubaoImages(50);

    return NextResponse.json({
      success: true,
      images: images.map(img => ({
        url: img.image_url, // Use original image_url instead of minio_url
        prompt: img.prompt,
        timestamp: img.created_at,
      })),
    });
  } catch (error) {
    console.error('❌ Error fetching Doubao images:', error);
    return NextResponse.json(
      { error: '获取图片列表失败', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
