import { getOnlineUsers, setRedirect } from '../../utils/online-tracker'

export default defineEventHandler(async (event) => {
    // Auth is already checked by middleware
    const method = getMethod(event)

    if (method === 'GET') {
        const stats = await statsRepository.getStats();
        const onlineUsers = getOnlineUsers()
        
        return {
            totalViews: stats.totalViews,
            onlineCount: onlineUsers.length,
            users: onlineUsers
        }
    }

    if (method === 'POST') {
        const body = await readBody<{ url: string, targetId?: string }>(event)
        if (body.url) {
            setRedirect(body.url, body.targetId)
            return { success: true }
        }
    }

    throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})
