// SPDX-License-Identifier: Apache-2.0

import { api } from './api-client'
import type { CheckinItem, CreateCheckinRequest } from '../types/checkins'

export const checkinsService = {
  getCheckins(): Promise<CheckinItem[]> {
    return api.get<CheckinItem[]>('/checkins').then((res) => res.data || [])
  },

  create(dto: CreateCheckinRequest): Promise<CheckinItem> {
    return api.post<CheckinItem>('/checkins', dto).then((res) => res.data!)
  },

  remove(id: number): Promise<void> {
    return api.delete(`/checkins/${id}`).then(() => {})
  },
}
