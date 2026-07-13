import { createHash } from 'node:crypto'
import jwt from 'jsonwebtoken'

function hashPassword(password: string) {
    return createHash('sha256').update(password).digest('hex')
}

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig(event)
    const tokenSecret = config.tokenSecret

    const body = await readBody<{
        login?: string
        password?: string
    }>(event)

    const login = body.login?.trim().toLowerCase()
    const password = body.password

    if (!login || !password) {
        throw createError({ statusCode: 400, statusMessage: 'Login und Passwort angeben' })
    }

    if (!tokenSecret) {
        throw createError({ statusCode: 500, statusMessage: 'Token Secret nicht konfiguriert' })
    }

    const user = await userRepository.getByEmail(login)

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Ungültige Anmeldedaten' })
    }

    if (user.passwordHash !== hashPassword(password)) {
        throw createError({ statusCode: 401, statusMessage: 'Ungültige Anmeldedaten' })
    }

    const token = jwt.sign(
        { login: user.email, role: user.role },
        tokenSecret,
        { expiresIn: '7d' }
    )

    return {
        token,
        role: user.role,
        login: user.email
    }
})
