// SPDX-License-Identifier: Apache-2.0

import { defineStore } from 'pinia'
import { checkinsService } from '../services/checkins-service'
import { translate } from '../i18n/translate'
import type { CheckinItem, CreateCheckinRequest } from '../types/checkins'

/** 打卡状态（Taro Vue3，pinia）：列表 + 增/删，乐观更新。 */
export const useCheckinsStore = defineStore('checkins', {
  state: () => ({
    items: [] as CheckinItem[],
    isLoading: false,
    error: null as string | null,
  }),
  actions: {
    async load() {
      this.isLoading = true
      this.error = null
      try {
        this.items = await checkinsService.getCheckins()
      } catch (err: any) {
        this.error = err.message || translate('checkins.loadFailed')
      } finally {
        this.isLoading = false
      }
    },

    async add(dto: CreateCheckinRequest) {
      const item = await checkinsService.create(dto)
      this.items = [...this.items, item]
    },

    async remove(id: number) {
      const prev = this.items
      this.items = prev.filter((i) => i.id !== id)
      try {
        await checkinsService.remove(id)
      } catch (err: any) {
        this.items = prev
        throw new Error(err.message || translate('checkins.deleteFailed'))
      }
    },
  },
})
