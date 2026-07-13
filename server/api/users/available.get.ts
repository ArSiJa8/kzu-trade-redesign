import type { H3Event } from 'h3'

interface User {
  id: string
  login: string
}

interface AvailableUsersResponse {
  users: User[]
}

export default defineEventHandler(async (event: H3Event): Promise<AvailableUsersResponse> => {
  try {
    // Authentifizierung prüfen
    const user = await requireAuth(event)
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentifizierung erforderlich'
      })
    }

    // TODO: Implementiere die Datenbanklogik
    // 1. Alle aktiven Benutzer abrufen
    // 2. Den aktuellen Benutzer ausschließen
    // 3. Optional: Benutzer filtern, die online sind oder kürzlich aktiv waren

    const users: User[] = [
      // Placeholder
      // { id: '1', login: 'User1' },
      // { id: '2', login: 'User2' }
    ]

    return {
      users
    }
  } catch (error: any) {
    console.error('Get available users error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Abrufen der Benutzer'
    })
  }
})

// Helper: Authentifizierung (anpassen nach deinem Auth-System)
async function requireAuth(event: H3Event) {
  const token = getCookie(event, 'token')
  if (!token) {
    return null
  }
  // TODO: Token validieren und Benutzer abrufen
  return { login: 'user', id: '123' }
}
