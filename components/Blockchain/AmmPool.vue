<template>
  <div class="flex justify-between">
    <div class="flex flex-col items-center p-4 w-2/3">  
      <div class="p-8 rounded-xl shadow-lg max-w-2xl w-full">       
        <div class="flex justify-between items-center mb-6" v-if="ammObject">        
          <h1 class="text-white text-2xl font-semibold font-body">AMM Pool -></h1> 
          <h1 class="text-white text-2xl font-semibold font-body">{{ ammObject && ammObject.pool1.currency }}/{{ ammObject && ammObject.pool2.currency }}</h1> 
          <div class="text-white">
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4 mb-6">        
          <div class="text-center py-2 bg-gray-700 rounded-md text-white">
            <div class="text-sm font-semibold font-body">Price per XRP</div>
            <div class="text-lg font-body dark:text-gray-400">{{ getPrice() }}</div>
          </div>
          <div class="text-center py-2 bg-gray-700 rounded-md text-white">
            <div class="text-sm font-semibold font-body">Volume (24h)</div>
            <div class="text-lg font-body dark:text-gray-400"></div>
          </div>
          <div class="text-center py-2 bg-gray-700 rounded-md text-white">
            <div class="text-sm font-semibold font-body">APR</div>
            <div class="text-lg font-body dark:text-gray-400"></div>
          </div>
        </div>
        
        <div class="bg-gray-700 p-4 rounded-lg" v-if="ammObject">
          <div class="text-center text-xl text-white font-semibold font-body mb-6">Pool composition</div>
          <div class="flex justify-center items-center space-x-0">
            <div class="flex-1 flex flex-col items-center pr-8">
              <div class="text-lg dark:text-gray-100 flex items-center justify-center">
                <span class="inline-block w-3 h-3 bg-blue-600 rounded-full mr-2"></span>
                Total {{ ammObject.pool1.currency }}
              </div>
              <div class="text-lg dark:text-gray-100">{{ formatNumber(fixedInteger(ammObject.pool1.amount)) }}</div>            
            </div>
            <div class="flex-none w-20 h-40 bg-blue-600 text-white rounded-l-full shadow-md opacity-50 flex items-center justify-center">
            </div>
            <div class="flex-none w-20 h-40 bg-green-600 text-white rounded-r-full shadow-md opacity-50 flex items-center justify-center">
            </div>          
            <div class="flex-1 flex flex-col items-center pl-8">
              <div class="text-lg dark:text-gray-100">
                <span class="inline-block w-3 h-3 bg-green-600 rounded-full mr-2"></span>
                Total {{ ammObject.pool2.currency }}              
              </div>
              <div class="text-lg dark:text-gray-100">{{ formatNumber(fixedInteger(ammObject.pool2.amount)) }}</div>            
            </div>
          </div>
          <div class="flex flex-col items-center mt-6 mb-6 space-y-4">          
            <div class="flex items-center space-x-3">
              <span class="text-white">Swap</span>
              <input type="text" v-model="amount" class="bg-gray-200 text-gray-900 rounded p-2" placeholder="Amount" style="text-align: center;">
            </div>
            <div class="flex items-center space-x-3">
              <select v-model="currencyFrom" class="bg-gray-200 text-gray-900 rounded p-2">
                <option v-for="currency in currencies" :key="currency" :value="currency" v-if="currency">{{ currency }}</option>
              </select>
              <span class="text-white">Into</span>
              <select v-model="currencyTo" class="bg-gray-200 text-gray-900 rounded p-2" placeholder="Select currency" disabled>
                <option v-for="currency in currencies" :key="currency" :value="currency" v-if="currency">{{ currency }}</option>
              </select>
            </div>
            <div class="text-center">
              <UButton color="blue" size="xl" @click="tradeAmm">SWAP</UButton>
            </div>

            </div>
        </div>      

        <div class="bg-gray-700 p-4 rounded-lg mt-5" v-if="ammObject">          
          <div class="text-center text-xl text-white font-semibold font-body mb-6">Liquidity pool</div>
          <div class="overflow-hidden shadow-md sm:rounded-lg">
                <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-600 dark:text-gray-400">            
                    <tr>
                    <th scope="col" class="py-3 px-6 font-body">
                      Account
                    </th>
                    <th scope="col" class="py-3 px-6 font-body">
                        Amount
                    </th>
                    <th scope="col" class="py-3 px-6 font-body">
                        Share
                    </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="holder in ammObject.lpToken.holders" :key="holder.account" class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td class="py-3 px-6 font-body justify-center items-center">{{ holder.account }}</td>
                    <td class="py-3 px-6 font-body">{{ formatNumber(fixedInteger(holder.amount)) }}</td>
                    <td class="py-3 px-6 font-body">{{ holder.share }}</td>
                    </tr>              
                </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
    <div class="flex flex-col items-center p-4 w-1/3" v-if="ammObject">
      <div class="bg-gray-700 p-4 rounded-lg mt-20" style="width: 100%;">
        <div class="text-left text-2xl text-white font-semibold font-body mb-6">My account</div>
        <br/>
        <div class="flex justify-between text-l text-white font-semibold font-body mb-6">
          <div>{{ ammObject.pool1.currency }}-{{ ammObject.pool2.currency }} (LP Token)</div>
          <div>{{ balance3 }}</div>
        </div>
        <div class="flex justify-between text-l text-white font-semibold font-body mb-6">
          <div>{{ ammObject.pool1.currency }}</div>
          <div>{{  balance1 }}</div>
        </div>
        <div class="flex justify-between text-l text-white font-semibold font-body mb-6">
          <div>{{ ammObject.pool2.currency }}</div>
          <div>{{  balance2 }}</div>
        </div>        
      </div>
    </div>
  </div>
</template>
  
<script lang="ts" setup>
/* @ts-ignore */
import type { AmmObject } from '~/src/types';
import { dropsToXrp } from '~/src/util';

import API from '~/server/client'

import { ref, onMounted } from 'vue'

import { initializeWebsocket } from '~/src/xaman'

import { QRCodeModal } from '#components'

const modal = useModal()

const currencyTo = ref('');
const currencyFrom = ref('');
const currencies = ref<string[]>([]);
const amount = ref('');

// User balance
const balance1 = ref('');
const balance2 = ref('');
const balance3 = ref('');

const props = defineProps<{
    amm: AmmObject;
    issuer: string,
    currency: string,
    userToken: string,
    userAddress: string    
}>();

const ammObject = ref<AmmObject>();

const {
    amm,
    issuer,
    currency,
    userToken,
    userAddress
} = toRefs(props);

onMounted(async () => {
  ammObject.value = amm.value;
  currencyTo.value = ammObject.value.pool1.currency
  currencyFrom.value = ammObject.value.pool2.currency
  currencies.value = [ammObject.value.pool1.currency, ammObject.value.pool2.currency]

  updateBalances()
})

watch(currencyFrom, (newValue, oldValue) => {  
  if ((newValue !== oldValue) && (oldValue !== '')) {
    currencyTo.value = oldValue
  } 
})

function getPrice() {
  if (amm.value.pool1.currency === 'XRP') {
    return (parseInt(amm.value.pool2.amount) / parseInt(amm.value.pool1.amount)).toFixed(0) + ' ' + amm.value.pool2.currency
  } else {
    return (parseInt(amm.value.pool1.amount) / parseInt(amm.value.pool2.amount)).toFixed(0) + ' ' + amm.value.pool1.currency
  }
}

function fixedInteger(amount: string): number {
  return parseInt(parseInt(amount).toFixed(0))
}

function formatNumber(num: number): string {  
    if (num >= 1_000_000_000) {
        return (num / 1_000_000_000).toFixed(3) + 'B';
    } else if (num >= 1_000_000) {
        return (num / 1_000_000).toFixed(3) + 'M';
    } else if (num >= 1_000) {
        return (num / 1_000).toFixed(3) + 'K';
    } else {
        return (Math.floor(num * 1000) / 1000).toString()
    }
}

async function tradeAmm() {
  return new Promise(async (resolve, reject) => {
    try {
      const payload = await API.tradeAmm({
        userToken: userToken.value,
        buyer: userAddress.value,
        currencyFrom: currencyFrom.value,
        currencyFromPoolSize: (amm.value.pool1.currency === currencyFrom.value) ? amm.value.pool1.amount : amm.value.pool2.amount,
        currencyTo: currencyTo.value,
        currencyToPoolSize: (amm.value.pool1.currency === currencyTo.value) ? amm.value.pool1.amount : amm.value.pool2.amount,
        amount: amount.value,
        issuer: issuer.value,
      })

      const qrCodeSrc = payload.refs.qr_png
      const mobileUrl = payload.next.always
      const websocket_status = payload.refs.websocket_status

      // launch modal
      modal.open(QRCodeModal, {
        qrCodeSrc,
        mobileUrl
      })

      const ws = await initializeWebsocket({
        url: websocket_status,
        onMessage: async ({ data, wsClose }: { data: any, wsClose: any }) => {
          if ((data.payload.tx_type == 'OfferCreate') || (data.payload.tx_type == 'Payment')) {
            const result = await API.getAmm({ issuer: issuer.value, currency: currency.value })
            ammObject.value = result;
            await updateBalances()
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

async function updateBalances() {
  await getBalance((ammObject.value?.pool1.currency || ''), (ammObject.value?.pool1.issuer || '')).then((result) => {
    balance1.value = result;
  });
  
  await getBalance((ammObject.value?.pool2.currency || ''), (ammObject.value?.pool2.issuer || '')).then((result) => {
    balance2.value = result;
  });

  await getBalance((ammObject.value?.lpToken.currency || ''), (ammObject.value?.lpToken.issuer || '')).then((result) => {    
    balance3.value = result;
  });
}

async function getBalance(curr: string, iss: string): Promise<string> {
  if (curr.toLowerCase() === 'xrp') {
    const accountInfo = await API.getAccountInfo({ xrplAddress: userAddress.value })
    return formatNumber(dropsToXrp(fixedInteger(accountInfo.result.account_data.Balance)))
  } else {
    const token = await API.getToken({ 
      xrplAddress: userAddress.value,
      issuer: iss,
      currency: curr
    });
    if (token.length !== 0) {
      return formatNumber(fixedInteger(token[0].amount))  
    }    
    return formatNumber(fixedInteger("0"))
  }
}
</script>

<style scoped>
/* Additional styling can go here */
</style>