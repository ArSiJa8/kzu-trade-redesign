import type { H3Event } from 'h3'

interface PointsResponse {
  points: number
  message?: string
}

export default defineEventHandler(async (event: H3Event): Promise<PointsResponse> => {
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
    // 1. Benutzer-Punkte aus DB abrufen
    // 2. Wenn nicht vorhanden, mit 0 initialisieren

    const points = 0 // Placeholder

    return {
      points
    }
  } catch (error: any) {
    console.error('Get points error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Abrufen der Punkte'
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
