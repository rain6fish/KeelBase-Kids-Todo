// SPDX-License-Identifier: Apache-2.0

import { api } from './client';

export interface AdminRewardRedemption {
  id: number;
  userId: number | null;
  rewardIdId: number;
  rewardId?: Record<string, unknown> | null;
  pointsSpent: number;
  isCancelled: boolean;
  note: string;
  createdAt: string;
}

export const reward_redemptionsApi = {
  async list(): Promise<AdminRewardRedemption[]> {
    const res = await api.get(`/reward_redemptions/admin/all`);
    return res as AdminRewardRedemption[];
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/reward_redemptions/admin/${id}`);
  },
};
