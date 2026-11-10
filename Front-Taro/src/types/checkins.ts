// SPDX-License-Identifier: Apache-2.0

export interface CheckinItem {
  id: number
  checkDate?: string
  totalTasks?: number
  doneTasks?: number
  isPerfect: boolean
  pointsEarned?: number
  createdAt: string
}

export interface CreateCheckinRequest {
  checkDate?: string;
  totalTasks?: number;
  doneTasks?: number;
  isPerfect: boolean;
  pointsEarned?: number;
}
