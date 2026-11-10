<!-- SPDX-License-Identifier: Apache-2.0 -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHeader from '@/components/PageHeader.vue'
import AppTable from '@/components/AppTable.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { useSnackbarStore } from '@/stores/snackbar'
import { checkinsApi, type AdminCheckin } from '@/api/checkins'

const { t } = useI18n()
const snackbar = useSnackbarStore()

const items = ref<AdminCheckin[]>([])
const loading = ref(false)
const showDelete = ref(false)
const pendingDelete = ref<AdminCheckin | null>(null)

const headers = computed(() => [
  { key: 'id', title: 'ID' },
  { key: 'checkDate', title: 'checkDate' },
  { key: 'totalTasks', title: 'totalTasks' },
  { key: 'doneTasks', title: 'doneTasks' },
  { key: 'isPerfect', title: 'isPerfect' },
  { key: 'pointsEarned', title: 'pointsEarned' },
  { key: 'createdAt', title: t('createdAt') },
  { key: 'actions', title: t('actionCol') },
])

async function load() {
  loading.value = true
  try {
    items.value = await checkinsApi.list()
  } catch (err) {
    snackbar.error(err instanceof Error ? err.message : t('loadFailed'))
  } finally {
    loading.value = false
  }
}

function confirmDelete(item: AdminCheckin) {
  pendingDelete.value = item
  showDelete.value = true
}

async function onDelete() {
  if (!pendingDelete.value) return
  try {
    await checkinsApi.remove(pendingDelete.value.id)
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
    <PageHeader :title="t('navCheckins')" :subtitle="t('checkinsViewSubtitle')" />
    <AppTable :headers="headers" :items="items" :loading="loading">
      <template #item.actions="{ item }">
        <el-button text size="small" type="danger" @click="confirmDelete(item)">
          <AppIcon icon="mdi-delete-outline" />
        </el-button>
      </template>
    </AppTable>
    <ConfirmDialog
      v-model="showDelete"
      :title="t('checkinsDeleteTitle')"
      :content="t('checkinsDeleteContent')"
      @confirm="onDelete"
    />
  </div>
</template>
