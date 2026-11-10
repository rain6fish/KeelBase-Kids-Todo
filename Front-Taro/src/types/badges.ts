// SPDX-License-Identifier: Apache-2.0

export interface BadgeItem {
  id: number
  name: string
  description: string
  badgeType: string
  threshold?: number
  iconUrl: string
  createdAt: string
}

export interface CreateBadgeRequest {
  name: string;
  description: string;
  badgeType: string;
  threshold?: number;
  iconUrl: string;
}
