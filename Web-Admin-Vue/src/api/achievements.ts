// SPDX-License-Identifier: Apache-2.0

import { api } from './client';

export interface AdminAchievement {
  id: number;
  userId: number | null;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  createdAt: string;
}

export const achievementsApi = {
  async list(): Promise<AdminAchievement[]> {
    const res = await api.get(`/achievements/admin/all`);
    return res as AdminAchievement[];
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/achievements/admin/${id}`);
  },
};
