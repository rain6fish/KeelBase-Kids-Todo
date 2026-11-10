<!-- SPDX-License-Identifier: Apache-2.0 -->
<template>
  <view class="badge_awards-page">
    <view class="badge_awards-page__header">
      <text class="badge_awards-page__title">{{ t('badge_awards.title') }}</text>
      <text class="badge_awards-page__count">{{ t('badge_awards.count', { total: items.length }) }}</text>
    </view>

    <view class="badge_awards-page__input-bar">
      <input
        class="badge_awards-page__input"
        v-model="badgeId"
        :placeholder="t('badge_awards.placeholder')"
        confirm-type="done"
        @confirm="handleAdd"
      />
      <button class="badge_awards-page__add" size="mini" @click="handleAdd">{{ t('badge_awards.add') }}</button>
    </view>

    <text v-if="store.isLoading" class="badge_awards-page__hint">{{ t('common.loading') }}</text>
    <text v-if="store.error" class="badge_awards-page__error">{{ store.error }}</text>

    <view v-if="items.length === 0 && !store.isLoading" class="badge_awards-page__empty">
      <text>{{ t('badge_awards.empty') }}</text>
    </view>
    <view v-for="item in items" :key="item.id" class="badge_awards-page__item">
      <text class="badge_awards-page__text">{{ item.badgeIdName ?? item.badgeIdId }}</text>
      <text class="badge_awards-page__delete" @click="handleRemove(item)">✕</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import './index.scss'
import { onMounted, ref } from 'vue'
import Taro from '@tarojs/taro'
import { storeToRefs } from 'pinia'
import { useBadgeAwardsStore } from '../../stores/badge_awards-store'
import { useI18n } from '../../composables/useI18n'

const store = useBadgeAwardsStore()
const { t } = useI18n()
const { items } = storeToRefs(store)
const badgeId = ref('')

onMounted(() => {
  store.load()
})

async function handleAdd() {
  const text = badgeId.value.trim()
  if (!text) {
    Taro.showToast({ title: t('badge_awards.inputRequired'), icon: 'none' })
    return
  }
  try {
    await store.add({ badgeId: text } as any)
    badgeId.value = ''
  } catch (err: any) {
    Taro.showToast({ title: err.message || t('badge_awards.createFailed'), icon: 'none' })
  }
}


function handleRemove(item: any) {
  Taro.showModal({
    title: t('badge_awards.deleteTitle'),
    content: t('common.deleteConfirm', { name: `${item.badgeId}` }),
    success: async (res) => {
      if (!res.confirm) return
      try {
        await store.remove(item.id)
      } catch (err: any) {
        Taro.showToast({ title: err.message || t('badge_awards.deleteFailed'), icon: 'none' })
      }
    },
  })
}
</script>
