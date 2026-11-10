// SPDX-License-Identifier: Apache-2.0

export interface AchievementItem {
  id: number
  totalPoints?: number
  currentStreak?: number
  longestStreak?: number
  lastActiveDate?: string
  createdAt: string
}

export interface CreateAchievementRequest {
  totalPoints?: number;
  currentStreak?: number;
  longestStreak?: number;
  lastActiveDate?: string;
}
