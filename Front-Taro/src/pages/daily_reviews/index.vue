<!-- SPDX-License-Identifier: Apache-2.0 -->
<template>
  <view class="daily_reviews-page">
    <view class="daily_reviews-page__header">
      <text class="daily_reviews-page__title">{{ t('daily_reviews.title') }}</text>
      <text class="daily_reviews-page__count">{{ t('daily_reviews.count', { total: items.length }) }}</text>
    </view>

    <view class="daily_reviews-page__input-bar">
      <input
        class="daily_reviews-page__input"
        v-model="reviewDate"
        :placeholder="t('daily_reviews.placeholder')"
        confirm-type="done"
        @confirm="handleAdd"
      />
      <button class="daily_reviews-page__add" size="mini" @click="handleAdd">{{ t('daily_reviews.add') }}</button>
    </view>

    <text v-if="store.isLoading" class="daily_reviews-page__hint">{{ t('common.loading') }}</text>
    <text v-if="store.error" class="daily_reviews-page__error">{{ store.error }}</text>

    <view v-if="items.length === 0 && !store.isLoading" class="daily_reviews-page__empty">
      <text>{{ t('daily_reviews.empty') }}</text>
    </view>
    <view v-for="item in items" :key="item.id" class="daily_reviews-page__item">
      <text class="daily_reviews-page__text">{{ item.reviewDate }}</text>
      <text class="daily_reviews-page__delete" @click="handleRemove(item)">✕</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import './index.scss'
import { onMounted, ref } from 'vue'
import Taro from '@tarojs/taro'
import { storeToRefs } from 'pinia'
import { useDailyReviewsStore } from '../../stores/daily_reviews-store'
import { useI18n } from '../../composables/useI18n'

const store = useDailyReviewsStore()
const { t } = useI18n()
const { items } = storeToRefs(store)
const reviewDate = ref('')

onMounted(() => {
  store.load()
})

async function handleAdd() {
  const text = reviewDate.value.trim()
  if (!text) {
    Taro.showToast({ title: t('daily_reviews.inputRequired'), icon: 'none' })
    return
  }
  try {
    await store.add({ reviewDate: text } as any)
    reviewDate.value = ''
  } catch (err: any) {
    Taro.showToast({ title: err.message || t('daily_reviews.createFailed'), icon: 'none' })
  }
}


function handleRemove(item: any) {
  Taro.showModal({
    title: t('daily_reviews.deleteTitle'),
    content: t('common.deleteConfirm', { name: `${item.reviewDate}` }),
    success: async (res) => {
      if (!res.confirm) return
      try {
        await store.remove(item.id)
      } catch (err: any) {
        Taro.showToast({ title: err.message || t('daily_reviews.deleteFailed'), icon: 'none' })
      }
    },
  })
}
</script>
