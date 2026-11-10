<!-- SPDX-License-Identifier: Apache-2.0 -->
<template>
  <view class="achievements-page">
    <view class="achievements-page__header">
      <text class="achievements-page__title">{{ t('achievements.title') }}</text>
      <text class="achievements-page__count">{{ t('achievements.count', { total: items.length }) }}</text>
    </view>

    <view class="achievements-page__input-bar">
      <input
        class="achievements-page__input"
        v-model="totalPoints"
        :placeholder="t('achievements.placeholder')"
        confirm-type="done"
        @confirm="handleAdd"
      />
      <button class="achievements-page__add" size="mini" @click="handleAdd">{{ t('achievements.add') }}</button>
    </view>

    <text v-if="store.isLoading" class="achievements-page__hint">{{ t('common.loading') }}</text>
    <text v-if="store.error" class="achievements-page__error">{{ store.error }}</text>

    <view v-if="items.length === 0 && !store.isLoading" class="achievements-page__empty">
      <text>{{ t('achievements.empty') }}</text>
    </view>
    <view v-for="item in items" :key="item.id" class="achievements-page__item">
      <text class="achievements-page__text">{{ item.totalPoints }}</text>
      <text class="achievements-page__delete" @click="handleRemove(item)">✕</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import './index.scss'
import { onMounted, ref } from 'vue'
import Taro from '@tarojs/taro'
import { storeToRefs } from 'pinia'
import { useAchievementsStore } from '../../stores/achievements-store'
import { useI18n } from '../../composables/useI18n'

const store = useAchievementsStore()
const { t } = useI18n()
const { items } = storeToRefs(store)
const totalPoints = ref('')

onMounted(() => {
  store.load()
})

async function handleAdd() {
  const text = totalPoints.value.trim()
  if (!text) {
    Taro.showToast({ title: t('achievements.inputRequired'), icon: 'none' })
    return
  }
  try {
    await store.add({ totalPoints: text } as any)
    totalPoints.value = ''
  } catch (err: any) {
    Taro.showToast({ title: err.message || t('achievements.createFailed'), icon: 'none' })
  }
}


function handleRemove(item: any) {
  Taro.showModal({
    title: t('achievements.deleteTitle'),
    content: t('common.deleteConfirm', { name: `${item.totalPoints}` }),
    success: async (res) => {
      if (!res.confirm) return
      try {
        await store.remove(item.id)
      } catch (err: any) {
        Taro.showToast({ title: err.message || t('achievements.deleteFailed'), icon: 'none' })
      }
    },
  })
}
</script>
