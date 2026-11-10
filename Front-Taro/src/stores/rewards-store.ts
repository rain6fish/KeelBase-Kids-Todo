// SPDX-License-Identifier: Apache-2.0

import { defineStore } from 'pinia'
import { rewardsService } from '../services/rewards-service'
import { translate } from '../i18n/translate'
import type { RewardItem, CreateRewardRequest } from '../types/rewards'

/** 奖励状态（Taro Vue3，pinia）：列表 + 增/删，乐观更新。 */
export const useRewardsStore = defineStore('rewards', {
  state: () => ({
    items: [] as RewardItem[],
    isLoading: false,
    error: null as string | null,
  }),
  actions: {
    async load() {
      this.isLoading = true
      this.error = null
      try {
        this.items = await rewardsService.getRewards()
      } catch (err: any) {
        this.error = err.message || translate('rewards.loadFailed')
      } finally {
        this.isLoading = false
      }
    },

    async add(dto: CreateRewardRequest) {
      const item = await rewardsService.create(dto)
      this.items = [...this.items, item]
    },

    async remove(id: number) {
      const prev = this.items
      this.items = prev.filter((i) => i.id !== id)
      try {
        await rewardsService.remove(id)
      } catch (err: any) {
        this.items = prev
        throw new Error(err.message || translate('rewards.deleteFailed'))
      }
    },
  },
})
