<!-- SPDX-License-Identifier: Apache-2.0 -->
<template>
  <view class="tasks-page">
    <view class="tasks-page__header">
      <text class="tasks-page__title">{{ t('tasks.title') }}</text>
      <text class="tasks-page__count">{{ t('tasks.count', { total: items.length }) }}</text>
    </view>

    <view class="tasks-page__input-bar">
      <input
        class="tasks-page__input"
        v-model="title"
        :placeholder="t('tasks.placeholder')"
        confirm-type="done"
        @confirm="handleAdd"
      />
      <button class="tasks-page__add" size="mini" @click="handleAdd">{{ t('tasks.add') }}</button>
    </view>

    <text v-if="store.isLoading" class="tasks-page__hint">{{ t('common.loading') }}</text>
    <text v-if="store.error" class="tasks-page__error">{{ store.error }}</text>

    <view v-if="items.length === 0 && !store.isLoading" class="tasks-page__empty">
      <text>{{ t('tasks.empty') }}</text>
    </view>
    <view v-for="item in items" :key="item.id" class="tasks-page__item">
      <text class="tasks-page__text">{{ item.title }}</text>
      <text class="tasks-page__delete" @click="handleRemove(item)">✕</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import './index.scss'
import { onMounted, ref } from 'vue'
import Taro from '@tarojs/taro'
import { storeToRefs } from 'pinia'
import { useTasksStore } from '../../stores/tasks-store'
import { useI18n } from '../../composables/useI18n'

const store = useTasksStore()
const { t } = useI18n()
const { items } = storeToRefs(store)
const title = ref('')

onMounted(() => {
  store.load()
})

async function handleAdd() {
  const text = title.value.trim()
  if (!text) {
    Taro.showToast({ title: t('tasks.inputRequired'), icon: 'none' })
    return
  }
  try {
    await store.add({ title: text } as any)
    title.value = ''
  } catch (err: any) {
    Taro.showToast({ title: err.message || t('tasks.createFailed'), icon: 'none' })
  }
}


function handleRemove(item: any) {
  Taro.showModal({
    title: t('tasks.deleteTitle'),
    content: t('common.deleteConfirm', { name: `${item.title}` }),
    success: async (res) => {
      if (!res.confirm) return
      try {
        await store.remove(item.id)
      } catch (err: any) {
        Taro.showToast({ title: err.message || t('tasks.deleteFailed'), icon: 'none' })
      }
    },
  })
}
</script>
