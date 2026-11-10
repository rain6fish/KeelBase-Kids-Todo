// SPDX-License-Identifier: Apache-2.0

export interface BadgeAwardItem {
  id: number
  badgeId: number
  earnedOn?: string
  createdAt: string
}

export interface CreateBadgeAwardRequest {
  badgeId: number;
  earnedOn?: string;
}
