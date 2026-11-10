// SPDX-License-Identifier: Apache-2.0

import { api } from './client';

export interface AdminTask {
  id: number;
  userId: number | null;
  title: string;
  description: string;
  priority: string;
  status: string;
  taskDate: string;
  estimatedMinutes: number;
  repeatRule: string;
  approvalStatus: string;
  helpRequested: boolean;
  helpRequestNote: string;
  sortOrder: number;
  createdAt: string;
}

export const tasksApi = {
  async list(): Promise<AdminTask[]> {
    const res = await api.get(`/tasks/admin/all`);
    return res as AdminTask[];
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/tasks/admin/${id}`);
  },
};
