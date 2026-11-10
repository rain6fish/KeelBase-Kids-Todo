// SPDX-License-Identifier: Apache-2.0

export interface RewardItem {
  id: number
  title: string
  description: string
  pointsCost?: number
  isActive: boolean
  createdAt: string
}

export interface CreateRewardRequest {
  title: string;
  description: string;
  pointsCost?: number;
  isActive: boolean;
}
