import { ensureDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
    // Auth is checked by middleware
    const body = await readBody<{ words: string[] }>(event)

    if (!Array.isArray(body.words)) {
        throw createError({ statusCode: 400, statusMessage: 'Ungültiges Format' })
    }

    const db = await ensureDb()

    // Replace all blocklist words atomically
    const client = await db.connect()
    try {
        await client.query('BEGIN')
        await client.query('TRUNCATE TABLE blocklist')
        if (body.words.length > 0) {
            const values = body.words.map((_, i) => `($${i + 1})`).join(', ')
            await client.query(`INSERT INTO blocklist (word) VALUES ${values}`, body.words)
        }
        await client.query('COMMIT')
    } catch (err) {
        await client.query('ROLLBACK')
        throw err
    } finally {
        client.release()
    }

    return { success: true }
})
