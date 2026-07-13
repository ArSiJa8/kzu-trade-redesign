export default defineEventHandler(async () => { 
    const posts = await postRepository.getAll(); 

    return {
        success: true,
        posts
    }
})
