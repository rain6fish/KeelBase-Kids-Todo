<!-- SPDX-License-Identifier: Apache-2.0 -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHeader from '@/components/PageHeader.vue'
import AppTable from '@/components/AppTable.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { useSnackbarStore } from '@/stores/snackbar'
import { rewardsApi, type AdminReward } from '@/api/rewards'

const { t } = useI18n()
const snackbar = useSnackbarStore()

const items = ref<AdminReward[]>([])
const loading = ref(false)
const showDelete = ref(false)
const pendingDelete = ref<AdminReward | null>(null)

const headers = computed(() => [
  { key: 'id', title: 'ID' },
  { key: 'title', title: 'title' },
  { key: 'description', title: 'description' },
  { key: 'pointsCost', title: 'pointsCost' },
  { key: 'isActive', title: 'isActive' },
  { key: 'createdAt', title: t('createdAt') },
  { key: 'actions', title: t('actionCol') },
])

async function load() {
  loading.value = true
  try {
    items.value = await rewardsApi.list()
  } catch (err) {
    snackbar.error(err instanceof Error ? err.message : t('loadFailed'))
  } finally {
    loading.value = false
  }
}

function confirmDelete(item: AdminReward) {
  pendingDelete.value = item
  showDelete.value = true
}

async function onDelete() {
  if (!pendingDelete.value) return
  try {
    await rewardsApi.remove(pendingDelete.value.id)
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
    <PageHeader :title="t('navRewards')" :subtitle="t('rewardsViewSubtitle')" />
    <AppTable :headers="headers" :items="items" :loading="loading">
      <template #item.actions="{ item }">
        <el-button text size="small" type="danger" @click="confirmDelete(item)">
          <AppIcon icon="mdi-delete-outline" />
        </el-button>
      </template>
    </AppTable>
    <ConfirmDialog
      v-model="showDelete"
      :title="t('rewardsDeleteTitle')"
      :content="t('rewardsDeleteContent')"
      @confirm="onDelete"
    />
  </div>
</template>
