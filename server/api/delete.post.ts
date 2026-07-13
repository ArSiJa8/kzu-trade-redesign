import { deleteFromS3 } from '../utils/s3'

function getObjectKeyFromUrl(urlOrKey: string): string {
    // New entries store just the object key (e.g. "1234_abc.jpg")
    // Legacy entries may still have full URLs – handle both
    try {
        const parsed = new URL(urlOrKey)
        const parts = parsed.pathname.split('/').filter(Boolean)
        return parts.join('/')
    } catch {
        // Not a URL – already a plain object key
        return urlOrKey
    }
}

export default defineEventHandler(async (event) => {
    // Auth is already checked by middleware
    const payload = event.context.auth!

    const body = await readBody<{ id?: string }>(event)

    if (!body?.id) {
        throw createError({ statusCode: 400, statusMessage: 'Kein Post angegeben' })
    }

    const post = await postRepository.getById(body.id)

    if (!post) {
        throw createError({ statusCode: 404, statusMessage: 'Post nicht gefunden' })
    }

    if (payload.role !== 'admin' && post.ownerEmail !== payload.login) {
        throw createError({ statusCode: 403, statusMessage: 'Du darfst nur deine eigenen Posts löschen' })
    }

    // Delete images from MinIO
    if (post.images) {
        for (const imageUrl of post.images) {
            const objectKey = getObjectKeyFromUrl(imageUrl)
            await deleteFromS3(objectKey)
        }
    }

    await postRepository.delete(body.id)

    return {
        success: true,
    }
})
