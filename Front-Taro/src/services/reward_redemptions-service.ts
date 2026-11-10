// SPDX-License-Identifier: Apache-2.0

import { api } from './api-client'
import type { RewardRedemptionItem, CreateRewardRedemptionRequest } from '../types/reward_redemptions'

export const reward_redemptionsService = {
  getRewardRedemptions(): Promise<RewardRedemptionItem[]> {
    return api.get<RewardRedemptionItem[]>('/reward_redemptions').then((res) => res.data || [])
  },

  create(dto: CreateRewardRedemptionRequest): Promise<RewardRedemptionItem> {
    return api.post<RewardRedemptionItem>('/reward_redemptions', dto).then((res) => res.data!)
  },

  remove(id: number): Promise<void> {
    return api.delete(`/reward_redemptions/${id}`).then(() => {})
  },
}
