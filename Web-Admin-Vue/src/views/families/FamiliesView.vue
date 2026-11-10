<!-- SPDX-License-Identifier: Apache-2.0 -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHeader from '@/components/PageHeader.vue'
import AppTable from '@/components/AppTable.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { useSnackbarStore } from '@/stores/snackbar'
import { familiesApi, type AdminFamilie } from '@/api/families'

const { t } = useI18n()
const snackbar = useSnackbarStore()

const items = ref<AdminFamilie[]>([])
const loading = ref(false)
const showDelete = ref(false)
const pendingDelete = ref<AdminFamilie | null>(null)

const headers = computed(() => [
  { key: 'id', title: 'ID' },
  { key: 'name', title: 'name' },
  { key: 'inviteCode', title: 'inviteCode' },
  { key: 'approvalMode', title: 'approvalMode' },
  { key: 'useTimeStart', title: 'useTimeStart' },
  { key: 'useTimeEnd', title: 'useTimeEnd' },
  { key: 'createdAt', title: t('createdAt') },
  { key: 'actions', title: t('actionCol') },
])

async function load() {
  loading.value = true
  try {
    items.value = await familiesApi.list()
  } catch (err) {
    snackbar.error(err instanceof Error ? err.message : t('loadFailed'))
  } finally {
    loading.value = false
  }
}

function confirmDelete(item: AdminFamilie) {
  pendingDelete.value = item
  showDelete.value = true
}

async function onDelete() {
  if (!pendingDelete.value) return
  try {
    await familiesApi.remove(pendingDelete.value.id)
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
    <PageHeader :title="t('navFamilies')" :subtitle="t('familiesViewSubtitle')" />
    <AppTable :headers="headers" :items="items" :loading="loading">
      <template #item.actions="{ item }">
        <el-button text size="small" type="danger" @click="confirmDelete(item)">
          <AppIcon icon="mdi-delete-outline" />
        </el-button>
      </template>
    </AppTable>
    <ConfirmDialog
      v-model="showDelete"
      :title="t('familiesDeleteTitle')"
      :content="t('familiesDeleteContent')"
      @confirm="onDelete"
    />
  </div>
</template>
