interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

const WINDOW_MS = 60 * 60 * 1000 // 1 Stunde
const MAX_REQUESTS = 5

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }

  if (entry.count >= MAX_REQUESTS) {
    return false
  }

  entry.count++
  return true
}

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'

  if (!checkRateLimit(ip)) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Zu viele Anfragen. Bitte versuche es in einer Stunde erneut.',
    })
  }

  const body = await readBody(event)

  const email: string | undefined = body?.email?.trim()
  const message: string | undefined = body?.message?.trim()
  const name: string | undefined = body?.name?.trim()
  const category: string | undefined = body?.category?.trim()

  if (!email || !message) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Pflichtfelder fehlen: email und message sind erforderlich.',
    })
  }

  const payload: Record<string, string> = { email, message }
  if (name) payload.name = name
  if (category) payload.category = category

  try {
    await $fetch('https://formspree.io/f/xeebdgjn', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: payload,
    })
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: 'Fehler beim Weiterleiten des Feedbacks. Bitte später erneut versuchen.',
    })
  }

  return { success: true }
})
