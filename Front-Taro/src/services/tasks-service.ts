// SPDX-License-Identifier: Apache-2.0

import { api } from './api-client'
import type { TaskItem, CreateTaskRequest } from '../types/tasks'

export const tasksService = {
  getTasks(): Promise<TaskItem[]> {
    return api.get<TaskItem[]>('/tasks').then((res) => res.data || [])
  },

  create(dto: CreateTaskRequest): Promise<TaskItem> {
    return api.post<TaskItem>('/tasks', dto).then((res) => res.data!)
  },

  remove(id: number): Promise<void> {
    return api.delete(`/tasks/${id}`).then(() => {})
  },
}
