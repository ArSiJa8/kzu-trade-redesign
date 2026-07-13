import { BaseRepository } from './base.repository'
import type { User } from './types'

function rowToUser(row: Record<string, unknown>): User {
    return {
        id: row.id as string,
        email: row.email as string,
        passwordHash: row.password_hash as string,
        role: row.role as 'admin' | 'user',
    }
}

export class UserRepository extends BaseRepository {
    async getAll(): Promise<User[]> {
        const db = await this.getDb()
        const result = await db.query('SELECT * FROM users')
        return result.rows.map(rowToUser)
    }

    async getByEmail(email: string): Promise<User | undefined> {
        const db = await this.getDb()
        const result = await db.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email])
        return result.rows[0] ? rowToUser(result.rows[0]) : undefined
    }

    async getById(id: string): Promise<User | undefined> {
        const db = await this.getDb()
        const result = await db.query('SELECT * FROM users WHERE id = $1', [id])
        return result.rows[0] ? rowToUser(result.rows[0]) : undefined
    }

    async create(user: User): Promise<void> {
        const db = await this.getDb()
        await db.query(
            'INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, $3, $4)',
            [user.id, user.email, user.passwordHash, user.role]
        )
    }
}

export const userRepository = new UserRepository()
