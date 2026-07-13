import { ensureDb } from '../utils/db'

type Message = {
    id: string
    postId: string
    author: string
    authorEmail: string
    content: string
    createdAt: string
}

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const postId = query.postId as string

    if (!postId) {
        return {
            error: 'Post ID erforderlich',
            messages: [],
        }
    }

    const db = await ensureDb()
    const result = await db.query(
        'SELECT id, post_id, author, author_email, content, created_at FROM messages WHERE post_id = $1 ORDER BY created_at ASC',
        [postId]
    )

    const messages: Message[] = result.rows.map((row: Record<string, string | undefined>) => ({
        id: row.id!,
        postId: row.post_id!,
        author: row.author!,
        authorEmail: row.author_email!,
        content: row.content!,
        createdAt: row.created_at!,
    }))

    return {
        success: true,
        messages,
    }
})
