import { updateHeartbeat, getRedirect } from '../utils/online-tracker'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig(event)
    const tokenSecret = config.tokenSecret
    
    const body = await readBody<{ id: string }>(event)
    const id = body.id
    
    if (!id) return { error: 'No ID provided' }

    let login: string | undefined
    const token = getHeader(event, 'authorization')?.replace('Bearer ', '')
    
    if (token && tokenSecret) {
        try {
            const decoded = jwt.verify(token, tokenSecret) as { login: string }
            login = decoded.login
        } catch {
            // Ignore invalid token for heartbeat, just treat as anonymous
        }
    }

    const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
    updateHeartbeat(id, ip, login)

    return {
        redirect: getRedirect(id)
    }
})