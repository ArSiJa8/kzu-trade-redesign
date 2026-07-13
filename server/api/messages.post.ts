import jwt from 'jsonwebtoken'
import { ensureDb } from '../utils/db'

type TokenPayload = {
    login: string
    role: 'admin' | 'user'
}

type Message = {
    id: string
    postId: string
    author: string
    authorEmail: string
    content: string
    createdAt: string
}

type MessagesResult = {
    success?: boolean
    error?: string
    message?: Message
}

async function readBlocklist(): Promise<string[]> {
    const db = await ensureDb()
    const result = await db.query('SELECT word FROM blocklist')
    return result.rows.map((r: { word: string }) => r.word)
}

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

export default defineEventHandler(async (event): Promise<MessagesResult> => {
    const config = useRuntimeConfig(event)
    const tokenSecret = config.tokenSecret

    if (!tokenSecret) {
        return { error: 'Server nicht korrekt konfiguriert' }
    }

    const authHeader = getHeader(event, 'authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { error: 'Authentifizierung erforderlich' }
    }

    const token = authHeader.slice(7)

    let payload: TokenPayload
    try {
        payload = jwt.verify(token, tokenSecret) as TokenPayload
    } catch {
        return { error: 'Ungültiger oder abgelaufener Token' }
    }

    const body = await readBody(event)
    const { postId, content } = body

    if (!postId || !content) {
        return { error: 'Post ID und Nachrichtentext erforderlich' }
    }

    if (typeof content !== 'string' || content.trim().length === 0) {
        return { error: 'Nachricht darf nicht leer sein' }
    }

    if (content.length > 2000) {
        return { error: 'Nachricht darf maximal 2000 Zeichen lang sein' }
    }

    let finalContent = content.trim()
    const blocklist = await readBlocklist()
    const lowerContent = finalContent.toLowerCase()

    const foundBlocked = blocklist.some(word => lowerContent.includes(word.toLowerCase()))
    if (foundBlocked) {
        finalContent = '[GEBLOCKTER INHALT]'
    }

    const message: Message = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        postId,
        author: getUserNameFromEmail(payload.login),
        authorEmail: payload.login,
        content: finalContent,
        createdAt: new Date().toISOString(),
    }

    const db = await ensureDb()
    await db.query(
        'INSERT INTO messages (id, post_id, author, author_email, content, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [message.id, message.postId, message.author, message.authorEmail, message.content, message.createdAt]
    )

    return {
        success: true,
        message,
    }
})
