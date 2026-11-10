// SPDX-License-Identifier: Apache-2.0

import { api } from './client';

export interface AdminBadgeAward {
  id: number;
  userId: number | null;
  badgeIdId: number;
  badgeId?: Record<string, unknown> | null;
  earnedOn: string;
  createdAt: string;
}

export const badge_awardsApi = {
  async list(): Promise<AdminBadgeAward[]> {
    const res = await api.get(`/badge_awards/admin/all`);
    return res as AdminBadgeAward[];
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/badge_awards/admin/${id}`);
  },
};
