// SPDX-License-Identifier: Apache-2.0

export interface RewardRedemptionItem {
  id: number
  rewardId: number
  pointsSpent?: number
  isCancelled: boolean
  note: string
  createdAt: string
}

export interface CreateRewardRedemptionRequest {
  rewardId: number;
  pointsSpent?: number;
  isCancelled: boolean;
  note: string;
}
