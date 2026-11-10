// SPDX-License-Identifier: Apache-2.0

import { defineStore } from 'pinia'
import { badge_awardsService } from '../services/badge_awards-service'
import { translate } from '../i18n/translate'
import type { BadgeAwardItem, CreateBadgeAwardRequest } from '../types/badge_awards'

/** 徽章授予状态（Taro Vue3，pinia）：列表 + 增/删，乐观更新。 */
export const useBadgeAwardsStore = defineStore('badge_awards', {
  state: () => ({
    items: [] as BadgeAwardItem[],
    isLoading: false,
    error: null as string | null,
  }),
  actions: {
    async load() {
      this.isLoading = true
      this.error = null
      try {
        this.items = await badge_awardsService.getBadgeAwards()
      } catch (err: any) {
        this.error = err.message || translate('badge_awards.loadFailed')
      } finally {
        this.isLoading = false
      }
    },

    async add(dto: CreateBadgeAwardRequest) {
      const item = await badge_awardsService.create(dto)
      this.items = [...this.items, item]
    },

    async remove(id: number) {
      const prev = this.items
      this.items = prev.filter((i) => i.id !== id)
      try {
        await badge_awardsService.remove(id)
      } catch (err: any) {
        this.items = prev
        throw new Error(err.message || translate('badge_awards.deleteFailed'))
      }
    },
  },
})
