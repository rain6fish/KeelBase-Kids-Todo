// SPDX-License-Identifier: Apache-2.0

import { api } from './api-client'
import type { RewardItem, CreateRewardRequest } from '../types/rewards'

export const rewardsService = {
  getRewards(): Promise<RewardItem[]> {
    return api.get<RewardItem[]>('/rewards').then((res) => res.data || [])
  },

  create(dto: CreateRewardRequest): Promise<RewardItem> {
    return api.post<RewardItem>('/rewards', dto).then((res) => res.data!)
  },

  remove(id: number): Promise<void> {
    return api.delete(`/rewards/${id}`).then(() => {})
  },
}
