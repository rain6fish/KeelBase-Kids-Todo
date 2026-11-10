// SPDX-License-Identifier: Apache-2.0

import { api } from './client';

export interface AdminCheckin {
  id: number;
  userId: number | null;
  checkDate: string;
  totalTasks: number;
  doneTasks: number;
  isPerfect: boolean;
  pointsEarned: number;
  createdAt: string;
}

export const checkinsApi = {
  async list(): Promise<AdminCheckin[]> {
    const res = await api.get(`/checkins/admin/all`);
    return res as AdminCheckin[];
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/checkins/admin/${id}`);
  },
};
