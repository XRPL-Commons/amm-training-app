<template>
    <UButton color="blue" size="xl" @click="joinTraining">Join the training</UButton>
    <div class="text-center mt-4 w-1/2">
        <template v-if="users && users.length > 0">
            <div class="overflow-hidden shadow-md sm:rounded-lg">
                <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">            
                    <tr>
                    <th scope="col" class="py-3 px-6 font-body">
                        Name
                    </th>
                    <th scope="col" class="py-3 px-6 font-body w-1/2">
                        Xrpl addresses
                    </th>
                    <th scope="col" class="py-3 px-6 font-body">
                        Actions
                    </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="user in users" :key="user.name" class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td class="py-3 px-6 font-body justify-center items-center">{{ user.name }}</td>
                    <td class="py-3 px-6 font-body">{{ user.xrplAddress }}</td>
                    <td class="py-3 px-6">                      
                      <!-- <UPopover mode="hover">
                        <button @click="displayToken(user.name, user.xrplAddress)" class="popover-button flex justify-center items-center">
                          <Icon name="token:xrp" size="30px" />
                        </button>
                          <template #panel>
                            <div class="p-4">
                              <div>
                                Click to display tokens
                              </div>
                            </div>
                          </template>
                      </UPopover> -->
                      <button @click="displayToken(user.name, user.xrplAddress)" class="popover-button flex justify-center items-center">
                          <span style="text-decoration: underline;">View Tokens</span>
                      </button>
                    </td>
                    </tr>              
                </tbody>
                </table>
            </div>        
        </template>
    </div>
    <div>
      <BlockchainToken 
        :tokens="tokens" 
        :selectedName="selectedName" 
        :userToken="userToken"
        :userAddress="xrplAddress"
         />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

import type { TokenObject, UserObject } from '~/src/types';

/* @ts-ignore */
import { QRCodeModal, JoinTrainingModal } from '#components'
/* @ts-ignore */
import API from '~/server/client'

/* @ts-ignore */
const modal = useModal()

// wallet
const userToken = ref('')
const xrplAddress = ref('')

// tokens
const tokens = ref<TokenObject[]>([]);
const selectedName = ref('');

// users 
const users = ref<UserObject[]>([]);

const walletConnected = ref(false)

onMounted(async () => {
  userToken.value = localStorage.getItem('user_token') || ''
  xrplAddress.value = localStorage.getItem('xrpl_address') || ''

  if (!userToken.value || !xrplAddress.value) {
    await connectWallet()
  }
  await displayUsers()
})

function connectWallet() {
  return new Promise(async (resolve, reject) => {
    try {
      const payload = await API.XamanSignIn()

      // from payload
      const qrCodeSrc = payload.refs.qr_png
      const mobileUrl = payload.next.always;
      const websocket_status = payload.refs.websocket_status

      // launch modal
      console.log({ qrCodeSrc, mobileUrl })
      modal.open(QRCodeModal, {
        qrCodeSrc,
        mobileUrl
      })

      const ws = await initializeWebSocket({
        url: websocket_status,
        onMessage: async ({ data, wsClose }: { data: any, wsClose: any }) => {
          if (data.payload.tx_type == 'SignIn') {
            console.log("Signed in")
            // save wallet data to localStorage
            xrplAddress.value = data.response.account
            userToken.value = data.application.issued_user_token
            localStorage.setItem('xrpl_address', xrplAddress.value)
            localStorage.setItem('user_token', userToken.value)
            modal.close()
            wsClose()
            resolve(xrplAddress.value)
          } else {
            console.log('ignored message', data)
          }
        }
      })
    } catch (error) {
      alert('Error connecting to Xumm: ' + error)
      reject(error)
    }
  })
  // todo add race condition with timeout?
}

async function initializeWebSocket({ url, onMessage }: { url: string, onMessage?: any }) {
  /* @ts-ignore */
  const ws = new WebSocket(url);
  /* @ts-ignore */
  ws.onmessage = async (message) => {
    let responseObj = JSON.parse(message.data)
    console.log(responseObj)
    const { signed, payload_uuidv4 } = responseObj

    // only handle signed messages
    if ((signed !== true) || !payload_uuidv4) {
      return
    }

    // get payload from backend
    const data: any = await API.XamanGetPayload({ uuid: payload_uuidv4 })

    console.log({ data })

    // check network
    /* @ts-ignore */
    const runtimeConfig = useRuntimeConfig()
    if (data.response.environment_nodetype !== runtimeConfig.public.network) {
      // regen qr code
      alert('Wrong network used: network should be: ' + runtimeConfig.public.network);
      await connectWallet()
      return
    }

    await onMessage({
      data,
      wsClose: () => ws.close()
    })
  }

  return ws
}

async function displayUsers() {
    try {
        const result = await API.getUsers({})        
        users.value = result
    } catch (error) {
        alert("Error getting NFT arts: " + error);
    }
}

async function displayToken(name: string, xrplAddress: string) {
  try {
    console.log('XRPL Address:', xrplAddress);
    const result = await API.getTokens({ xrplAddress: xrplAddress })
    selectedName.value = name;
    tokens.value = result;
    if (result.length === 0) {
      alert('This account does not hold any token')
    }
    console.log(result)
  } catch (error) {
    alert("Error fetching token: " + error)
  }
}

function joinTraining() {
    modal.open(JoinTrainingModal, {
        xrplAddress,
        onClose: async () => {
            modal.close()
            await displayUsers();
            console.log("Modal has been closed");
        },
  });
}
</script>

<style scoped>
.connect-wallet-button {
  padding: 10px 20px;
  background-color: #4CAF50; /* Green */
  border: none;
  color: white;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  cursor: pointer;
  border-radius: 12px;
}

.popover-button {
  background: none;
  border: none;
  cursor: pointer;
}

.popover-button:focus {
  outline: none;
}
</style>~/src/types
