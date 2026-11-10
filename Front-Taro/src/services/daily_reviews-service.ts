// SPDX-License-Identifier: Apache-2.0

import { api } from './api-client'
import type { DailyReviewItem, CreateDailyReviewRequest } from '../types/daily_reviews'

export const daily_reviewsService = {
  getDailyReviews(): Promise<DailyReviewItem[]> {
    return api.get<DailyReviewItem[]>('/daily_reviews').then((res) => res.data || [])
  },

  create(dto: CreateDailyReviewRequest): Promise<DailyReviewItem> {
    return api.post<DailyReviewItem>('/daily_reviews', dto).then((res) => res.data!)
  },

  remove(id: number): Promise<void> {
    return api.delete(`/daily_reviews/${id}`).then(() => {})
  },
}
