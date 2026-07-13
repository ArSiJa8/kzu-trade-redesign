import { ensureDb } from '../db'
import type pg from 'pg'

export abstract class BaseRepository {
    protected async getDb(): Promise<pg.Pool> {
        return ensureDb()
    }
}
