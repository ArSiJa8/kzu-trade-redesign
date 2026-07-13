import type { Post, TradeCategory } from '../utils/repositories/types'
import { uploadToS3 } from '../utils/s3'


function getUserNameFromEmail(email: string) {
    if (email === 'admin') {
        return 'Admin'
    }

    const namePart = email.split('@')[0] ?? email

    return namePart
        .split(/[._-]/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ')
}

export default defineEventHandler(async (event) => {
    // Auth is already checked by middleware
    const payload = event.context.auth!

    const form = await readMultipartFormData(event)

    if (!form?.length) {
        throw createError({ statusCode: 400, statusMessage: 'Keine Daten erhalten' })
    }

    const title = form.find((item) => item.name === 'title')?.data.toString().trim()
    const description = form.find((item) => item.name === 'description')?.data.toString().trim()
    const category = form.find((item) => item.name === 'category')?.data.toString().trim() as TradeCategory | undefined
    const wishes = form.find((item) => item.name === 'wishes')?.data.toString().trim()
    const mainImageIndexRaw = form.find((item) => item.name === 'mainImageIndex')?.data.toString()
    const rulesAccepted = form.find((item) => item.name === 'rulesAccepted')?.data.toString() === 'true'

    const allowedCategories: TradeCategory[] = ['Schulmaterial', 'Stifte', 'Bücher', 'Sportmaterialien', 'Anderes']

    if (!title || !description || !category || !allowedCategories.includes(category)) {
        throw createError({ statusCode: 400, statusMessage: 'Bitte alle Pflichtfelder korrekt ausfüllen' })
    }

    if (!rulesAccepted) {
        throw createError({ statusCode: 400, statusMessage: 'Bitte zuerst die Regeln akzeptieren' })
    }

    const files = form.filter((item) => item.name === 'files' && item.filename)

    if (!files.length || files.length > 8) {
        throw createError({ statusCode: 400, statusMessage: 'Bitte 1 bis 8 Bilder auswählen' })
    }

    const mainImageIndex = Number(mainImageIndexRaw ?? 0)

    if (!Number.isInteger(mainImageIndex) || mainImageIndex < 0 || mainImageIndex >= files.length) {
        throw createError({ statusCode: 400, statusMessage: 'Ungültiges Hauptbild' })
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const savedImageKeys: string[] = []

    for (const file of files) {
        if (!allowed.includes(file.type || '')) {
            throw createError({ statusCode: 400, statusMessage: 'Ungültiges Dateiformat' })
        }

        if (file.data.length > 100 * 1024 * 1024) {
            throw createError({ statusCode: 400, statusMessage: 'Eine Datei ist zu groß (max. 100 MB)' })
        }

        const original = file.filename || 'bild'
        const ext = original.includes('.') ? original.split('.').pop() : 'jpg'
        const objectKey = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
        const contentType = file.type || 'image/jpeg'

        const savedKey = await uploadToS3(objectKey, file.data, contentType)
        savedImageKeys.push(savedKey)
    }

    const mainImage = savedImageKeys[mainImageIndex]

    const newPost: Post = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        title,
        description,
        category,
        wishes: wishes || undefined,
        images: savedImageKeys,
        mainImage,
        ownerEmail: payload.login,
        ownerName: getUserNameFromEmail(payload.login),
        createdAt: new Date().toISOString(),
    }

    await postRepository.create(newPost)

    return {
        success: true,
        post: newPost,
    }
})
