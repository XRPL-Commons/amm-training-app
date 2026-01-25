import { AddUser } from '~/server/connectors/memory'
import type { User } from '~/server/connectors/memory'

export const createUser = async ({ xrplAddress, name }: { xrplAddress: string, name: string }) => {
    try {
        const userObject: User = {
            xrplAddress: xrplAddress,
            name: name,
            createdAt: new Date().toISOString()
        };
        await AddUser(userObject);
        return {};
    } catch (error: any) {
        if (error.message === 'User already exists') {
            throw createError({
                statusCode: 400,
                statusMessage: 'This address or name already exists',
            })
        }
        throw error;
    }
}

export default defineEventHandler(async (event) => {
    const { xrplAddress, name } = await readBody(event)
    if (!xrplAddress || !name) {
        throw createError({
            status: 400,
            statusMessage: 'xrplAddress or name missing'
        })
    }
    return createUser({ xrplAddress, name })
})
