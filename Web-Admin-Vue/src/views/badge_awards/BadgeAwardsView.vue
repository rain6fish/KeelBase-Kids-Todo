<!-- SPDX-License-Identifier: Apache-2.0 -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHeader from '@/components/PageHeader.vue'
import AppTable from '@/components/AppTable.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { useSnackbarStore } from '@/stores/snackbar'
import { badge_awardsApi, type AdminBadgeAward } from '@/api/badge_awards'

const { t } = useI18n()
const snackbar = useSnackbarStore()

const items = ref<AdminBadgeAward[]>([])
const loading = ref(false)
const showDelete = ref(false)
const pendingDelete = ref<AdminBadgeAward | null>(null)

const headers = computed(() => [
  { key: 'id', title: 'ID' },
  { key: 'badgeId', title: 'badgeId' },
  { key: 'earnedOn', title: 'earnedOn' },
  { key: 'createdAt', title: t('createdAt') },
  { key: 'actions', title: t('actionCol') },
])

async function load() {
  loading.value = true
  try {
    items.value = await badge_awardsApi.list()
  } catch (err) {
    snackbar.error(err instanceof Error ? err.message : t('loadFailed'))
  } finally {
    loading.value = false
  }
}

function confirmDelete(item: AdminBadgeAward) {
  pendingDelete.value = item
  showDelete.value = true
}

async function onDelete() {
  if (!pendingDelete.value) return
  try {
    await badge_awardsApi.remove(pendingDelete.value.id)
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
    <PageHeader :title="t('navBadgeAwards')" :subtitle="t('badge_awardsViewSubtitle')" />
    <AppTable :headers="headers" :items="items" :loading="loading">
      <template #item.badgeId="{ item }">{{ String(item.badgeId?.['name'] ?? item.badgeIdId ?? '') }}</template>
      <template #item.actions="{ item }">
        <el-button text size="small" type="danger" @click="confirmDelete(item)">
          <AppIcon icon="mdi-delete-outline" />
        </el-button>
      </template>
    </AppTable>
    <ConfirmDialog
      v-model="showDelete"
      :title="t('badge_awardsDeleteTitle')"
      :content="t('badge_awardsDeleteContent')"
      @confirm="onDelete"
    />
  </div>
</template>
