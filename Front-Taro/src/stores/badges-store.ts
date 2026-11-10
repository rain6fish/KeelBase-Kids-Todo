// SPDX-License-Identifier: Apache-2.0

import { defineStore } from 'pinia'
import { badgesService } from '../services/badges-service'
import { translate } from '../i18n/translate'
import type { BadgeItem, CreateBadgeRequest } from '../types/badges'

/** 徽章状态（Taro Vue3，pinia）：列表 + 增/删，乐观更新。 */
export const useBadgesStore = defineStore('badges', {
  state: () => ({
    items: [] as BadgeItem[],
    isLoading: false,
    error: null as string | null,
  }),
  actions: {
    async load() {
      this.isLoading = true
      this.error = null
      try {
        this.items = await badgesService.getBadges()
      } catch (err: any) {
        this.error = err.message || translate('badges.loadFailed')
      } finally {
        this.isLoading = false
      }
    },

    async add(dto: CreateBadgeRequest) {
      const item = await badgesService.create(dto)
      this.items = [...this.items, item]
    },

    async remove(id: number) {
      const prev = this.items
      this.items = prev.filter((i) => i.id !== id)
      try {
        await badgesService.remove(id)
      } catch (err: any) {
        this.items = prev
        throw new Error(err.message || translate('badges.deleteFailed'))
      }
    },
  },
})
