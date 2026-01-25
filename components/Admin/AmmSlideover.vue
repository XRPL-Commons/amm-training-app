<template>
  <USlideover v-model="isOpen" :ui="{ width: 'max-w-lg' }">
    <div class="h-full flex flex-col">
      <!-- Fixed Header -->
      <div class="flex-shrink-0 p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-title text-gray-800 dark:text-white">
              {{ amm ? `${amm.pool1.currency}/${amm.pool2.currency}` : (token?.currency ? `${token.currency}/XRP` : 'AMM Pool') }}
            </h2>
            <div class="text-sm text-gray-500">AMM Pool</div>
          </div>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="isOpen = false" />
        </div>
      </div>

      <!-- Scrollable Content -->
      <div class="flex-1 overflow-y-auto p-6 pt-4">
        <div v-if="loading" class="text-center py-12 text-gray-500">
          <Icon name="heroicons:arrow-path" class="w-8 h-8 animate-spin" />
        </div>

        <div v-else-if="error" class="text-center py-12 text-red-500">
          {{ error }}
        </div>

        <div v-else-if="amm">
        <!-- Pool Stats -->
        <div class="grid grid-cols-2 gap-3 mb-6">
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
            <div class="text-xs text-gray-500 uppercase">Trading Fee</div>
            <div class="text-lg font-bold text-gray-800 dark:text-white">{{ amm.trading_fee }}</div>
          </div>
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
            <div class="text-xs text-gray-500 uppercase">Price</div>
            <div class="text-lg font-bold text-gray-800 dark:text-white">{{ getPrice() }}</div>
          </div>
        </div>

        <!-- Action Tabs -->
        <div class="mb-4">
          <div class="flex bg-gray-100 dark:bg-gray-800 rounded-full p-1">
            <button
              v-for="tab in ['Swap', 'Deposit', 'Withdraw', 'Vote']"
              :key="tab"
              @click="activeTab = tab"
              :class="[
                'flex-1 px-3 py-1.5 text-xs font-medium rounded-full transition-colors',
                activeTab === tab
                  ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              ]"
            >
              {{ tab }}
            </button>
          </div>
        </div>

        <!-- Pool Composition -->
        <div class="mb-6">
          <div class="text-xs text-gray-500 uppercase mb-3">Pool Composition</div>
          <div class="space-y-3">
            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span class="font-medium text-gray-800 dark:text-white">{{ amm.pool1.currency }}</span>
                </div>
                <span class="text-gray-600 dark:text-gray-400">{{ formatAmount(amm.pool1.amount) }}</span>
              </div>
              <!-- Trustline info for non-XRP token -->
              <div v-if="amm.pool1.currency !== 'XRP'" class="flex items-center justify-between mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                <span class="text-xs text-gray-500">Your trustline limit: {{ userTrustlineForPool1 ? formatAmount(userTrustlineForPool1.limit) : 'None' }}</span>
                <UButton
                  size="xs"
                  color="primary"
                  variant="ghost"
                  :icon="userTrustlineForPool1 ? 'i-heroicons-pencil-square' : 'i-heroicons-plus'"
                  @click="openTrustlineModal(amm.pool1)"
                >
                  {{ userTrustlineForPool1 ? 'Edit' : 'Add' }}
                </UButton>
              </div>
            </div>
            <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span class="font-medium text-gray-800 dark:text-white">{{ amm.pool2.currency }}</span>
                </div>
                <span class="text-gray-600 dark:text-gray-400">{{ formatAmount(amm.pool2.amount) }}</span>
              </div>
              <!-- Trustline info for non-XRP token -->
              <div v-if="amm.pool2.currency !== 'XRP'" class="flex items-center justify-between mt-2 pt-2 border-t border-green-200 dark:border-green-800">
                <span class="text-xs text-gray-500">Your trustline limit: {{ userTrustlineForPool2 ? formatAmount(userTrustlineForPool2.limit) : 'None' }}</span>
                <UButton
                  size="xs"
                  color="primary"
                  variant="ghost"
                  :icon="userTrustlineForPool2 ? 'i-heroicons-pencil-square' : 'i-heroicons-plus'"
                  @click="openTrustlineModal(amm.pool2)"
                >
                  {{ userTrustlineForPool2 ? 'Edit' : 'Add' }}
                </UButton>
              </div>
            </div>
          </div>
        </div>

        <!-- Swap Section -->
        <div v-if="activeTab === 'Swap'" class="mb-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div class="text-xs text-gray-500 uppercase mb-3">Swap</div>
          <div class="space-y-3">
            <!-- You Pay -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs text-gray-500">You pay</span>
                <span class="text-xs text-gray-400">
                  Balance: {{ userBalanceFrom }}
                  <button
                    v-if="userBalanceFromNum > 0"
                    class="text-primary-500 hover:text-primary-400 ml-1"
                    @click="swapAmount = userBalanceFromNum.toString()"
                  >
                    Max
                  </button>
                </span>
              </div>
              <div class="flex items-center gap-2">
                <UInput
                  v-model="swapAmount"
                  type="number"
                  placeholder="0"
                  class="flex-1"
                  :ui="{ wrapper: insufficientBalance ? 'ring-2 ring-red-500 rounded-full' : '' }"
                />
                <div class="flex bg-gray-100 dark:bg-gray-700 rounded-full p-0.5">
                  <button
                    v-for="currency in [amm?.pool1?.currency, amm?.pool2?.currency]"
                    :key="currency"
                    @click="currencyFrom = currency"
                    :class="[
                      'px-3 py-1 text-xs font-medium rounded-full transition-colors',
                      currencyFrom === currency
                        ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    ]"
                  >
                    {{ currency }}
                  </button>
                </div>
              </div>
              <div v-if="insufficientBalance" class="text-xs text-red-500 mt-1">
                Insufficient balance
              </div>
            </div>

            <div class="flex justify-center">
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-arrow-down"
                size="xs"
                @click="swapCurrencies"
              />
            </div>

            <!-- You Receive -->
            <div>
              <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>You receive</span>
                <span class="font-medium text-gray-800 dark:text-white">{{ estimatedOutput }} {{ currencyTo }}</span>
              </div>
            </div>

            <!-- Trade Info & Warnings -->
            <div v-if="swapAmount && parseFloat(swapAmount) > 0" class="space-y-2 text-xs">
              <!-- Price Impact -->
              <div class="flex items-center justify-between">
                <span class="text-gray-500">Price impact</span>
                <span :class="priceImpactColor">{{ priceImpact }}</span>
              </div>

              <!-- Pool % -->
              <div class="flex items-center justify-between">
                <span class="text-gray-500">You receive % of pool</span>
                <span :class="poolPercentColor">{{ poolPercentOfOutput }}</span>
              </div>

              <!-- High Impact Warning -->
              <div
                v-if="priceImpactNum > 5"
                class="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-red-400"
              >
                <div class="flex items-center gap-2">
                  <Icon name="heroicons:exclamation-triangle" class="w-4 h-4" />
                  <span class="font-medium">High price impact!</span>
                </div>
                <p class="mt-1 text-red-400/80">
                  This trade moves the price significantly. You're trading against a small pool.
                </p>
              </div>

              <!-- Pool After Trade Preview -->
              <div class="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-2 mt-2">
                <div class="text-gray-500 mb-1">Pool after trade</div>
                <div class="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>{{ currencyFrom }}: {{ poolAfterFrom }}</span>
                  <span>{{ currencyTo }}: {{ poolAfterTo }}</span>
                </div>
              </div>
            </div>

            <UButton
              :color="priceImpactNum > 10 ? 'red' : 'primary'"
              block
              :loading="swapping"
              :disabled="!swapAmount || swapping || insufficientBalance"
              @click="executeSwap"
            >
              {{ priceImpactNum > 10 ? 'Swap anyway (high impact)' : `Swap ${currencyFrom} for ${currencyTo}` }}
            </UButton>
          </div>
        </div>

        <!-- Deposit Section -->
        <div v-if="activeTab === 'Deposit'" class="mb-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div class="text-xs text-gray-500 uppercase mb-3">Add Liquidity</div>
          <div class="space-y-3">
            <!-- Deposit Type Toggle -->
            <div class="flex bg-gray-100 dark:bg-gray-700 rounded-full p-0.5">
              <button
                @click="depositType = 'two-sided'"
                :class="[
                  'flex-1 px-3 py-1 text-xs font-medium rounded-full transition-colors',
                  depositType === 'two-sided'
                    ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                ]"
              >
                Both Assets
              </button>
              <button
                @click="depositType = 'single-sided'"
                :class="[
                  'flex-1 px-3 py-1 text-xs font-medium rounded-full transition-colors',
                  depositType === 'single-sided'
                    ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                ]"
              >
                Single Asset
              </button>
            </div>

            <!-- Two-Sided Deposit -->
            <div v-if="depositType === 'two-sided'" class="space-y-3">
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs text-gray-500">{{ amm?.pool1.currency }}</span>
                  <span class="text-xs text-gray-400">Balance: {{ getBalanceFor(amm?.pool1) }}</span>
                </div>
                <UInput
                  v-model="depositAmount1"
                  type="number"
                  placeholder="0"
                />
              </div>
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs text-gray-500">{{ amm?.pool2.currency }}</span>
                  <span class="text-xs text-gray-400">Balance: {{ getBalanceFor(amm?.pool2) }}</span>
                </div>
                <UInput
                  v-model="depositAmount2"
                  type="number"
                  placeholder="0"
                />
              </div>
              <div class="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700/50 rounded-lg p-2">
                Tip: Deposit both assets in the same ratio as the pool to avoid slippage.
                Current ratio: 1 {{ amm?.pool1.currency }} = {{ getPoolRatio() }} {{ amm?.pool2.currency }}
              </div>
            </div>

            <!-- Single-Sided Deposit -->
            <div v-else class="space-y-3">
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs text-gray-500">Amount to deposit</span>
                  <span class="text-xs text-gray-400">Balance: {{ getBalanceFor(depositSingleAsset === 'pool1' ? amm?.pool1 : amm?.pool2) }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <UInput
                    v-model="depositAmount1"
                    type="number"
                    placeholder="0"
                    class="flex-1"
                  />
                  <div class="flex bg-gray-100 dark:bg-gray-700 rounded-full p-0.5">
                    <button
                      v-for="(pool, key) in { pool1: amm?.pool1, pool2: amm?.pool2 }"
                      :key="key"
                      @click="depositSingleAsset = key"
                      :class="[
                        'px-3 py-1 text-xs font-medium rounded-full transition-colors',
                        depositSingleAsset === key
                          ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      ]"
                    >
                      {{ pool?.currency }}
                    </button>
                  </div>
                </div>
              </div>
              <div class="text-xs text-orange-400 bg-orange-500/10 rounded-lg p-2">
                Note: Single-sided deposits incur price impact similar to a swap.
              </div>
            </div>

            <UButton
              color="primary"
              block
              :loading="depositing"
              :disabled="!canDeposit"
              @click="executeDeposit"
            >
              Add Liquidity
            </UButton>
          </div>
        </div>

        <!-- Withdraw Section -->
        <div v-if="activeTab === 'Withdraw'" class="mb-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div class="text-xs text-gray-500 uppercase mb-3">Remove Liquidity</div>

          <!-- User's LP Position -->
          <div v-if="userLpPosition" class="mb-4 bg-primary-500/10 border border-primary-500/30 rounded-lg p-3">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs text-gray-500">Your LP Position</span>
              <span class="text-sm font-medium text-primary-400">{{ userLpPosition.share }}</span>
            </div>
            <div class="text-lg font-bold text-gray-800 dark:text-white">
              {{ formatAmount(userLpPosition.amount.toString()) }} LP
            </div>
          </div>

          <div v-else class="mb-4 text-center py-4 text-gray-500 text-sm">
            You don't have any LP tokens in this pool.
          </div>

          <div v-if="userLpPosition" class="space-y-3">
            <!-- Withdraw Amount -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs text-gray-500">LP Tokens to withdraw</span>
                <button
                  class="text-xs text-primary-500 hover:text-primary-400"
                  @click="withdrawAmount = userLpPosition.amount.toString()"
                >
                  Max
                </button>
              </div>
              <UInput
                v-model="withdrawAmount"
                type="number"
                placeholder="0"
                :max="userLpPosition.amount"
              />
            </div>

            <!-- Estimated Output -->
            <div v-if="withdrawAmount && parseFloat(withdrawAmount) > 0" class="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-2 text-xs">
              <div class="text-gray-500 mb-1">Estimated output</div>
              <div class="flex justify-between text-gray-600 dark:text-gray-400">
                <span>{{ amm?.pool1.currency }}: ~{{ estimatedWithdraw1 }}</span>
                <span>{{ amm?.pool2.currency }}: ~{{ estimatedWithdraw2 }}</span>
              </div>
            </div>

            <UButton
              color="red"
              variant="soft"
              block
              :loading="withdrawing"
              :disabled="!canWithdraw"
              @click="executeWithdraw"
            >
              Remove Liquidity
            </UButton>

            <!-- Withdraw All Button -->
            <UButton
              color="gray"
              variant="ghost"
              block
              :loading="withdrawing"
              @click="executeWithdrawAll"
            >
              Withdraw All
            </UButton>
          </div>
        </div>

        <!-- Vote Section -->
        <div v-if="activeTab === 'Vote'" class="mb-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div class="text-xs text-gray-500 uppercase mb-3">Vote on Trading Fee</div>

          <!-- Current Fee -->
          <div class="mb-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg p-3">
            <div class="text-xs text-gray-500 mb-1">Current Trading Fee</div>
            <div class="text-2xl font-bold text-gray-800 dark:text-white">{{ amm?.trading_fee }}</div>
          </div>

          <!-- Voting Eligibility -->
          <div v-if="!userLpPosition" class="mb-4 text-center py-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <Icon name="heroicons:exclamation-triangle" class="w-6 h-6 text-orange-400 mb-2" />
            <p class="text-sm text-orange-400">
              You must be a liquidity provider to vote on fees.
            </p>
          </div>

          <div v-else class="space-y-3">
            <div class="text-xs text-gray-400 mb-2">
              As an LP holder ({{ userLpPosition.share }}), your vote is weighted by your share of the pool.
            </div>

            <!-- Fee Slider -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs text-gray-500">Your vote</span>
                <span class="text-sm font-medium text-gray-800 dark:text-white">{{ (voteFee / 100).toFixed(2) }}%</span>
              </div>
              <input
                type="range"
                v-model="voteFee"
                min="0"
                max="1000"
                step="1"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <div class="flex justify-between text-xs text-gray-400 mt-1">
                <span>0%</span>
                <span>0.5%</span>
                <span>1%</span>
              </div>
            </div>

            <!-- Common Fee Options -->
            <div class="flex gap-2">
              <UButton
                v-for="fee in [100, 300, 500, 1000]"
                :key="fee"
                size="xs"
                :color="voteFee === fee ? 'primary' : 'gray'"
                :variant="voteFee === fee ? 'solid' : 'ghost'"
                @click="voteFee = fee"
              >
                {{ (fee / 100).toFixed(1) }}%
              </UButton>
            </div>

            <UButton
              color="primary"
              block
              :loading="voting"
              @click="executeVote"
            >
              Submit Vote
            </UButton>

            <div class="text-xs text-gray-400 text-center">
              Fee changes are weighted by LP share. The effective fee is calculated from all LP votes.
            </div>
          </div>
        </div>

        <!-- LP Token Holders -->
        <div>
          <div class="text-xs text-gray-500 uppercase mb-3">LP Holders ({{ amm.lpToken.holders.length }})</div>
          <div class="space-y-2 max-h-40 overflow-y-auto">
            <div
              v-for="holder in amm.lpToken.holders"
              :key="holder.account"
              :class="[
                'rounded-lg p-3 cursor-pointer transition-colors',
                holder.account === currentUserAddress
                  ? 'bg-primary-500/10 border border-primary-500/30 hover:bg-primary-500/20'
                  : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
              ]"
              @click="emit('viewUser', holder.account)"
            >
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center gap-2">
                  <ColoredAddress :address="holder.account" variant="text" class="text-xs" />
                  <span
                    v-if="holder.account === currentUserAddress"
                    class="px-1.5 py-0.5 text-[10px] font-medium rounded bg-primary-500/20 text-primary-400"
                  >
                    You
                  </span>
                </div>
                <span class="text-sm font-medium text-gray-800 dark:text-white">{{ holder.share }}</span>
              </div>
              <div class="text-xs text-gray-500">{{ formatAmount(holder.amount.toString()) }} LP</div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>

    <!-- QR Code Modal for signing -->
    <UModal v-model="showQrModal">
      <div class="p-6 text-center">
        <h3 class="text-lg font-title mb-4 text-gray-800 dark:text-white">Sign with Xaman</h3>
        <img v-if="qrCodeSrc" :src="qrCodeSrc" class="mx-auto mb-4 rounded-lg" />
        <p class="text-sm text-gray-500 mb-4">Scan with Xaman or click below on mobile</p>
        <UButton v-if="mobileUrl" :to="mobileUrl" external color="primary" block>
          Open Xaman
        </UButton>
      </div>
    </UModal>

    <!-- Trustline Limit Modal -->
    <UModal v-model="showTrustlineModal">
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-title text-gray-800 dark:text-white">
            Set Trustline Limit
          </h3>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="showTrustlineModal = false" />
        </div>
        <div v-if="editingPool" class="mb-4">
          <div class="text-sm text-gray-500 mb-1">{{ editingPool.currency }}</div>
          <div class="mb-2">
            <ColoredAddress :address="editingPool.issuer" />
          </div>
          <div class="text-xs text-gray-400 mb-4">
            Current limit: {{ getCurrentTrustlineLimit() }}
          </div>
          <UFormGroup label="New Limit" :hint="formatLimitHint(newTrustlineLimit)">
            <UInput
              v-model="newTrustlineLimit"
              type="text"
              placeholder="Enter new limit amount"
              size="lg"
            />
          </UFormGroup>
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <UButton color="primary" variant="ghost" @click="showTrustlineModal = false">
            Cancel
          </UButton>
          <UButton
            color="primary"
            @click="confirmSetTrustline"
            :loading="trustlineLoading"
          >
            Set Limit
          </UButton>
        </div>
      </div>
    </UModal>
  </USlideover>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import API from '~/server/client'

const { getTrustlineFor, refreshWalletData, walletTokens, walletXrpBalance } = useWallet()

interface Token {
  currency: string
  currencyRaw?: string // Original format from ledger (3-char or 40-char hex)
  issuer: string
  amount: string
}

interface AmmPool {
  currency: string
  currencyRaw: string // Original format from ledger (3-char or 40-char hex)
  amount: string
  issuer: string
}

interface LpHolder {
  account: string
  amount: number
  share: string
}

interface Amm {
  pool1: AmmPool
  pool2: AmmPool
  trading_fee: string
  lpToken: {
    issuer: string
    amount: string
    currency: string
    currencyRaw: string // Raw hex for LP tokens (starts with 03)
    holders: LpHolder[]
  }
  id: string
}

const props = defineProps<{
  token: Token | null
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'viewUser': [address: string]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const loading = ref(false)
const error = ref('')
const amm = ref<Amm | null>(null)
const swapping = ref(false)

// Tab state
const activeTab = ref('Swap')

// Swap state
const swapAmount = ref('')
const currencyFrom = ref('')
const currencyTo = ref('')

// Deposit state
const depositType = ref<'two-sided' | 'single-sided'>('two-sided')
const depositSingleAsset = ref<'pool1' | 'pool2'>('pool1')
const depositAmount1 = ref('')
const depositAmount2 = ref('')
const depositing = ref(false)

// Withdraw state
const withdrawAmount = ref('')
const withdrawing = ref(false)

// Vote state
const voteFee = ref(500) // Default 0.5% (500 basis points)
const voting = ref(false)


// Trustline modal state
const showTrustlineModal = ref(false)
const editingPool = ref<AmmPool | null>(null)
const newTrustlineLimit = ref('')
const trustlineLoading = ref(false)

// QR Modal state
const showQrModal = ref(false)
const qrCodeSrc = ref('')
const mobileUrl = ref('')

const userBalanceFromNum = computed(() => {
  if (!currencyFrom.value || !amm.value) return 0
  if (currencyFrom.value === 'XRP') {
    return parseFloat(walletXrpBalance.value) || 0
  }
  // Find the pool to get the issuer
  const pool = currencyFrom.value === amm.value.pool1.currency ? amm.value.pool1 : amm.value.pool2
  const token = getTrustlineFor(pool.currency, pool.issuer)
  return token ? parseFloat(token.amount) : 0
})

const userBalanceFrom = computed(() => {
  return formatAmount(userBalanceFromNum.value.toString())
})

const insufficientBalance = computed(() => {
  if (!swapAmount.value) return false
  const amount = parseFloat(swapAmount.value)
  if (isNaN(amount)) return false
  return amount > userBalanceFromNum.value
})

// Raw output amount (not formatted)
const estimatedOutputNum = computed(() => {
  if (!amm.value || !swapAmount.value) return 0
  const inputAmount = parseFloat(swapAmount.value)
  if (isNaN(inputAmount) || inputAmount <= 0) return 0

  const pool1Amount = parseFloat(amm.value.pool1.amount)
  const pool2Amount = parseFloat(amm.value.pool2.amount)

  // AMM constant product formula: outputAmount = (inputAmount * outputReserve) / (inputReserve + inputAmount)
  let outputAmount: number
  if (currencyFrom.value === amm.value.pool1.currency) {
    outputAmount = (inputAmount * pool2Amount) / (pool1Amount + inputAmount)
  } else {
    outputAmount = (inputAmount * pool1Amount) / (pool2Amount + inputAmount)
  }

  // Apply trading fee
  const feePercent = parseFloat(amm.value.trading_fee) / 100
  return outputAmount * (1 - feePercent)
})

const estimatedOutput = computed(() => {
  return formatAmount(estimatedOutputNum.value.toString())
})

// Price impact calculation
const priceImpactNum = computed(() => {
  if (!amm.value || !swapAmount.value) return 0
  const inputAmount = parseFloat(swapAmount.value)
  if (isNaN(inputAmount) || inputAmount <= 0) return 0

  const pool1Amount = parseFloat(amm.value.pool1.amount)
  const pool2Amount = parseFloat(amm.value.pool2.amount)

  // Spot price (what you'd get for infinitely small trade)
  let spotPrice: number
  if (currencyFrom.value === amm.value.pool1.currency) {
    spotPrice = pool2Amount / pool1Amount
  } else {
    spotPrice = pool1Amount / pool2Amount
  }

  // Effective price (what you actually get)
  const effectivePrice = estimatedOutputNum.value / inputAmount

  // Price impact = (spotPrice - effectivePrice) / spotPrice * 100
  return ((spotPrice - effectivePrice) / spotPrice) * 100
})

const priceImpact = computed(() => {
  return priceImpactNum.value.toFixed(2) + '%'
})

const priceImpactColor = computed(() => {
  if (priceImpactNum.value > 10) return 'text-red-500 font-medium'
  if (priceImpactNum.value > 5) return 'text-orange-500 font-medium'
  if (priceImpactNum.value > 1) return 'text-yellow-500'
  return 'text-green-500'
})

// Pool percentage of output
const poolPercentOfOutput = computed(() => {
  if (!amm.value || estimatedOutputNum.value <= 0) return '0%'

  const pool1Amount = parseFloat(amm.value.pool1.amount)
  const pool2Amount = parseFloat(amm.value.pool2.amount)

  const outputPool = currencyFrom.value === amm.value.pool1.currency ? pool2Amount : pool1Amount
  const percent = (estimatedOutputNum.value / outputPool) * 100

  return percent.toFixed(1) + '%'
})

const poolPercentColor = computed(() => {
  if (!amm.value) return 'text-gray-400'

  const pool1Amount = parseFloat(amm.value.pool1.amount)
  const pool2Amount = parseFloat(amm.value.pool2.amount)
  const outputPool = currencyFrom.value === amm.value.pool1.currency ? pool2Amount : pool1Amount
  const percent = (estimatedOutputNum.value / outputPool) * 100

  if (percent > 50) return 'text-red-500 font-medium'
  if (percent > 20) return 'text-orange-500 font-medium'
  if (percent > 5) return 'text-yellow-500'
  return 'text-gray-400'
})

// Pool state after trade
const poolAfterFrom = computed(() => {
  if (!amm.value || !swapAmount.value) return '-'
  const inputAmount = parseFloat(swapAmount.value)
  if (isNaN(inputAmount) || inputAmount <= 0) return '-'

  const pool1Amount = parseFloat(amm.value.pool1.amount)
  const pool2Amount = parseFloat(amm.value.pool2.amount)

  const currentPool = currencyFrom.value === amm.value.pool1.currency ? pool1Amount : pool2Amount
  return formatAmount((currentPool + inputAmount).toString())
})

const poolAfterTo = computed(() => {
  if (!amm.value || !swapAmount.value) return '-'
  const inputAmount = parseFloat(swapAmount.value)
  if (isNaN(inputAmount) || inputAmount <= 0) return '-'

  const pool1Amount = parseFloat(amm.value.pool1.amount)
  const pool2Amount = parseFloat(amm.value.pool2.amount)

  const currentPool = currencyFrom.value === amm.value.pool1.currency ? pool2Amount : pool1Amount
  // Note: estimatedOutputNum already has fee applied, but pool loses the full amount before fee
  const outputBeforeFee = estimatedOutputNum.value / (1 - parseFloat(amm.value.trading_fee) / 100)
  return formatAmount((currentPool - outputBeforeFee).toString())
})

// Current user address for highlighting LP holders
const currentUserAddress = computed(() => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('xrpl_address') || ''
  }
  return ''
})

// User's trustline for pool1 (non-XRP token) - uses wallet composable
const userTrustlineForPool1 = computed(() => {
  if (!amm.value || amm.value.pool1.currency === 'XRP') return null
  return getTrustlineFor(amm.value.pool1.currency, amm.value.pool1.issuer)
})

// User's trustline for pool2 (non-XRP token) - uses wallet composable
const userTrustlineForPool2 = computed(() => {
  if (!amm.value || amm.value.pool2.currency === 'XRP') return null
  return getTrustlineFor(amm.value.pool2.currency, amm.value.pool2.issuer)
})

// User's LP position in this pool
const userLpPosition = computed(() => {
  if (!amm.value) return null
  return amm.value.lpToken.holders.find(h => h.account === currentUserAddress.value)
})

// Can deposit validation
const canDeposit = computed(() => {
  if (depositType.value === 'two-sided') {
    return depositAmount1.value && depositAmount2.value &&
           parseFloat(depositAmount1.value) > 0 && parseFloat(depositAmount2.value) > 0
  } else {
    return depositAmount1.value && parseFloat(depositAmount1.value) > 0
  }
})

// Can withdraw validation
const canWithdraw = computed(() => {
  if (!userLpPosition.value || !withdrawAmount.value) return false
  const amount = parseFloat(withdrawAmount.value)
  return amount > 0 && amount <= userLpPosition.value.amount
})

// Estimated withdraw amounts
const estimatedWithdraw1 = computed(() => {
  if (!amm.value || !userLpPosition.value || !withdrawAmount.value) return '0'
  const lpAmount = parseFloat(withdrawAmount.value)
  const totalLp = parseFloat(amm.value.lpToken.amount)
  const share = lpAmount / totalLp
  const amount = share * parseFloat(amm.value.pool1.amount)
  return formatAmount(amount.toString())
})

const estimatedWithdraw2 = computed(() => {
  if (!amm.value || !userLpPosition.value || !withdrawAmount.value) return '0'
  const lpAmount = parseFloat(withdrawAmount.value)
  const totalLp = parseFloat(amm.value.lpToken.amount)
  const share = lpAmount / totalLp
  const amount = share * parseFloat(amm.value.pool2.amount)
  return formatAmount(amount.toString())
})

watch(() => props.token, async (newToken) => {
  if (newToken && isOpen.value) {
    await loadAmm()
  }
}, { immediate: true })

watch(isOpen, async (open) => {
  if (open && props.token) {
    await loadAmm()
  }
})

watch(currencyFrom, (newVal) => {
  if (!amm.value) return
  currencyTo.value = newVal === amm.value.pool1.currency
    ? amm.value.pool2.currency
    : amm.value.pool1.currency
})

async function loadAmm() {
  if (!props.token) return
  loading.value = true
  error.value = ''
  amm.value = null
  swapAmount.value = ''
  depositAmount1.value = ''
  depositAmount2.value = ''
  withdrawAmount.value = ''

  try {
    // Load AMM data and refresh wallet data in parallel
    const [ammData] = await Promise.all([
      API.getAmm({
        issuer: props.token.issuer,
        currency: props.token.currencyRaw || props.token.currency // Use raw format if available
      }),
      refreshWalletData() // Ensure wallet data is fresh
    ])

    amm.value = ammData
    // Set initial currencies
    currencyFrom.value = amm.value.pool2.currency
    currencyTo.value = amm.value.pool1.currency
  } catch (e) {
    error.value = 'No AMM pool found for this token'
  } finally {
    loading.value = false
  }
}

function swapCurrencies() {
  const temp = currencyFrom.value
  currencyFrom.value = currencyTo.value
  currencyTo.value = temp
}

async function executeSwap() {
  if (!amm.value || !props.token || !swapAmount.value) return

  const userToken = localStorage.getItem('user_token')
  const userAddress = localStorage.getItem('xrpl_address')

  if (!userToken || !userAddress) {
    alert('Please sign in with Xaman first')
    return
  }

  swapping.value = true

  try {
    // Get the raw currency format (as stored on ledger) for the transaction
    const fromPool = currencyFrom.value === amm.value.pool1.currency ? amm.value.pool1 : amm.value.pool2
    const toPool = currencyTo.value === amm.value.pool1.currency ? amm.value.pool1 : amm.value.pool2

    const payload = await API.tradeAmm({
      userToken,
      buyer: userAddress,
      currencyFrom: fromPool.currencyRaw, // Use raw format for transaction
      currencyFromPoolSize: fromPool.amount,
      currencyTo: toPool.currencyRaw, // Use raw format for transaction
      currencyToPoolSize: toPool.amount,
      amount: swapAmount.value,
      issuer: props.token.issuer
    })

    qrCodeSrc.value = payload.refs.qr_png
    mobileUrl.value = payload.next.always
    showQrModal.value = true

    // Listen for signing
    const ws = new WebSocket(payload.refs.websocket_status)
    ws.onmessage = async (message) => {
      const data = JSON.parse(message.data)
      if (data.signed === true) {
        showQrModal.value = false
        ws.close()
        swapAmount.value = ''
        // Wait for transaction to be validated on ledger before refreshing
        await new Promise(resolve => setTimeout(resolve, 4000))
        await Promise.all([loadAmm(), refreshWalletData()])
      }
    }
  } catch (error) {
    console.error('Failed to execute swap:', error)
    alert('Failed to execute swap')
  } finally {
    swapping.value = false
  }
}

function getPrice(): string {
  if (!amm.value) return ''
  // Show price as "1 XRP = X tokens" format
  if (amm.value.pool1.currency === 'XRP') {
    const price = parseFloat(amm.value.pool2.amount) / parseFloat(amm.value.pool1.amount)
    return formatAmount(price.toString()) + ' ' + amm.value.pool2.currency
  } else {
    const price = parseFloat(amm.value.pool1.amount) / parseFloat(amm.value.pool2.amount)
    return formatAmount(price.toString()) + ' ' + amm.value.pool1.currency
  }
}

function formatAmount(amount: string): string {
  const num = parseFloat(amount)
  if (Math.abs(num) >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + 'B'
  if (Math.abs(num) >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M'
  if (Math.abs(num) >= 1_000) return (num / 1_000).toFixed(2) + 'K'
  return num.toLocaleString()
}

function formatLimitHint(value: string): string {
  const num = parseFloat(value)
  if (isNaN(num)) return ''
  if (Math.abs(num) >= 1_000_000_000_000) return `= ${(num / 1_000_000_000_000).toFixed(2)} Trillion`
  if (Math.abs(num) >= 1_000_000_000) return `= ${(num / 1_000_000_000).toFixed(2)} Billion`
  if (Math.abs(num) >= 1_000_000) return `= ${(num / 1_000_000).toFixed(2)} Million`
  if (Math.abs(num) >= 1_000) return `= ${(num / 1_000).toFixed(2)} Thousand`
  return `= ${num.toLocaleString()}`
}

function openTrustlineModal(pool: AmmPool) {
  editingPool.value = pool
  const existingTrustline = getTrustlineFor(pool.currency, pool.issuer)
  newTrustlineLimit.value = existingTrustline?.limit || '1000000000'
  showTrustlineModal.value = true
}

function getCurrentTrustlineLimit(): string {
  if (!editingPool.value) return 'None'
  const trustline = getTrustlineFor(editingPool.value.currency, editingPool.value.issuer)
  return trustline ? formatAmount(trustline.limit) : 'None'
}

async function confirmSetTrustline() {
  if (!editingPool.value) return

  const userToken = localStorage.getItem('user_token')
  const userAddress = localStorage.getItem('xrpl_address')

  if (!userToken || !userAddress) {
    alert('Please sign in with Xaman first')
    return
  }

  trustlineLoading.value = true

  try {
    const payload = await API.createTrustline({
      userToken,
      account: userAddress,
      issuer: editingPool.value.issuer,
      currency: editingPool.value.currencyRaw, // Use raw format for transaction
      limit: newTrustlineLimit.value
    })

    showTrustlineModal.value = false
    qrCodeSrc.value = payload.refs.qr_png
    mobileUrl.value = payload.next.always
    showQrModal.value = true

    // Listen for signing
    const ws = new WebSocket(payload.refs.websocket_status)
    ws.onmessage = async (message) => {
      const data = JSON.parse(message.data)
      if (data.signed === true) {
        showQrModal.value = false
        ws.close()
        await refreshWalletData() // Refresh wallet trustlines
        await loadAmm() // Refresh pool data
      }
    }
  } catch (error) {
    console.error('Failed to create trustline:', error)
    alert('Failed to create trustline')
  } finally {
    trustlineLoading.value = false
  }
}

// Helper functions for deposit/withdraw
function getBalanceFor(pool: AmmPool | undefined): string {
  if (!pool) return '0'
  if (pool.currency === 'XRP') {
    return formatAmount(walletXrpBalance.value)
  }
  const token = getTrustlineFor(pool.currency, pool.issuer)
  return token ? formatAmount(token.amount) : '0'
}

function getPoolRatio(): string {
  if (!amm.value) return '0'
  const ratio = parseFloat(amm.value.pool2.amount) / parseFloat(amm.value.pool1.amount)
  return formatAmount(ratio.toString())
}

// Deposit function
async function executeDeposit() {
  if (!amm.value) return

  const userToken = localStorage.getItem('user_token')
  const userAddress = localStorage.getItem('xrpl_address')

  if (!userToken || !userAddress) {
    alert('Please sign in with Xaman first')
    return
  }

  depositing.value = true

  try {
    const asset1 = {
      currency: amm.value.pool1.currencyRaw,
      issuer: amm.value.pool1.currency === 'XRP' ? undefined : amm.value.pool1.issuer
    }
    const asset2 = {
      currency: amm.value.pool2.currencyRaw,
      issuer: amm.value.pool2.currency === 'XRP' ? undefined : amm.value.pool2.issuer
    }

    let payload
    if (depositType.value === 'two-sided') {
      payload = await API.depositAmm({
        userToken,
        account: userAddress,
        asset1,
        asset2,
        amount1: depositAmount1.value,
        amount2: depositAmount2.value,
        singleSided: false
      })
    } else {
      // Single-sided deposit
      const depositAsset = depositSingleAsset.value === 'pool1' ? asset1 : asset2
      payload = await API.depositAmm({
        userToken,
        account: userAddress,
        asset1: depositAsset,
        asset2: depositSingleAsset.value === 'pool1' ? asset2 : asset1,
        amount1: depositAmount1.value,
        singleSided: true
      })
    }

    qrCodeSrc.value = payload.refs.qr_png
    mobileUrl.value = payload.next.always
    showQrModal.value = true

    const ws = new WebSocket(payload.refs.websocket_status)
    ws.onmessage = async (message) => {
      const data = JSON.parse(message.data)
      if (data.signed === true) {
        showQrModal.value = false
        ws.close()
        depositAmount1.value = ''
        depositAmount2.value = ''
        // Wait for transaction to be validated on ledger before refreshing
        await new Promise(resolve => setTimeout(resolve, 4000))
        await Promise.all([loadAmm(), refreshWalletData()])
      }
    }
  } catch (error) {
    console.error('Failed to deposit:', error)
    alert('Failed to create deposit transaction')
  } finally {
    depositing.value = false
  }
}

// Withdraw function
async function executeWithdraw() {
  if (!amm.value || !userLpPosition.value) return

  const userToken = localStorage.getItem('user_token')
  const userAddress = localStorage.getItem('xrpl_address')

  if (!userToken || !userAddress) {
    alert('Please sign in with Xaman first')
    return
  }

  withdrawing.value = true

  try {
    const asset1 = {
      currency: amm.value.pool1.currencyRaw,
      issuer: amm.value.pool1.currency === 'XRP' ? undefined : amm.value.pool1.issuer
    }
    const asset2 = {
      currency: amm.value.pool2.currencyRaw,
      issuer: amm.value.pool2.currency === 'XRP' ? undefined : amm.value.pool2.issuer
    }

    const payload = await API.withdrawAmm({
      userToken,
      account: userAddress,
      asset1,
      asset2,
      lpTokenIn: withdrawAmount.value,
      lpTokenCurrency: amm.value.lpToken.currencyRaw, // Use raw hex for LP tokens
      lpTokenIssuer: amm.value.lpToken.issuer
    })

    qrCodeSrc.value = payload.refs.qr_png
    mobileUrl.value = payload.next.always
    showQrModal.value = true

    const ws = new WebSocket(payload.refs.websocket_status)
    ws.onmessage = async (message) => {
      const data = JSON.parse(message.data)
      if (data.signed === true) {
        showQrModal.value = false
        ws.close()
        withdrawAmount.value = ''
        // Wait for transaction to be validated on ledger before refreshing
        await new Promise(resolve => setTimeout(resolve, 4000))
        await Promise.all([loadAmm(), refreshWalletData()])
      }
    }
  } catch (error) {
    console.error('Failed to withdraw:', error)
    alert('Failed to create withdraw transaction')
  } finally {
    withdrawing.value = false
  }
}

// Withdraw all function
async function executeWithdrawAll() {
  if (!amm.value || !userLpPosition.value) return

  const userToken = localStorage.getItem('user_token')
  const userAddress = localStorage.getItem('xrpl_address')

  if (!userToken || !userAddress) {
    alert('Please sign in with Xaman first')
    return
  }

  withdrawing.value = true

  try {
    const asset1 = {
      currency: amm.value.pool1.currencyRaw,
      issuer: amm.value.pool1.currency === 'XRP' ? undefined : amm.value.pool1.issuer
    }
    const asset2 = {
      currency: amm.value.pool2.currencyRaw,
      issuer: amm.value.pool2.currency === 'XRP' ? undefined : amm.value.pool2.issuer
    }

    const payload = await API.withdrawAmm({
      userToken,
      account: userAddress,
      asset1,
      asset2,
      lpTokenCurrency: amm.value.lpToken.currencyRaw, // Use raw hex for LP tokens
      lpTokenIssuer: amm.value.lpToken.issuer,
      withdrawAll: true
    })

    qrCodeSrc.value = payload.refs.qr_png
    mobileUrl.value = payload.next.always
    showQrModal.value = true

    const ws = new WebSocket(payload.refs.websocket_status)
    ws.onmessage = async (message) => {
      const data = JSON.parse(message.data)
      if (data.signed === true) {
        showQrModal.value = false
        ws.close()
        withdrawAmount.value = ''
        // Wait for transaction to be validated on ledger before refreshing
        await new Promise(resolve => setTimeout(resolve, 4000))
        await Promise.all([loadAmm(), refreshWalletData()])
      }
    }
  } catch (error) {
    console.error('Failed to withdraw all:', error)
    alert('Failed to create withdraw transaction')
  } finally {
    withdrawing.value = false
  }
}

// Vote function
async function executeVote() {
  if (!amm.value || !userLpPosition.value) return

  const userToken = localStorage.getItem('user_token')
  const userAddress = localStorage.getItem('xrpl_address')

  if (!userToken || !userAddress) {
    alert('Please sign in with Xaman first')
    return
  }

  voting.value = true

  try {
    const asset1 = {
      currency: amm.value.pool1.currencyRaw,
      issuer: amm.value.pool1.currency === 'XRP' ? undefined : amm.value.pool1.issuer
    }
    const asset2 = {
      currency: amm.value.pool2.currencyRaw,
      issuer: amm.value.pool2.currency === 'XRP' ? undefined : amm.value.pool2.issuer
    }

    const payload = await API.voteAmmFee({
      userToken,
      account: userAddress,
      asset1,
      asset2,
      tradingFee: voteFee.value
    })

    qrCodeSrc.value = payload.refs.qr_png
    mobileUrl.value = payload.next.always
    showQrModal.value = true

    const ws = new WebSocket(payload.refs.websocket_status)
    ws.onmessage = async (message) => {
      const data = JSON.parse(message.data)
      if (data.signed === true) {
        showQrModal.value = false
        ws.close()
        // Wait for transaction to be validated on ledger before refreshing
        await new Promise(resolve => setTimeout(resolve, 4000))
        await loadAmm()
      }
    }
  } catch (error) {
    console.error('Failed to vote:', error)
    alert('Failed to create vote transaction')
  } finally {
    voting.value = false
  }
}
</script>
