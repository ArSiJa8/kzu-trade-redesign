type OnlineUser = {
    ip: string
    login?: string
    lastSeen: number
    id: string
    pendingRedirect?: RedirectCommand
}

type RedirectCommand = {
    url: string
    timestamp: number
}

// In-memory storage for online users and pending redirect
const onlineUsers = new Map<string, OnlineUser>()
let globalRedirect: RedirectCommand | null = null

export function updateHeartbeat(id: string, ip: string, login?: string) {
    const existing = onlineUsers.get(id)
    onlineUsers.set(id, {
        id,
        ip,
        login,
        lastSeen: Date.now(),
        pendingRedirect: existing?.pendingRedirect
    })
}

export function getOnlineUsers() {
    const now = Date.now()
    const timeout = 15000 // 15 seconds timeout
    
    // Clean up old users
    for (const [id, user] of onlineUsers.entries()) {
        if (now - user.lastSeen > timeout) {
            onlineUsers.delete(id)
        }
    }
    
    return Array.from(onlineUsers.values())
}

export function setRedirect(url: string, targetId?: string) {
    const command = {
        url,
        timestamp: Date.now()
    }

    if (targetId) {
        const user = onlineUsers.get(targetId)
        if (user) {
            user.pendingRedirect = command
        }
    } else {
        globalRedirect = command
    }
}

export function getRedirect(id: string) {
    const user = onlineUsers.get(id)
    // Individual redirect takes precedence over global
    const redirect = user?.pendingRedirect || globalRedirect
    
    // Clear individual redirect after it's been "consumed" (polled)
    if (user?.pendingRedirect) {
        user.pendingRedirect = undefined
    }
    
    return redirect
}

export function clearRedirect() {
    globalRedirect = null
}
