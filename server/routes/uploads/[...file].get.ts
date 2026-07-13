import { getFromS3 } from '../../utils/s3'
import type { Readable } from 'node:stream'

export default defineEventHandler(async (event) => {
    const filename = event.context.params?.file
    if (!filename) {
        throw createError({ statusCode: 400, statusMessage: 'Dateiname fehlt' })
    }

    try {
        const response = await getFromS3(filename)

        // Forward content type from S3 metadata
        if (response.ContentType) {
            setResponseHeader(event, 'Content-Type', response.ContentType)
        } else {
            // Fallback mime type detection
            const ext = filename.split('.').pop()?.toLowerCase()
            const mimeTypes: Record<string, string> = {
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'webp': 'image/webp',
                'gif': 'image/gif',
            }
            if (ext && mimeTypes[ext]) {
                setResponseHeader(event, 'Content-Type', mimeTypes[ext])
            }
        }

        // Cache images for 7 days (immutable filenames with random IDs)
        setResponseHeader(event, 'Cache-Control', 'public, max-age=604800, immutable')

        if (response.ETag) {
            setResponseHeader(event, 'ETag', response.ETag)
        }

        if (response.ContentLength) {
            setResponseHeader(event, 'Content-Length', response.ContentLength)
        }

        // Stream the S3 response body
        return response.Body as Readable
    } catch (e: any) {
        if (e?.$metadata?.httpStatusCode === 404 || e?.name === 'NoSuchKey') {
            throw createError({ statusCode: 404, statusMessage: 'Bild nicht gefunden' })
        }
        throw createError({
            statusCode: 500,
            statusMessage: 'Fehler beim Laden des Bildes',
        })
    }
})

