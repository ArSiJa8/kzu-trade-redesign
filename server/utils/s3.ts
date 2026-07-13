import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'

let s3Client: S3Client | null = null

export function getS3Client(): S3Client {
    if (!s3Client) {
        const endpoint = process.env.MINIO_ENDPOINT
        const accessKeyId = process.env.MINIO_ACCESS_KEY
        const secretAccessKey = process.env.MINIO_SECRET_KEY

        if (!endpoint || !accessKeyId || !secretAccessKey) {
            throw new Error('MinIO environment variables (MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY) are not set')
        }

        s3Client = new S3Client({
            endpoint,
            region: 'us-east-1', // MinIO accepts any region string
            credentials: { accessKeyId, secretAccessKey },
            forcePathStyle: true, // Required for MinIO
        })
    }
    return s3Client
}

export function getBucket(): string {
    return process.env.MINIO_BUCKET || 'uploads'
}

/**
 * Upload a file to MinIO and return the object key.
 * Images are served via the /uploads/ proxy route on the Nuxt server.
 */
export async function uploadToS3(key: string, data: Buffer, contentType: string): Promise<string> {
    const client = getS3Client()
    const bucket = getBucket()

    await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: data,
        ContentType: contentType,
    }))

    // Return just the object key – the /uploads/ proxy serves the file
    return key
}

/**
 * Stream a file from MinIO. Returns the S3 response with Body stream and metadata.
 */
export async function getFromS3(key: string) {
    const client = getS3Client()
    const bucket = getBucket()

    return client.send(new GetObjectCommand({
        Bucket: bucket,
        Key: key,
    }))
}

export async function deleteFromS3(key: string): Promise<void> {
    const client = getS3Client()
    const bucket = getBucket()

    try {
        await client.send(new DeleteObjectCommand({
            Bucket: bucket,
            Key: key,
        }))
    } catch {
        // Ignore – object may already be deleted
    }
}
