<!-- SPDX-License-Identifier: Apache-2.0 -->
<template>
  <div v-loading="loading">
    <PageHeader :title="t('navWorkbench')" :subtitle="t('workbenchSubtitle')" />

    <el-row :gutter="16">
      <el-col :xs="24" :sm="12" :md="6">
        <StatCard :label="selectedDate === todayLocal ? '今日完成' : '当日完成'" :value="`${stats.done} / ${stats.total}`" icon="mdi-check-circle-outline" color="success" />
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <StatCard label="完成率" :value="`${Math.round(stats.completionRate * 100)}%`" icon="mdi-chart-donut" color="primary" />
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <StatCard label="家庭积分" :value="stats.points" icon="mdi-star-outline" color="warning" />
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <StatCard label="家庭成员" :value="stats.members" icon="mdi-account-group-outline" color="info" />
      </el-col>
    </el-row>

    <el-card class="mt-4" shadow="never">
      <template #header>
        <div class="d-flex align-center justify-space-between flex-wrap" style="gap: 12px">
          <div class="d-flex align-center flex-wrap" style="gap: 12px; min-width: 0">
            <span class="text-h6">{{ cardTitle }}</span>
            <el-date-picker
              v-model="selectedDate"
              type="date"
              value-format="YYYY-MM-DD"
              :clearable="false"
              :editable="false"
              style="width: 150px; flex: 0 0 auto"
              @change="load"
            />
            <el-button v-if="selectedDate !== todayLocal" size="small" text @click="goToday">回到今天</el-button>
          </div>
          <el-button type="primary" @click="openCreate">
            <AppIcon icon="mdi-plus" class="mr-1" />新建任务
          </el-button>
        </div>
      </template>

      <el-table :data="tasks" size="default">
        <el-table-column type="index" label="#" width="56" />
        <el-table-column prop="title" label="任务" min-width="200">
          <template #default="{ row }">
            <span :class="{ 'is-done': row.status === 'done' }">{{ row.title }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="110" sortable :sort-method="sortByPriority" />
        <el-table-column prop="status" label="状态" width="110" sortable :sort-method="sortByStatus" />
        <el-table-column prop="approvalStatus" label="审批" width="100" />
        <el-table-column prop="createdAt" label="创建时间" width="160" sortable :formatter="formatCreatedAt" />
        <el-table-column label="操作" width="320">
          <template #default="{ row }">
            <el-button v-if="canEdit(row)" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button v-if="row.status !== 'done'" size="small" type="primary" @click="complete(row)">
              完成
            </el-button>
            <el-button v-if="isParent && row.approvalStatus === 'pending'" size="small" type="success" @click="approve(row, true)">
              通过
            </el-button>
            <el-button v-if="isParent && row.approvalStatus === 'pending'" size="small" type="danger" @click="approve(row, false)">
              驳回
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!tasks.length" :description="selectedDate === todayLocal ? '今天还没有任务' : '这一天还没有任务'" />
    </el-card>

    <el-dialog v-model="editOpen" title="编辑任务" width="480">
      <el-form label-width="88px">
        <el-form-item label="任务名称">
          <el-input v-model="editForm.title" placeholder="例如：晨读 20 分钟" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editForm.description" type="textarea" :rows="3" placeholder="可选" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="editForm.priority" style="width: 100%">
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行人">
          <el-select v-model="editForm.assigneeId" style="width: 100%" placeholder="选择孩子" clearable>
            <el-option v-for="m in children" :key="m.id" :label="m.nickname" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker v-model="editForm.taskDate" type="date" value-format="YYYY-MM-DD" :editable="false" style="width: 100%" />
        </el-form-item>
        <el-form-item label="重复">
          <el-select v-model="editForm.repeatRule" style="width: 100%">
            <el-option v-for="r in repeatOptions" :key="r.value" :label="r.label" :value="r.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editOpen = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="createOpen" title="新建任务" width="480">
      <el-form label-width="88px">
        <el-form-item label="任务名称">
          <el-input v-model="form.title" placeholder="例如：晨读 20 分钟" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="form.priority" style="width: 100%">
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行人">
          <el-select v-model="form.assigneeId" style="width: 100%" placeholder="选择孩子">
            <el-option v-for="m in children" :key="m.id" :label="m.nickname" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker v-model="form.taskDate" type="date" value-format="YYYY-MM-DD" :editable="false" style="width: 100%" />
        </el-form-item>
        <el-form-item label="重复">
          <el-select v-model="form.repeatRule" style="width: 100%">
            <el-option v-for="r in repeatOptions" :key="r.value" :label="r.label" :value="r.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="预计分钟">
          <el-input-number v-model="form.estimatedMinutes" :min="5" :max="480" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createOpen = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitCreate">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import StatCard from '@/components/StatCard.vue'
import { kidsApi, type KidsMember, type KidsTask, type KidsStats } from '@/api/kids'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const auth = useAuthStore()
const loading = ref(false)
const saving = ref(false)
const tasks = ref<KidsTask[]>([])
const members = ref<KidsMember[]>([])
const stats = ref<KidsStats>({ total: 0, done: 0, completionRate: 0, members: 0, points: 0 })
const createOpen = ref(false)
const editOpen = ref(false)
const editRow = ref<KidsTask | null>(null)

/** 按本地时区取日期，避免 toISOString() 在 UTC 下把凌晨算成昨天。 */
function localDateString(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const todayLocal = computed(() => localDateString(new Date()))
const selectedDate = ref(todayLocal.value)
const cardTitle = computed(() =>
  selectedDate.value === todayLocal.value ? '今日任务' : `${selectedDate.value} 任务`,
)
const repeatOptions = [
  { label: '不重复', value: 'none' },
  { label: '每天', value: 'daily' },
  { label: '每周', value: 'weekly' },
  { label: '每月', value: 'monthly' },
]
const form = reactive({
  title: '',
  priority: 'medium',
  assigneeId: undefined as number | undefined,
  taskDate: selectedDate.value,
  repeatRule: 'none',
  estimatedMinutes: 20,
})
const editForm = reactive({
  title: '',
  description: '',
  priority: 'medium',
  assigneeId: undefined as number | undefined,
  taskDate: selectedDate.value,
  repeatRule: 'none',
})
const children = computed(() => members.value.filter((m) => m.familyRole === 'child'))

/** 家庭内角色来自 /auth/family 的成员表（登录响应本身不带 familyRole）。 */
const myFamilyRole = computed(
  () => members.value.find((m) => m.id === auth.user?.id)?.familyRole,
)
const isParent = computed(() => myFamilyRole.value === 'parent')

/** 与服务端一致：孩子只能编辑自己创建的任务，家长可编辑家庭内任何任务。 */
function canEdit(row: KidsTask) {
  return myFamilyRole.value !== 'child' || row.userId == null || row.userId === auth.user?.id
}

const priorityRank: Record<string, number> = { high: 0, medium: 1, low: 2 }
const statusRank: Record<string, number> = { todo: 0, doing: 1, done: 2, cancelled: 3 }

function sortByPriority(a: KidsTask, b: KidsTask) {
  return (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9)
}
function sortByStatus(a: KidsTask, b: KidsTask) {
  return (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9)
}
function formatCreatedAt(_row: KidsTask, _column: unknown, value: string) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function load() {
  loading.value = true
  try {
    const [taskList, overview, family] = await Promise.all([
      kidsApi.tasks(selectedDate.value),
      kidsApi.stats(selectedDate.value),
      kidsApi.family(),
    ])
    tasks.value = taskList
    stats.value = overview
    members.value = family.members ?? []
  } catch (err) {
    ElMessage.error((err as Error).message)
  } finally {
    loading.value = false
  }
}

function goToday() {
  selectedDate.value = todayLocal.value
  load()
}

function openCreate() {
  form.title = ''
  form.priority = 'medium'
  form.assigneeId = children.value[0]?.id
  form.taskDate = selectedDate.value
  form.repeatRule = 'none'
  form.estimatedMinutes = 20
  createOpen.value = true
}

async function submitCreate() {
  if (!form.title.trim()) {
    ElMessage.warning('请输入任务名称')
    return
  }
  saving.value = true
  try {
    await kidsApi.createTask({
      title: form.title.trim(),
      priority: form.priority,
      status: 'todo',
      taskDate: form.taskDate,
      estimatedMinutes: form.estimatedMinutes,
      repeatRule: form.repeatRule,
      approvalStatus: 'none',
      assigneeId: form.assigneeId,
      sortOrder: 0,
    })
    createOpen.value = false
    ElMessage.success('任务已创建')
    await load()
  } catch (err) {
    ElMessage.error((err as Error).message)
  } finally {
    saving.value = false
  }
}

function openEdit(row: KidsTask) {
  editRow.value = row
  editForm.title = row.title
  editForm.description = row.description ?? ''
  editForm.priority = row.priority
  editForm.assigneeId = row.assigneeId ?? undefined
  editForm.taskDate = (row.taskDate ?? todayLocal.value).slice(0, 10)
  editForm.repeatRule = row.repeatRule ?? 'none'
  editOpen.value = true
}

async function submitEdit() {
  const row = editRow.value
  if (!row) return
  if (!editForm.title.trim()) {
    ElMessage.warning('请输入任务名称')
    return
  }
  saving.value = true
  try {
    await kidsApi.updateTask(row.id, {
      title: editForm.title.trim(),
      description: editForm.description.trim() || undefined,
      priority: editForm.priority,
      assigneeId: editForm.assigneeId,
      taskDate: editForm.taskDate,
      repeatRule: editForm.repeatRule,
      version: row.version,
    })
    editOpen.value = false
    ElMessage.success('任务已保存')
    await load()
  } catch (err) {
    ElMessage.error((err as Error).message)
  } finally {
    saving.value = false
  }
}

async function complete(row: KidsTask) {
  try {
    await kidsApi.completeTask(row.id)
    ElMessage.success('已完成')
    await load()
  } catch (err) {
    ElMessage.error((err as Error).message)
  }
}

async function approve(row: KidsTask, pass: boolean) {
  try {
    if (pass) await kidsApi.approveTask(row.id)
    else await kidsApi.rejectTask(row.id)
    ElMessage.success(pass ? '已通过' : '已驳回')
    await load()
  } catch (err) {
    ElMessage.error((err as Error).message)
  }
}

onMounted(load)
</script>

<style scoped>
.is-done {
  text-decoration: line-through;
  color: var(--el-text-color-secondary);
}
.mt-4 {
  margin-top: 16px;
}
</style>
