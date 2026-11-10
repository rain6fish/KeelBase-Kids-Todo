// SPDX-License-Identifier: Apache-2.0

import { api } from './api-client'
import type { FamilieItem, CreateFamilieRequest } from '../types/families'

export const familiesService = {
  getFamilies(): Promise<FamilieItem[]> {
    return api.get<FamilieItem[]>('/families').then((res) => res.data || [])
  },

  create(dto: CreateFamilieRequest): Promise<FamilieItem> {
    return api.post<FamilieItem>('/families', dto).then((res) => res.data!)
  },

  remove(id: number): Promise<void> {
    return api.delete(`/families/${id}`).then(() => {})
  },
}
