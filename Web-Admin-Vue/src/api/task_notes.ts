// SPDX-License-Identifier: Apache-2.0

import { api } from './client';

export interface AdminTaskNote {
  id: number;
  userId: number | null;
  taskIdId: number;
  taskId?: Record<string, unknown> | null;
  content: string;
  contentType: string;
  mediaUrl: string;
  createdAt: string;
}

export const task_notesApi = {
  async list(): Promise<AdminTaskNote[]> {
    const res = await api.get(`/task_notes/admin/all`);
    return res as AdminTaskNote[];
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/task_notes/admin/${id}`);
  },
};
