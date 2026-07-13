import { BaseRepository } from './base.repository'
import type { Stats } from './types'

export class StatsRepository extends BaseRepository {
    async getStats(): Promise<Stats> {
        const db = await this.getDb()
        const result = await db.query('SELECT total_views FROM stats WHERE id = 1')
        const row = result.rows[0]
        return {
            totalViews: row ? Number(row.total_views) : 0,
        }
    }

    async incrementViews(): Promise<number> {
        const db = await this.getDb()
        const result = await db.query(
            'UPDATE stats SET total_views = total_views + 1 WHERE id = 1 RETURNING total_views'
        )
        return Number(result.rows[0]?.total_views ?? 0)
    }
}

export const statsRepository = new StatsRepository()
