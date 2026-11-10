// SPDX-License-Identifier: Apache-2.0

import { api } from './client';

export interface AdminBadge {
  id: number;
  userId: number | null;
  name: string;
  description: string;
  badgeType: string;
  threshold: number;
  iconUrl: string;
  createdAt: string;
}

export const badgesApi = {
  async list(): Promise<AdminBadge[]> {
    const res = await api.get(`/badges/admin/all`);
    return res as AdminBadge[];
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/badges/admin/${id}`);
  },
};
