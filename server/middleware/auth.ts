import jwt from 'jsonwebtoken'

type TokenPayload = {
    login: string
    role: 'admin' | 'user'
}

declare module 'h3' {
    interface H3EventContext {
        auth?: TokenPayload
    }
}

export default defineEventHandler((event) => {
    const config = useRuntimeConfig(event)
    const tokenSecret = config.tokenSecret

    const { pathname } = getRequestURL(event)

    // Routes that require at least 'user' role
    const userProtectedRoutes = ['/api/upload', '/api/delete', '/api/create-post']
    
    // Routes that require 'admin' role
    const isAdminRoute = pathname.startsWith('/api/admin/')

    if (!isAdminRoute && !userProtectedRoutes.some(route => pathname.startsWith(route))) {
        return
    }

    if (!tokenSecret) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Server ist nicht richtig konfiguriert'
        })
    }

    const token = getHeader(event, 'authorization')?.replace('Bearer ', '')

    if (!token) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Nicht eingeloggt'
        })
    }

    try {
        const payload = jwt.verify(token, tokenSecret) as TokenPayload
        event.context.auth = payload

        if (isAdminRoute && payload.role !== 'admin') {
            throw createError({
                statusCode: 403,
                statusMessage: 'Administrator-Rechte erforderlich'
            })
        }
    } catch (error) {
        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error
        }

        throw createError({
            statusCode: 401,
            statusMessage: 'Sitzung abgelaufen oder Token ungültig'
        })
    }
})
