// SPDX-License-Identifier: Apache-2.0

import { api } from './api-client'
import type { AchievementItem, CreateAchievementRequest } from '../types/achievements'

export const achievementsService = {
  getAchievements(): Promise<AchievementItem[]> {
    return api.get<AchievementItem[]>('/achievements').then((res) => res.data || [])
  },

  create(dto: CreateAchievementRequest): Promise<AchievementItem> {
    return api.post<AchievementItem>('/achievements', dto).then((res) => res.data!)
  },

  remove(id: number): Promise<void> {
    return api.delete(`/achievements/${id}`).then(() => {})
  },
}
