// SPDX-License-Identifier: Apache-2.0

import { api } from './api-client'
import type { BadgeItem, CreateBadgeRequest } from '../types/badges'

export const badgesService = {
  getBadges(): Promise<BadgeItem[]> {
    return api.get<BadgeItem[]>('/badges').then((res) => res.data || [])
  },

  create(dto: CreateBadgeRequest): Promise<BadgeItem> {
    return api.post<BadgeItem>('/badges', dto).then((res) => res.data!)
  },

  remove(id: number): Promise<void> {
    return api.delete(`/badges/${id}`).then(() => {})
  },
}
