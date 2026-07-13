import { ensureDb } from '../../utils/db'

export async function readBlocklist(): Promise<string[]> {
    const db = await ensureDb()
    const result = await db.query('SELECT word FROM blocklist')
    return result.rows.map((r: { word: string }) => r.word)
}

export default defineEventHandler(async () => {
    const words = await readBlocklist()
    return {
        success: true,
        words,
    }
})
