// SPDX-License-Identifier: Apache-2.0

import { defineStore } from 'pinia'
import { task_notesService } from '../services/task_notes-service'
import { translate } from '../i18n/translate'
import type { TaskNoteItem, CreateTaskNoteRequest } from '../types/task_notes'

/** 任务备注状态（Taro Vue3，pinia）：列表 + 增/删，乐观更新。 */
export const useTaskNotesStore = defineStore('task_notes', {
  state: () => ({
    items: [] as TaskNoteItem[],
    isLoading: false,
    error: null as string | null,
  }),
  actions: {
    async load() {
      this.isLoading = true
      this.error = null
      try {
        this.items = await task_notesService.getTaskNotes()
      } catch (err: any) {
        this.error = err.message || translate('task_notes.loadFailed')
      } finally {
        this.isLoading = false
      }
    },

    async add(dto: CreateTaskNoteRequest) {
      const item = await task_notesService.create(dto)
      this.items = [...this.items, item]
    },

    async remove(id: number) {
      const prev = this.items
      this.items = prev.filter((i) => i.id !== id)
      try {
        await task_notesService.remove(id)
      } catch (err: any) {
        this.items = prev
        throw new Error(err.message || translate('task_notes.deleteFailed'))
      }
    },
  },
})
