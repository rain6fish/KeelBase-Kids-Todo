// SPDX-License-Identifier: Apache-2.0

import { api } from './client';

export interface AdminReward {
  id: number;
  userId: number | null;
  title: string;
  description: string;
  pointsCost: number;
  isActive: boolean;
  createdAt: string;
}

export const rewardsApi = {
  async list(): Promise<AdminReward[]> {
    const res = await api.get(`/rewards/admin/all`);
    return res as AdminReward[];
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/rewards/admin/${id}`);
  },
};
