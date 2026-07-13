export default defineEventHandler(async (event) => {
    const { pathname } = getRequestURL(event)

    // Only track page views, not API or static assets
    if (!pathname.startsWith('/api') && !pathname.includes('.')) {
        await statsRepository.incrementViews()
    }
})
