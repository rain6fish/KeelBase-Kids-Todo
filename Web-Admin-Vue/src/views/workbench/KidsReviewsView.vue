<!-- SPDX-License-Identifier: Apache-2.0 -->
<template>
  <div v-loading="loading">
    <PageHeader :title="t('navDailyReviews')" subtitle="记录每天的观察和鼓励" />

    <el-card shadow="never">
      <template #header>
        <div class="d-flex align-center justify-space-between">
          <span class="text-h6">每日评价</span>
          <el-button type="primary" @click="openCreate">
            <AppIcon icon="mdi-plus" class="mr-1" />写评价
          </el-button>
        </div>
      </template>
      <el-table :data="reviews">
        <el-table-column prop="reviewDate" label="日期" width="140" />
        <el-table-column prop="content" label="内容" min-width="320" />
        <el-table-column prop="rating" label="评分" width="90" />
      </el-table>
      <el-empty v-if="!reviews.length" description="还没有评价" />
    </el-card>

    <el-dialog v-model="createOpen" title="写评价" width="480">
      <el-form label-width="80px">
        <el-form-item label="日期">
          <el-date-picker v-model="form.reviewDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="form.content" type="textarea" :rows="4" placeholder="今天孩子做得怎么样？" />
        </el-form-item>
        <el-form-item label="评分">
          <el-rate v-model="form.rating" :max="5" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createOpen = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="create">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import { kidsApi, type KidsReview } from '@/api/kids'

const { t } = useI18n()
const loading = ref(false)
const saving = ref(false)
const createOpen = ref(false)
const reviews = ref<KidsReview[]>([])
const form = reactive({
  reviewDate: new Date().toISOString().slice(0, 10),
  content: '',
  rating: 5,
})

async function load() {
  loading.value = true
  try {
    reviews.value = await kidsApi.reviews()
  } catch (err) {
    ElMessage.error((err as Error).message)
  } finally {
    loading.value = false
  }
}

function openCreate() {
  form.reviewDate = new Date().toISOString().slice(0, 10)
  form.content = ''
  form.rating = 5
  createOpen.value = true
}

async function create() {
  if (!form.content.trim()) {
    ElMessage.warning('请输入评价内容')
    return
  }
  saving.value = true
  try {
    await kidsApi.createReview({ ...form, content: form.content.trim() })
    createOpen.value = false
    ElMessage.success('已保存')
    await load()
  } catch (err) {
    ElMessage.error((err as Error).message)
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
