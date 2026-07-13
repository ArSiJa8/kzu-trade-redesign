import { randomUUID } from 'node:crypto'
import type { Post } from '../utils/repositories/types'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth')
  const authHeader = getHeader(event, 'authorization')

  if (!token && !authHeader) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentifizierung erforderlich'
    })
  }

  const body = await readBody<{
    title?: string
    description?: string
    category?: string
    wishes?: string
  }>(event)

  const { title, description, category, wishes } = body

  if (!title || !description || !category) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Titel, Beschreibung und Kategorie sind erforderlich'
    })
  }

  try {
    const now = Date.now()

    const newPost: Post = {
      id: randomUUID(),
      title,
      description,
      category,
      wishes: wishes || undefined,
      author: authHeader ? 'User' : 'Admin',
      createdAt: now,
      updatedAt: now
    }

    await postRepository.create(newPost)

    return {
      success: true,
      post: newPost,
      message: 'Post erfolgreich erstellt!'
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Erstellen des Posts: ' + error.message
    })
  }
})
