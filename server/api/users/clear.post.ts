import { clearMemory } from '~/server/connectors/memory'

export default defineEventHandler(async (event) => {
  try {
    clearMemory()
    return { cleared: true }
  } catch (e) {
    throw createError({
      status: 500,
      statusMessage: 'Unable to clear users'
    })
  }
})
