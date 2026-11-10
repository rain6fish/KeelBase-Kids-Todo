// SPDX-License-Identifier: Apache-2.0

import { defineStore } from 'pinia'
import { tasksService } from '../services/tasks-service'
import { translate } from '../i18n/translate'
import type { TaskItem, CreateTaskRequest } from '../types/tasks'

/** 任务状态（Taro Vue3，pinia）：列表 + 增/删，乐观更新。 */
export const useTasksStore = defineStore('tasks', {
  state: () => ({
    items: [] as TaskItem[],
    isLoading: false,
    error: null as string | null,
  }),
  actions: {
    async load() {
      this.isLoading = true
      this.error = null
      try {
        this.items = await tasksService.getTasks()
      } catch (err: any) {
        this.error = err.message || translate('tasks.loadFailed')
      } finally {
        this.isLoading = false
      }
    },

    async add(dto: CreateTaskRequest) {
      const item = await tasksService.create(dto)
      this.items = [...this.items, item]
    },

    async remove(id: number) {
      const prev = this.items
      this.items = prev.filter((i) => i.id !== id)
      try {
        await tasksService.remove(id)
      } catch (err: any) {
        this.items = prev
        throw new Error(err.message || translate('tasks.deleteFailed'))
      }
    },
  },
})
