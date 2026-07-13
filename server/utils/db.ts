import pg from 'pg'

const { Pool } = pg

let pool: pg.Pool | null = null

export function getPool(): pg.Pool {
    if (!pool) {
        const connectionString = process.env.DATABASE_URL
        if (!connectionString) {
            throw new Error('DATABASE_URL environment variable is not set')
        }
        pool = new Pool({ connectionString, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false })
    }
    return pool
}

export async function initDb(): Promise<void> {
    const client = await getPool().connect()
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user'
            );

            CREATE TABLE IF NOT EXISTS posts (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                category TEXT NOT NULL,
                wishes TEXT,
                images TEXT[],
                main_image TEXT,
                owner_email TEXT,
                owner_name TEXT,
                author TEXT,
                created_at TEXT NOT NULL,
                updated_at BIGINT
            );

            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                post_id TEXT NOT NULL,
                author TEXT NOT NULL,
                author_email TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS messages_post_id_idx ON messages(post_id);

            CREATE TABLE IF NOT EXISTS stats (
                id INTEGER PRIMARY KEY DEFAULT 1,
                total_views BIGINT NOT NULL DEFAULT 0
            );
            INSERT INTO stats (id, total_views) VALUES (1, 0) ON CONFLICT DO NOTHING;

            CREATE TABLE IF NOT EXISTS blocklist (
                word TEXT PRIMARY KEY
            );
        `)
    } finally {
        client.release()
    }
}

let initialized = false
export async function ensureDb(): Promise<pg.Pool> {
    if (!initialized) {
        await initDb()
        initialized = true
    }
    return getPool()
}
