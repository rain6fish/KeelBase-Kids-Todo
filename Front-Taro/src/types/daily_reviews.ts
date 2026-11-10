// SPDX-License-Identifier: Apache-2.0

export interface DailyReviewItem {
  id: number
  reviewDate?: string
  content: string
  rating?: number
  createdAt: string
}

export interface CreateDailyReviewRequest {
  reviewDate?: string;
  content: string;
  rating?: number;
}
