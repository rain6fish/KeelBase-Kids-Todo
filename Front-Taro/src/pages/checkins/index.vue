<!-- SPDX-License-Identifier: Apache-2.0 -->
<template>
  <view class="checkins-page">
    <view class="checkins-page__header">
      <text class="checkins-page__title">{{ t('checkins.title') }}</text>
      <text class="checkins-page__count">{{ t('checkins.count', { total: items.length }) }}</text>
    </view>

    <view class="checkins-page__input-bar">
      <input
        class="checkins-page__input"
        v-model="checkDate"
        :placeholder="t('checkins.placeholder')"
        confirm-type="done"
        @confirm="handleAdd"
      />
      <button class="checkins-page__add" size="mini" @click="handleAdd">{{ t('checkins.add') }}</button>
    </view>

    <text v-if="store.isLoading" class="checkins-page__hint">{{ t('common.loading') }}</text>
    <text v-if="store.error" class="checkins-page__error">{{ store.error }}</text>

    <view v-if="items.length === 0 && !store.isLoading" class="checkins-page__empty">
      <text>{{ t('checkins.empty') }}</text>
    </view>
    <view v-for="item in items" :key="item.id" class="checkins-page__item">
      <text class="checkins-page__text">{{ item.checkDate }}</text>
      <text class="checkins-page__delete" @click="handleRemove(item)">✕</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import './index.scss'
import { onMounted, ref } from 'vue'
import Taro from '@tarojs/taro'
import { storeToRefs } from 'pinia'
import { useCheckinsStore } from '../../stores/checkins-store'
import { useI18n } from '../../composables/useI18n'

const store = useCheckinsStore()
const { t } = useI18n()
const { items } = storeToRefs(store)
const checkDate = ref('')

onMounted(() => {
  store.load()
})

async function handleAdd() {
  const text = checkDate.value.trim()
  if (!text) {
    Taro.showToast({ title: t('checkins.inputRequired'), icon: 'none' })
    return
  }
  try {
    await store.add({ checkDate: text } as any)
    checkDate.value = ''
  } catch (err: any) {
    Taro.showToast({ title: err.message || t('checkins.createFailed'), icon: 'none' })
  }
}


function handleRemove(item: any) {
  Taro.showModal({
    title: t('checkins.deleteTitle'),
    content: t('common.deleteConfirm', { name: `${item.checkDate}` }),
    success: async (res) => {
      if (!res.confirm) return
      try {
        await store.remove(item.id)
      } catch (err: any) {
        Taro.showToast({ title: err.message || t('checkins.deleteFailed'), icon: 'none' })
      }
    },
  })
}
</script>
