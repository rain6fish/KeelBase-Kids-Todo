// SPDX-License-Identifier: Apache-2.0

import { api } from './client';

export interface AdminFamilie {
  id: number;
  userId: number | null;
  name: string;
  inviteCode: string;
  approvalMode: boolean;
  useTimeStart: string;
  useTimeEnd: string;
  createdAt: string;
}

export const familiesApi = {
  async list(): Promise<AdminFamilie[]> {
    const res = await api.get(`/families/admin/all`);
    return res as AdminFamilie[];
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/families/admin/${id}`);
  },
};
