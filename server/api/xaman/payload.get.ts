import { getXumm } from '@/server/utils'

export default defineEventHandler(async (event) => {
    try {
        const { uuid }: { uuid: string } = getQuery(event)

        if (!uuid) {
            throw createError({
                status: 400,
                statusMessage: 'please provide UUID'
            })
        }

        let xumm = getXumm();

        const payload = await xumm.payload?.get(uuid);
        return payload

    } catch (error: any) {
        throw createError({
            status: 500,
            statusMessage: 'Failed to fetch payload'
        })
    }
})