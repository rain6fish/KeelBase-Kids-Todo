// SPDX-License-Identifier: Apache-2.0

import { defineStore } from 'pinia'
import { daily_reviewsService } from '../services/daily_reviews-service'
import { translate } from '../i18n/translate'
import type { DailyReviewItem, CreateDailyReviewRequest } from '../types/daily_reviews'

/** 每日评价状态（Taro Vue3，pinia）：列表 + 增/删，乐观更新。 */
export const useDailyReviewsStore = defineStore('daily_reviews', {
  state: () => ({
    items: [] as DailyReviewItem[],
    isLoading: false,
    error: null as string | null,
  }),
  actions: {
    async load() {
      this.isLoading = true
      this.error = null
      try {
        this.items = await daily_reviewsService.getDailyReviews()
      } catch (err: any) {
        this.error = err.message || translate('daily_reviews.loadFailed')
      } finally {
        this.isLoading = false
      }
    },

    async add(dto: CreateDailyReviewRequest) {
      const item = await daily_reviewsService.create(dto)
      this.items = [...this.items, item]
    },

    async remove(id: number) {
      const prev = this.items
      this.items = prev.filter((i) => i.id !== id)
      try {
        await daily_reviewsService.remove(id)
      } catch (err: any) {
        this.items = prev
        throw new Error(err.message || translate('daily_reviews.deleteFailed'))
      }
    },
  },
})
