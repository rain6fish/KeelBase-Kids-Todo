// SPDX-License-Identifier: Apache-2.0

import { defineStore } from 'pinia'
import { achievementsService } from '../services/achievements-service'
import { translate } from '../i18n/translate'
import type { AchievementItem, CreateAchievementRequest } from '../types/achievements'

/** 成就状态（Taro Vue3，pinia）：列表 + 增/删，乐观更新。 */
export const useAchievementsStore = defineStore('achievements', {
  state: () => ({
    items: [] as AchievementItem[],
    isLoading: false,
    error: null as string | null,
  }),
  actions: {
    async load() {
      this.isLoading = true
      this.error = null
      try {
        this.items = await achievementsService.getAchievements()
      } catch (err: any) {
        this.error = err.message || translate('achievements.loadFailed')
      } finally {
        this.isLoading = false
      }
    },

    async add(dto: CreateAchievementRequest) {
      const item = await achievementsService.create(dto)
      this.items = [...this.items, item]
    },

    async remove(id: number) {
      const prev = this.items
      this.items = prev.filter((i) => i.id !== id)
      try {
        await achievementsService.remove(id)
      } catch (err: any) {
        this.items = prev
        throw new Error(err.message || translate('achievements.deleteFailed'))
      }
    },
  },
})
