// SPDX-License-Identifier: Apache-2.0

import { defineStore } from 'pinia'
import { familiesService } from '../services/families-service'
import { translate } from '../i18n/translate'
import type { FamilieItem, CreateFamilieRequest } from '../types/families'

/** 家庭状态（Taro Vue3，pinia）：列表 + 增/删，乐观更新。 */
export const useFamiliesStore = defineStore('families', {
  state: () => ({
    items: [] as FamilieItem[],
    isLoading: false,
    error: null as string | null,
  }),
  actions: {
    async load() {
      this.isLoading = true
      this.error = null
      try {
        this.items = await familiesService.getFamilies()
      } catch (err: any) {
        this.error = err.message || translate('families.loadFailed')
      } finally {
        this.isLoading = false
      }
    },

    async add(dto: CreateFamilieRequest) {
      const item = await familiesService.create(dto)
      this.items = [...this.items, item]
    },

    async remove(id: number) {
      const prev = this.items
      this.items = prev.filter((i) => i.id !== id)
      try {
        await familiesService.remove(id)
      } catch (err: any) {
        this.items = prev
        throw new Error(err.message || translate('families.deleteFailed'))
      }
    },
  },
})
