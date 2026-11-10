<!-- SPDX-License-Identifier: Apache-2.0 -->
<template>
  <view class="families-page">
    <view class="families-page__header">
      <text class="families-page__title">{{ t('families.title') }}</text>
      <text class="families-page__count">{{ t('families.count', { total: items.length }) }}</text>
    </view>

    <view class="families-page__input-bar">
      <input
        class="families-page__input"
        v-model="name"
        :placeholder="t('families.placeholder')"
        confirm-type="done"
        @confirm="handleAdd"
      />
      <button class="families-page__add" size="mini" @click="handleAdd">{{ t('families.add') }}</button>
    </view>

    <text v-if="store.isLoading" class="families-page__hint">{{ t('common.loading') }}</text>
    <text v-if="store.error" class="families-page__error">{{ store.error }}</text>

    <view v-if="items.length === 0 && !store.isLoading" class="families-page__empty">
      <text>{{ t('families.empty') }}</text>
    </view>
    <view v-for="item in items" :key="item.id" class="families-page__item">
      <text class="families-page__text">{{ item.name }}</text>
      <text class="families-page__delete" @click="handleRemove(item)">✕</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import './index.scss'
import { onMounted, ref } from 'vue'
import Taro from '@tarojs/taro'
import { storeToRefs } from 'pinia'
import { useFamiliesStore } from '../../stores/families-store'
import { useI18n } from '../../composables/useI18n'

const store = useFamiliesStore()
const { t } = useI18n()
const { items } = storeToRefs(store)
const name = ref('')

onMounted(() => {
  store.load()
})

async function handleAdd() {
  const text = name.value.trim()
  if (!text) {
    Taro.showToast({ title: t('families.inputRequired'), icon: 'none' })
    return
  }
  try {
    await store.add({ name: text } as any)
    name.value = ''
  } catch (err: any) {
    Taro.showToast({ title: err.message || t('families.createFailed'), icon: 'none' })
  }
}


function handleRemove(item: any) {
  Taro.showModal({
    title: t('families.deleteTitle'),
    content: t('common.deleteConfirm', { name: `${item.name}` }),
    success: async (res) => {
      if (!res.confirm) return
      try {
        await store.remove(item.id)
      } catch (err: any) {
        Taro.showToast({ title: err.message || t('families.deleteFailed'), icon: 'none' })
      }
    },
  })
}
</script>
