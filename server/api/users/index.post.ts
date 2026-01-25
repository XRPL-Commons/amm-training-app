import { AddUser, GetUsers } from '~/server/connectors/memory'
import type { User } from '~/server/connectors/memory'

export const createUser = async ({ xrplAddress, name }: { xrplAddress: string, name: string }) => {
    try {
        // Get User object if exists
        const users = await GetUsers(xrplAddress, name);
        if (users && users.length > 0) {
            throw createError({
                statusCode: 400,
                statusMessage: 'This address or name already exists',
            })
        }

        // Add new user in DB
        let userObject: User = {
            xrplAddress: xrplAddress,
            name: name,
            createdAt: new Date().toISOString()
        };
        await AddUser(userObject);
        return {};
    } catch (error: any) {
        throw createError({
            status: 500,
            statusMessage: 'Failed to create user'
        })
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
