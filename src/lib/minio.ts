import * as Minio from 'minio';

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9100'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

const bucketName = process.env.MINIO_BUCKET_NAME || 'doubao-images';

export async function ensureBucketExists() {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log(`✅ Bucket ${bucketName} created successfully`);

      // Set bucket policy to public read
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucketName}/*`],
          },
        ],
      };
      await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
      console.log(`✅ Bucket policy set to public read`);
    }
  } catch (err) {
    console.error('❌ Error ensuring bucket exists:', err);
    throw err;
  }
}

export async function uploadImageToMinio(
  imageBuffer: Buffer,
  fileName: string,
  contentType: string = 'image/png'
): Promise<string> {
  try {
    await ensureBucketExists();

    const metadata = {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000',
    };

    await minioClient.putObject(bucketName, fileName, imageBuffer, imageBuffer.length, metadata);

    const minioUrl = process.env.NEXT_PUBLIC_MINIO_URL || 'http://localhost:9100';
    const imageUrl = `${minioUrl}/${bucketName}/${fileName}`;

    console.log(`✅ Image uploaded to MinIO: ${imageUrl}`);
    return imageUrl;
  } catch (err) {
    console.error('❌ Error uploading to MinIO:', err);
    throw err;
  }
}

export function generateFileName(prefix: string = 'doubao', extension: string = 'png'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${timestamp}-${random}.${extension}`;
}

export default minioClient;
