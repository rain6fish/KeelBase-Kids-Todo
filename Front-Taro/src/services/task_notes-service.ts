// SPDX-License-Identifier: Apache-2.0

import { api } from './api-client'
import type { TaskNoteItem, CreateTaskNoteRequest } from '../types/task_notes'

export const task_notesService = {
  getTaskNotes(): Promise<TaskNoteItem[]> {
    return api.get<TaskNoteItem[]>('/task_notes').then((res) => res.data || [])
  },

  create(dto: CreateTaskNoteRequest): Promise<TaskNoteItem> {
    return api.post<TaskNoteItem>('/task_notes', dto).then((res) => res.data!)
  },

  remove(id: number): Promise<void> {
    return api.delete(`/task_notes/${id}`).then(() => {})
  },
}
