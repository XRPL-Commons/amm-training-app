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
        console.log(payload)
        return payload

    } catch (error: any) {
        console.error(error);
        throw createError({
            status: 500,
            statusMessage: error.toString()
        })
    }
})