// SPDX-License-Identifier: Apache-2.0

import { defineStore } from 'pinia'
import { reward_redemptionsService } from '../services/reward_redemptions-service'
import { translate } from '../i18n/translate'
import type { RewardRedemptionItem, CreateRewardRedemptionRequest } from '../types/reward_redemptions'

/** 兑换记录状态（Taro Vue3，pinia）：列表 + 增/删，乐观更新。 */
export const useRewardRedemptionsStore = defineStore('reward_redemptions', {
  state: () => ({
    items: [] as RewardRedemptionItem[],
    isLoading: false,
    error: null as string | null,
  }),
  actions: {
    async load() {
      this.isLoading = true
      this.error = null
      try {
        this.items = await reward_redemptionsService.getRewardRedemptions()
      } catch (err: any) {
        this.error = err.message || translate('reward_redemptions.loadFailed')
      } finally {
        this.isLoading = false
      }
    },

    async add(dto: CreateRewardRedemptionRequest) {
      const item = await reward_redemptionsService.create(dto)
      this.items = [...this.items, item]
    },

    async remove(id: number) {
      const prev = this.items
      this.items = prev.filter((i) => i.id !== id)
      try {
        await reward_redemptionsService.remove(id)
      } catch (err: any) {
        this.items = prev
        throw new Error(err.message || translate('reward_redemptions.deleteFailed'))
      }
    },
  },
})
