<!-- SPDX-License-Identifier: Apache-2.0 -->
<template>
  <view class="rewards-page">
    <view class="rewards-page__header">
      <text class="rewards-page__title">{{ t('rewards.title') }}</text>
      <text class="rewards-page__count">{{ t('rewards.count', { total: items.length }) }}</text>
    </view>

    <view class="rewards-page__input-bar">
      <input
        class="rewards-page__input"
        v-model="title"
        :placeholder="t('rewards.placeholder')"
        confirm-type="done"
        @confirm="handleAdd"
      />
      <button class="rewards-page__add" size="mini" @click="handleAdd">{{ t('rewards.add') }}</button>
    </view>

    <text v-if="store.isLoading" class="rewards-page__hint">{{ t('common.loading') }}</text>
    <text v-if="store.error" class="rewards-page__error">{{ store.error }}</text>

    <view v-if="items.length === 0 && !store.isLoading" class="rewards-page__empty">
      <text>{{ t('rewards.empty') }}</text>
    </view>
    <view v-for="item in items" :key="item.id" class="rewards-page__item">
      <text class="rewards-page__text">{{ item.title }}</text>
      <text class="rewards-page__delete" @click="handleRemove(item)">✕</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import './index.scss'
import { onMounted, ref } from 'vue'
import Taro from '@tarojs/taro'
import { storeToRefs } from 'pinia'
import { useRewardsStore } from '../../stores/rewards-store'
import { useI18n } from '../../composables/useI18n'

const store = useRewardsStore()
const { t } = useI18n()
const { items } = storeToRefs(store)
const title = ref('')

onMounted(() => {
  store.load()
})

async function handleAdd() {
  const text = title.value.trim()
  if (!text) {
    Taro.showToast({ title: t('rewards.inputRequired'), icon: 'none' })
    return
  }
  try {
    await store.add({ title: text } as any)
    title.value = ''
  } catch (err: any) {
    Taro.showToast({ title: err.message || t('rewards.createFailed'), icon: 'none' })
  }
}


function handleRemove(item: any) {
  Taro.showModal({
    title: t('rewards.deleteTitle'),
    content: t('common.deleteConfirm', { name: `${item.title}` }),
    success: async (res) => {
      if (!res.confirm) return
      try {
        await store.remove(item.id)
      } catch (err: any) {
        Taro.showToast({ title: err.message || t('rewards.deleteFailed'), icon: 'none' })
      }
    },
  })
}
</script>
