<template>    
    <div class="text-center mt-4 w-4/5 ml-10 mt-10">
        <template v-if="tokens && tokens.length > 0">
            <div class="text-left text-lg font-semibold font-body">Token listing for {{ selectedName }}</div>
            <div class="overflow-hidden shadow-md sm:rounded-lg">
                <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">            
                    <tr>
                    <th scope="col" class="py-3 px-6 font-body">
                        Currency
                    </th>
                    <th scope="col" class="py-3 px-6 font-body w-1/2">
                        Issuer
                    </th>
                    <th scope="col" class="py-3 px-6 font-body">
                        Amount
                    </th>
                    <th scope="col" class="py-3 px-6 font-body">
                        Action
                    </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="token in tokens" :key="token.currency" class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td class="py-3 px-6 font-body justify-center items-center">{{ token.currency }}</td>
                    <td class="py-3 px-6 font-body">{{ token.issuer }}</td>
                    <td class="py-3 px-6 font-body">{{ token.amount }}</td>
                    <td class="py-3 px-6">
                      <div class="flex flex-row">                        
                        <button @click="displayAmm(token)" class="popover-button flex justify-center items-center mr-2">
                          <span style="text-decoration: underline;">View AMM</span>
                        </button>
                        /
                        <button @click="setTrustline(token)" class="popover-button flex justify-center items-center ml-2">
                          <span style="text-decoration: underline;">Trustline</span>
                        </button>                        
                      </div>                                                                
                    </td>
                    </tr>              
                </tbody>
                </table>
            </div>
            <template v-if="amm && selectedToken">
              <BlockchainAmmPool 
                :amm="amm" 
                :issuer="selectedToken.issuer" 
                :currency="selectedToken.currency" 
                :userToken="userToken" 
                :userAddress="userAddress"
              />
            </template>            
        </template>
        <div>
        </div>
    </div>    
</template>

<script lang="ts" setup>

import type { TokenObject, AmmObject } from '~/src/types';

import API from '~/server/client'

import { initializeWebsocket } from '~/src/xaman'

import { QRCodeModal } from '#components'

const modal = useModal()

const props = defineProps<{
  tokens: TokenObject[];
  selectedName: string;
  userToken: string,
  userAddress: string;
}>();

const {
  tokens,
  selectedName,
  userToken,
  userAddress
} = toRefs(props);

// const amm = ref<AmmObject>()
const amm = ref<AmmObject | null>(null);
const selectedToken = ref<TokenObject>()

async function displayAmm(token: TokenObject) {
  try {
    const result = await API.getAmm({ issuer: token.issuer, currency: token.currency })
    amm.value = result;
    selectedToken.value = token;
  } catch (error) {
    alert("Error fetching token: " + error)
  }
}

async function setTrustline(token: TokenObject) {
  return new Promise(async (resolve, reject) => {
    try {
      const payload = await API.createTrustline( {
        userToken: userToken.value,
        account: userAddress.value, 
        issuer: token.issuer, 
        currency: token.currency 
      })

      const qrCodeSrc = payload.refs.qr_png
      const mobileUrl = payload.next.always
      const websocket_status = payload.refs.websocket_status

      modal.open(QRCodeModal, {
        qrCodeSrc,
        mobileUrl
      })

      const ws = await initializeWebsocket({
        url: websocket_status,
        onMessage: async ({ data, wsClose }: { data: any, wsClose: any }) => {
          if (data.payload.tx_type == 'TrustSet') {
            modal.close()
            resolve('something')
            wsClose()
          }
        }
      })
    } catch (error) {
      alert('Error connecting to Xumm: ' + error)
      reject(error)
    }
  })
}

watch(() => props.tokens, () => {
  if (amm.value) {
    amm.value = null;
  }  
})
</script>
