import { BaseRepository } from './base.repository'
import type { Post } from './types'

function rowToPost(row: Record<string, unknown>): Post {
    return {
        id: row.id as string,
        title: row.title as string,
        description: row.description as string,
        category: row.category as string,
        wishes: (row.wishes as string | null) ?? undefined,
        images: (row.images as string[] | null) ?? undefined,
        mainImage: (row.main_image as string | null) ?? undefined,
        ownerEmail: (row.owner_email as string | null) ?? undefined,
        ownerName: (row.owner_name as string | null) ?? undefined,
        author: (row.author as string | null) ?? undefined,
        createdAt: row.created_at as string,
        updatedAt: (row.updated_at as number | null) ?? undefined,
    }
}

export class PostRepository extends BaseRepository {
    async getAll(): Promise<Post[]> {
        const db = await this.getDb()
        const result = await db.query('SELECT * FROM posts ORDER BY created_at DESC')
        return result.rows.map(rowToPost)
    }

    async getById(id: string): Promise<Post | undefined> {
        const db = await this.getDb()
        const result = await db.query('SELECT * FROM posts WHERE id = $1', [id])
        return result.rows[0] ? rowToPost(result.rows[0]) : undefined
    }

    async create(post: Post): Promise<void> {
        const db = await this.getDb()
        await db.query(
            `INSERT INTO posts (id, title, description, category, wishes, images, main_image, owner_email, owner_name, author, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
                post.id,
                post.title,
                post.description,
                post.category,
                post.wishes ?? null,
                post.images ?? null,
                post.mainImage ?? null,
                post.ownerEmail ?? null,
                post.ownerName ?? null,
                post.author ?? null,
                String(post.createdAt),
                post.updatedAt ?? null,
            ]
        )
    }

    async update(id: string, updatedPost: Partial<Post>): Promise<boolean> {
        const db = await this.getDb()
        const result = await db.query(
            `UPDATE posts SET
                title = COALESCE($2, title),
                description = COALESCE($3, description),
                category = COALESCE($4, category),
                wishes = COALESCE($5, wishes),
                images = COALESCE($6, images),
                main_image = COALESCE($7, main_image),
                owner_email = COALESCE($8, owner_email),
                owner_name = COALESCE($9, owner_name),
                author = COALESCE($10, author),
                updated_at = COALESCE($11, updated_at)
             WHERE id = $1`,
            [
                id,
                updatedPost.title ?? null,
                updatedPost.description ?? null,
                updatedPost.category ?? null,
                updatedPost.wishes ?? null,
                updatedPost.images ?? null,
                updatedPost.mainImage ?? null,
                updatedPost.ownerEmail ?? null,
                updatedPost.ownerName ?? null,
                updatedPost.author ?? null,
                updatedPost.updatedAt ?? null,
            ]
        )
        return (result.rowCount ?? 0) > 0
    }

    async delete(id: string): Promise<boolean> {
        const db = await this.getDb()
        const result = await db.query('DELETE FROM posts WHERE id = $1', [id])
        return (result.rowCount ?? 0) > 0
    }
}

export const postRepository = new PostRepository()
