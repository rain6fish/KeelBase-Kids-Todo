<!-- SPDX-License-Identifier: Apache-2.0 -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHeader from '@/components/PageHeader.vue'
import AppTable from '@/components/AppTable.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { useSnackbarStore } from '@/stores/snackbar'
import { reward_redemptionsApi, type AdminRewardRedemption } from '@/api/reward_redemptions'

const { t } = useI18n()
const snackbar = useSnackbarStore()

const items = ref<AdminRewardRedemption[]>([])
const loading = ref(false)
const showDelete = ref(false)
const pendingDelete = ref<AdminRewardRedemption | null>(null)

const headers = computed(() => [
  { key: 'id', title: 'ID' },
  { key: 'rewardId', title: 'rewardId' },
  { key: 'pointsSpent', title: 'pointsSpent' },
  { key: 'isCancelled', title: 'isCancelled' },
  { key: 'note', title: 'note' },
  { key: 'createdAt', title: t('createdAt') },
  { key: 'actions', title: t('actionCol') },
])

async function load() {
  loading.value = true
  try {
    items.value = await reward_redemptionsApi.list()
  } catch (err) {
    snackbar.error(err instanceof Error ? err.message : t('loadFailed'))
  } finally {
    loading.value = false
  }
}

function confirmDelete(item: AdminRewardRedemption) {
  pendingDelete.value = item
  showDelete.value = true
}

async function onDelete() {
  if (!pendingDelete.value) return
  try {
    await reward_redemptionsApi.remove(pendingDelete.value.id)
    snackbar.success(t('deleted'))
    await load()
  } catch (err) {
    snackbar.error(err instanceof Error ? err.message : t('deleteFailed'))
  } finally {
    showDelete.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <PageHeader :title="t('navRewardRedemptions')" :subtitle="t('reward_redemptionsViewSubtitle')" />
    <AppTable :headers="headers" :items="items" :loading="loading">
      <template #item.rewardId="{ item }">{{ String(item.rewardId?.['title'] ?? item.rewardIdId ?? '') }}</template>
      <template #item.actions="{ item }">
        <el-button text size="small" type="danger" @click="confirmDelete(item)">
          <AppIcon icon="mdi-delete-outline" />
        </el-button>
      </template>
    </AppTable>
    <ConfirmDialog
      v-model="showDelete"
      :title="t('reward_redemptionsDeleteTitle')"
      :content="t('reward_redemptionsDeleteContent')"
      @confirm="onDelete"
    />
  </div>
</template>
