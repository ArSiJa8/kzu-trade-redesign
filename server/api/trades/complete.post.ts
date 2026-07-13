import type { H3Event } from 'h3'

interface TradeRequest {
  itemTitle: string
  itemDescription?: string
  partnerLogin: string
  partnerId: string
}

interface TradeResponse {
  success: boolean
  message?: string
  pointsAwarded: number
}

export default defineEventHandler(async (event: H3Event): Promise<TradeResponse> => {
  try {
    // Authentifizierung prüfen
    const user = await requireAuth(event)
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentifizierung erforderlich'
      })
    }

    // Request Body validieren
    const body = await readBody<TradeRequest>(event)

    if (!body.itemTitle || !body.partnerLogin || !body.partnerId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Erforderliche Felder fehlen'
      })
    }

    // TODO: Implementiere die Datenbanklogik
    // 1. Trade in DB speichern
    // 2. Punkte für beide Benutzer hinzufügen (z.B. 50 Punkte pro Trade)
    // 3. Optional: Validiere, dass Partner existiert und nicht der gleiche Benutzer ist

    const pointsAwarded = 50 // Standard: 50 Punkte pro Handel

    // Beispiel-Logging
    console.log(`Trade completed: ${user.login} <-> ${body.partnerLogin}`)

    return {
      success: true,
      message: `Handel erfolgreich abgeschlossen! Beide Spieler erhalten ${pointsAwarded} Punkte.`,
      pointsAwarded
    }
  } catch (error: any) {
    console.error('Trade completion error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Abschließen des Handels'
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
