<!-- SPDX-License-Identifier: Apache-2.0 -->
<template>
  <view class="reward_redemptions-page">
    <view class="reward_redemptions-page__header">
      <text class="reward_redemptions-page__title">{{ t('reward_redemptions.title') }}</text>
      <text class="reward_redemptions-page__count">{{ t('reward_redemptions.count', { total: items.length }) }}</text>
    </view>

    <view class="reward_redemptions-page__input-bar">
      <input
        class="reward_redemptions-page__input"
        v-model="rewardId"
        :placeholder="t('reward_redemptions.placeholder')"
        confirm-type="done"
        @confirm="handleAdd"
      />
      <button class="reward_redemptions-page__add" size="mini" @click="handleAdd">{{ t('reward_redemptions.add') }}</button>
    </view>

    <text v-if="store.isLoading" class="reward_redemptions-page__hint">{{ t('common.loading') }}</text>
    <text v-if="store.error" class="reward_redemptions-page__error">{{ store.error }}</text>

    <view v-if="items.length === 0 && !store.isLoading" class="reward_redemptions-page__empty">
      <text>{{ t('reward_redemptions.empty') }}</text>
    </view>
    <view v-for="item in items" :key="item.id" class="reward_redemptions-page__item">
      <text class="reward_redemptions-page__text">{{ item.rewardIdName ?? item.rewardIdId }}</text>
      <text class="reward_redemptions-page__delete" @click="handleRemove(item)">✕</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import './index.scss'
import { onMounted, ref } from 'vue'
import Taro from '@tarojs/taro'
import { storeToRefs } from 'pinia'
import { useRewardRedemptionsStore } from '../../stores/reward_redemptions-store'
import { useI18n } from '../../composables/useI18n'

const store = useRewardRedemptionsStore()
const { t } = useI18n()
const { items } = storeToRefs(store)
const rewardId = ref('')

onMounted(() => {
  store.load()
})

async function handleAdd() {
  const text = rewardId.value.trim()
  if (!text) {
    Taro.showToast({ title: t('reward_redemptions.inputRequired'), icon: 'none' })
    return
  }
  try {
    await store.add({ rewardId: text } as any)
    rewardId.value = ''
  } catch (err: any) {
    Taro.showToast({ title: err.message || t('reward_redemptions.createFailed'), icon: 'none' })
  }
}


function handleRemove(item: any) {
  Taro.showModal({
    title: t('reward_redemptions.deleteTitle'),
    content: t('common.deleteConfirm', { name: `${item.rewardId}` }),
    success: async (res) => {
      if (!res.confirm) return
      try {
        await store.remove(item.id)
      } catch (err: any) {
        Taro.showToast({ title: err.message || t('reward_redemptions.deleteFailed'), icon: 'none' })
      }
    },
  })
}
</script>
