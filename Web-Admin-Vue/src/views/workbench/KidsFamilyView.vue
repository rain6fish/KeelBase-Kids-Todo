<!-- SPDX-License-Identifier: Apache-2.0 -->
<template>
  <div v-loading="loading">
    <PageHeader :title="t('navFamilies')" subtitle="家庭成员、邀请码与日常规则" />

    <el-row :gutter="16">
      <el-col :xs="24" :md="10">
        <el-card shadow="never">
          <template #header><span class="text-h6">家庭信息</span></template>
          <el-form label-width="92px">
            <el-form-item label="家庭名称">
              <el-input v-model="form.name" :disabled="!canEditFamily" />
            </el-form-item>
            <el-form-item label="邀请码">
              <div class="d-flex align-center ga-2">
                <el-tag size="large" type="primary">{{ family?.inviteCode || '-' }}</el-tag>
                <el-button size="small" @click="copyInvite">复制</el-button>
                <el-button v-if="canEditFamily" size="small" @click="regenerate">重置</el-button>
              </div>
            </el-form-item>
            <el-form-item label="审批模式">
              <el-switch v-model="form.approvalMode" :disabled="!canEditFamily" />
              <span class="ml-2 text-caption text-medium-emphasis">孩子创建任务需家长审批</span>
            </el-form-item>
            <el-form-item label="可用开始">
              <el-time-picker v-model="form.useTimeStart" :disabled="!canEditFamily" format="HH:mm" value-format="HH:mm" placeholder="08:00" />
            </el-form-item>
            <el-form-item label="可用结束">
              <el-time-picker v-model="form.useTimeEnd" :disabled="!canEditFamily" format="HH:mm" value-format="HH:mm" placeholder="21:00" />
            </el-form-item>
            <el-form-item v-if="canEditFamily">
              <el-button type="primary" :loading="saving" @click="save">保存设置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="14">
        <el-card shadow="never">
          <template #header>
            <div class="d-flex align-center justify-space-between">
              <span class="text-h6">家庭成员</span>
              <el-button
                v-if="isParent"
                size="small"
                type="primary"
                plain
                :disabled="!family"
                @click="openCreate"
              >
                {{ t('kidsAddChild') }}
              </el-button>
            </div>
          </template>
          <el-table :data="members">
            <el-table-column prop="nickname" label="昵称" />
            <el-table-column label="角色" width="110">
              <template #default="{ row }">
                <el-tag :type="row.familyRole === 'parent' ? 'primary' : 'success'" size="small">
                  {{ row.familyRole === 'parent' ? '家长' : '孩子' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="username" label="账号" />
            <el-table-column label="状态" width="90">
              <template #default="{ row }">{{ row.isActive === false ? '停用' : '正常' }}</template>
            </el-table-column>
            <el-table-column label="操作" width="110">
              <template #default="{ row }">
                <el-button
                  v-if="isParent && row.familyRole === 'child'"
                  size="small"
                  link
                  type="primary"
                  @click="openEditAccount(row)"
                >
                  {{ t('kidsEditAccount') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="text-caption text-medium-emphasis mt-3">
            孩子登录：邀请码 + 登录账号 + PIN（App 或网页登录页的「孩子登录」均可）。
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="createOpen" :title="t('kidsAddChild')" width="420">
      <el-form label-width="88px">
        <el-form-item :label="t('kidsChildNickname')">
          <el-input v-model="childForm.nickname" maxlength="30" />
        </el-form-item>
        <el-form-item :label="t('kidsChildUsername')">
          <el-input
            v-model="childForm.username"
            maxlength="32"
            :placeholder="t('kidsChildUsernameHint')"
          />
        </el-form-item>
        <el-form-item :label="t('kidsChildPin')">
          <el-input v-model="childForm.pin" maxlength="6" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createOpen = false">{{ t('cancel') }}</el-button>
        <el-button type="primary" :loading="creating" @click="submitCreate">{{ t('create') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editOpen" :title="t('kidsEditAccount')" width="420">
      <el-form label-width="88px">
        <el-form-item :label="t('kidsChildNickname')">
          <el-input v-model="editForm.nickname" maxlength="30" />
        </el-form-item>
        <el-form-item :label="t('kidsChildUsername')">
          <el-input v-model="editForm.username" maxlength="32" />
        </el-form-item>
        <el-form-item :label="t('kidsChildPin')">
          <el-input
            v-model="editForm.pin"
            maxlength="6"
            show-password
            :placeholder="t('kidsChildPinKeep')"
          />
        </el-form-item>
      </el-form>
      <div class="text-caption text-medium-emphasis">
        {{ t('kidsChildUsernameHint') }}
      </div>
      <template #footer>
        <el-button @click="editOpen = false">{{ t('cancel') }}</el-button>
        <el-button type="primary" :loading="editing" @click="submitEdit">{{ t('save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import { kidsApi, type KidsFamily, type KidsMember } from '@/api/kids'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const auth = useAuthStore()
const loading = ref(false)
const saving = ref(false)
const family = ref<KidsFamily | null>(null)
const members = ref<KidsMember[]>([])
/** 孩子登录网页时只看成员；家庭设置/添加/编辑入口仅家长可见（后端另有 403 兜底）。 */
const isParent = computed(
  () => members.value.find((m) => m.id === auth.user?.id)?.familyRole === 'parent',
)
/** 家庭信息只有创建者可编辑；孩子与其他家长只读。 */
const canEditFamily = computed(
  () => !!family.value && family.value.userId === auth.user?.id,
)
const form = reactive({
  name: '',
  approvalMode: false,
  useTimeStart: '08:00',
  useTimeEnd: '21:00',
})

const createOpen = ref(false)
const creating = ref(false)
const childForm = reactive({ nickname: '', username: '', pin: '' })

const editOpen = ref(false)
const editing = ref(false)
const editForm = reactive({ id: 0, username: '', nickname: '', pin: '' })

async function load() {
  loading.value = true
  try {
    const res = await kidsApi.family()
    family.value = res.family
    members.value = res.members ?? []
    if (res.family) {
      form.name = res.family.name
      form.approvalMode = !!res.family.approvalMode
      form.useTimeStart = res.family.useTimeStart || '08:00'
      form.useTimeEnd = res.family.useTimeEnd || '21:00'
    }
  } catch (err) {
    ElMessage.error((err as Error).message)
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await kidsApi.updateFamily({
      name: form.name,
      approvalMode: form.approvalMode,
      useTimeStart: form.useTimeStart,
      useTimeEnd: form.useTimeEnd,
    })
    ElMessage.success('已保存')
    await load()
  } catch (err) {
    ElMessage.error((err as Error).message)
  } finally {
    saving.value = false
  }
}

async function copyInvite() {
  if (!family.value?.inviteCode) return
  await navigator.clipboard.writeText(family.value.inviteCode)
  ElMessage.success('邀请码已复制')
}

async function regenerate() {
  try {
    await kidsApi.regenerateInvite()
    ElMessage.success('邀请码已重置')
    await load()
  } catch (err) {
    ElMessage.error((err as Error).message)
  }
}

function openCreate() {
  childForm.nickname = ''
  childForm.username = ''
  childForm.pin = ''
  createOpen.value = true
}

function openEditAccount(row: KidsMember) {
  editForm.id = row.id
  editForm.username = row.username
  editForm.nickname = row.nickname
  editForm.pin = ''
  editOpen.value = true
}

const usernamePattern = /^[a-zA-Z0-9_]{3,32}$/

async function submitCreate() {
  if (!childForm.nickname.trim()) {
    ElMessage.warning(t('kidsChildNicknameRequired'))
    return
  }
  const username = childForm.username.trim()
  if (username && !usernamePattern.test(username)) {
    ElMessage.warning(t('kidsChildUsernameInvalid'))
    return
  }
  if (!/^\d{4,6}$/.test(childForm.pin)) {
    ElMessage.warning(t('kidsChildPinInvalid'))
    return
  }
  creating.value = true
  try {
    await kidsApi.createChild({
      nickname: childForm.nickname.trim(),
      pin: childForm.pin,
      ...(username ? { username } : {}),
    })
    createOpen.value = false
    ElMessage.success(t('kidsChildAdded'))
    await load()
  } catch (err) {
    ElMessage.error((err as Error).message)
  } finally {
    creating.value = false
  }
}

async function submitEdit() {
  const nickname = editForm.nickname.trim()
  if (!nickname) {
    ElMessage.warning(t('kidsChildNicknameRequired'))
    return
  }
  const username = editForm.username.trim()
  if (username && !usernamePattern.test(username)) {
    ElMessage.warning(t('kidsChildUsernameInvalid'))
    return
  }
  const pin = editForm.pin.trim()
  if (pin && !/^\d{4,6}$/.test(pin)) {
    ElMessage.warning(t('kidsChildPinInvalid'))
    return
  }
  editing.value = true
  try {
    await kidsApi.updateChild(editForm.id, {
      nickname,
      ...(username ? { username } : {}),
      ...(pin ? { pin } : {}),
    })
    editOpen.value = false
    ElMessage.success(t('kidsAccountUpdated'))
    await load()
  } catch (err) {
    ElMessage.error((err as Error).message)
  } finally {
    editing.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.ml-2 {
  margin-left: 8px;
}
.mt-3 {
  margin-top: 12px;
}
</style>
