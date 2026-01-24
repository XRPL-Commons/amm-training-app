import { mintNft } from '~/server/connectors/wallet'
import { getWallet } from '@/server/utils'
import { AddUser, GetUsers } from '~/server/connectors/memory'
import type { User } from '~/server/connectors/memory'

export const createUser = async ({ xrplAddress, name }: { xrplAddress: string, name: string }) => {
    console.log('createUser', xrplAddress, name)
    try {
        // Get User object if exists
        const users = await GetUsers(xrplAddress, name);
        console.log(users)
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
        console.error(error);
        throw createError({
            status: 500,
            statusMessage: error.toString()
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
