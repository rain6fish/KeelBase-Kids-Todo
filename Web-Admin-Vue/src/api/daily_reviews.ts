// SPDX-License-Identifier: Apache-2.0

import { api } from './client';

export interface AdminDailyReview {
  id: number;
  userId: number | null;
  reviewDate: string;
  content: string;
  rating: number;
  createdAt: string;
}

export const daily_reviewsApi = {
  async list(): Promise<AdminDailyReview[]> {
    const res = await api.get(`/daily_reviews/admin/all`);
    return res as AdminDailyReview[];
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/daily_reviews/admin/${id}`);
  },
};
