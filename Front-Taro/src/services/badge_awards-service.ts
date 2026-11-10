// SPDX-License-Identifier: Apache-2.0

import { api } from './api-client'
import type { BadgeAwardItem, CreateBadgeAwardRequest } from '../types/badge_awards'

export const badge_awardsService = {
  getBadgeAwards(): Promise<BadgeAwardItem[]> {
    return api.get<BadgeAwardItem[]>('/badge_awards').then((res) => res.data || [])
  },

  create(dto: CreateBadgeAwardRequest): Promise<BadgeAwardItem> {
    return api.post<BadgeAwardItem>('/badge_awards', dto).then((res) => res.data!)
  },

  remove(id: number): Promise<void> {
    return api.delete(`/badge_awards/${id}`).then(() => {})
  },
}
