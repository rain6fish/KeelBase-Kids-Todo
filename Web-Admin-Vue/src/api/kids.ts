// SPDX-License-Identifier: Apache-2.0

import { api } from './client'

export interface KidsTask {
  id: number
  title: string
  description?: string | null
  priority: string
  status: string
  taskDate: string
  approvalStatus: string
  assigneeId?: number | null
  familyId?: number | null
  userId?: number | null
  createdAt?: string
  version: number
}

export interface KidsFamily {
  id: number
  name: string
  userId?: number
  inviteCode: string
  approvalMode?: boolean | null
  useTimeStart?: string | null
  useTimeEnd?: string | null
}

export interface KidsMember {
  id: number
  username: string
  nickname: string
  familyRole?: 'parent' | 'child'
  colorTag?: string
  isActive?: boolean
}

export interface KidsReward {
  id: number
  title: string
  description?: string | null
  pointsCost: number
  isActive?: boolean | null
  version: number
}

export interface KidsRedemption {
  id: number
  rewardIdId?: number | null
  rewardIdName?: string | null
  pointsSpent: number
  isCancelled?: boolean | null
  createdAt: string
}

export interface KidsReview {
  id: number
  reviewDate: string
  content: string
  rating?: number | null
  createdAt: string
}

export interface KidsStats {
  total: number
  done: number
  completionRate: number
  members: number
  points: number
}

export const kidsApi = {
  tasks: (date?: string) =>
    api.get('/tasks', date ? { date } : undefined) as Promise<KidsTask[]>,
  createTask: (payload: Record<string, unknown>) => api.post('/tasks', payload),
  updateTask: (id: number, payload: Record<string, unknown>) => api.patch(`/tasks/${id}`, payload),
  completeTask: (id: number) => api.patch(`/tasks/${id}/complete`, {}),
  approveTask: (id: number) => api.patch(`/tasks/${id}/approve`, {}),
  rejectTask: (id: number) => api.patch(`/tasks/${id}/reject`, {}),

  family: () => api.get('/auth/family') as Promise<{ family: KidsFamily | null; members: KidsMember[] }>,
  updateFamily: (payload: Record<string, unknown>) => api.patch('/auth/family/settings', payload),
  regenerateInvite: () => api.post('/auth/family/regenerate-invite', {}),
  createChild: (payload: Record<string, unknown>) => api.post('/auth/children', payload),
  updateChild: (id: number, payload: Record<string, unknown>) =>
    api.patch(`/auth/children/${id}`, payload),

  rewards: () => api.get('/rewards') as Promise<KidsReward[]>,
  createReward: (payload: Record<string, unknown>) => api.post('/rewards', payload),
  redeemReward: (id: number) => api.post(`/rewards/${id}/redeem`, {}),
  redemptions: () => api.get('/rewards/redemptions') as Promise<KidsRedemption[]>,
  cancelRedemption: (id: number) => api.patch(`/rewards/redemptions/${id}/cancel`, {}),

  reviews: () => api.get('/daily_reviews') as Promise<KidsReview[]>,
  createReview: (payload: Record<string, unknown>) => api.post('/daily_reviews', payload),

  stats: (date?: string) =>
    api.get('/stats/overview', date ? { date } : undefined) as Promise<KidsStats>,
  streak: () => api.get('/stats/streak') as Promise<Record<string, unknown>>,
}
