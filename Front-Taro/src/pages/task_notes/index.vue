<!-- SPDX-License-Identifier: Apache-2.0 -->
<template>
  <view class="task_notes-page">
    <view class="task_notes-page__header">
      <text class="task_notes-page__title">{{ t('task_notes.title') }}</text>
      <text class="task_notes-page__count">{{ t('task_notes.count', { total: items.length }) }}</text>
    </view>

    <view class="task_notes-page__input-bar">
      <input
        class="task_notes-page__input"
        v-model="taskId"
        :placeholder="t('task_notes.placeholder')"
        confirm-type="done"
        @confirm="handleAdd"
      />
      <button class="task_notes-page__add" size="mini" @click="handleAdd">{{ t('task_notes.add') }}</button>
    </view>

    <text v-if="store.isLoading" class="task_notes-page__hint">{{ t('common.loading') }}</text>
    <text v-if="store.error" class="task_notes-page__error">{{ store.error }}</text>

    <view v-if="items.length === 0 && !store.isLoading" class="task_notes-page__empty">
      <text>{{ t('task_notes.empty') }}</text>
    </view>
    <view v-for="item in items" :key="item.id" class="task_notes-page__item">
      <text class="task_notes-page__text">{{ item.taskIdName ?? item.taskIdId }}</text>
      <text class="task_notes-page__delete" @click="handleRemove(item)">✕</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import './index.scss'
import { onMounted, ref } from 'vue'
import Taro from '@tarojs/taro'
import { storeToRefs } from 'pinia'
import { useTaskNotesStore } from '../../stores/task_notes-store'
import { useI18n } from '../../composables/useI18n'

const store = useTaskNotesStore()
const { t } = useI18n()
const { items } = storeToRefs(store)
const taskId = ref('')

onMounted(() => {
  store.load()
})

async function handleAdd() {
  const text = taskId.value.trim()
  if (!text) {
    Taro.showToast({ title: t('task_notes.inputRequired'), icon: 'none' })
    return
  }
  try {
    await store.add({ taskId: text } as any)
    taskId.value = ''
  } catch (err: any) {
    Taro.showToast({ title: err.message || t('task_notes.createFailed'), icon: 'none' })
  }
}


function handleRemove(item: any) {
  Taro.showModal({
    title: t('task_notes.deleteTitle'),
    content: t('common.deleteConfirm', { name: `${item.taskId}` }),
    success: async (res) => {
      if (!res.confirm) return
      try {
        await store.remove(item.id)
      } catch (err: any) {
        Taro.showToast({ title: err.message || t('task_notes.deleteFailed'), icon: 'none' })
      }
    },
  })
}
</script>
