<!-- SPDX-License-Identifier: Apache-2.0 -->
<template>
  <view class="badges-page">
    <view class="badges-page__header">
      <text class="badges-page__title">{{ t('badges.title') }}</text>
      <text class="badges-page__count">{{ t('badges.count', { total: items.length }) }}</text>
    </view>

    <view class="badges-page__input-bar">
      <input
        class="badges-page__input"
        v-model="name"
        :placeholder="t('badges.placeholder')"
        confirm-type="done"
        @confirm="handleAdd"
      />
      <button class="badges-page__add" size="mini" @click="handleAdd">{{ t('badges.add') }}</button>
    </view>

    <text v-if="store.isLoading" class="badges-page__hint">{{ t('common.loading') }}</text>
    <text v-if="store.error" class="badges-page__error">{{ store.error }}</text>

    <view v-if="items.length === 0 && !store.isLoading" class="badges-page__empty">
      <text>{{ t('badges.empty') }}</text>
    </view>
    <view v-for="item in items" :key="item.id" class="badges-page__item">
      <text class="badges-page__text">{{ item.name }}</text>
      <text class="badges-page__delete" @click="handleRemove(item)">✕</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import './index.scss'
import { onMounted, ref } from 'vue'
import Taro from '@tarojs/taro'
import { storeToRefs } from 'pinia'
import { useBadgesStore } from '../../stores/badges-store'
import { useI18n } from '../../composables/useI18n'

const store = useBadgesStore()
const { t } = useI18n()
const { items } = storeToRefs(store)
const name = ref('')

onMounted(() => {
  store.load()
})

async function handleAdd() {
  const text = name.value.trim()
  if (!text) {
    Taro.showToast({ title: t('badges.inputRequired'), icon: 'none' })
    return
  }
  try {
    await store.add({ name: text } as any)
    name.value = ''
  } catch (err: any) {
    Taro.showToast({ title: err.message || t('badges.createFailed'), icon: 'none' })
  }
}


function handleRemove(item: any) {
  Taro.showModal({
    title: t('badges.deleteTitle'),
    content: t('common.deleteConfirm', { name: `${item.name}` }),
    success: async (res) => {
      if (!res.confirm) return
      try {
        await store.remove(item.id)
      } catch (err: any) {
        Taro.showToast({ title: err.message || t('badges.deleteFailed'), icon: 'none' })
      }
    },
  })
}
</script>
