import { clearMemory } from '~/server/connectors/memory'
import { requireAdminAuth } from '~/server/utils/adminAuth'

export default defineEventHandler(async (event) => {
  await requireAdminAuth(event)

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
