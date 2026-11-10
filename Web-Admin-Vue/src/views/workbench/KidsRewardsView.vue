<!-- SPDX-License-Identifier: Apache-2.0 -->
<template>
  <div v-loading="loading">
    <PageHeader :title="t('navRewards')" subtitle="用积分兑换家庭奖励" />

    <el-card class="mb-4" shadow="never">
      <div class="d-flex align-center justify-space-between">
        <div>
          <span class="text-caption text-medium-emphasis">家庭可用积分</span>
          <div class="text-h4 font-weight-bold">{{ stats.points }}</div>
        </div>
        <el-button type="primary" @click="createOpen = true">
          <AppIcon icon="mdi-plus" class="mr-1" />新建奖励
        </el-button>
      </div>
    </el-card>

    <el-row :gutter="16">
      <el-col v-for="reward in rewards" :key="reward.id" :xs="24" :sm="12" :md="8">
        <el-card shadow="hover" class="mb-4">
          <div class="d-flex align-center justify-space-between">
            <span class="text-h6">{{ reward.title }}</span>
            <el-tag type="warning">{{ reward.pointsCost }} 积分</el-tag>
          </div>
          <p class="text-body-2 text-medium-emphasis my-2">{{ reward.description || '—' }}</p>
          <el-button
            type="primary"
            :disabled="reward.isActive === false || stats.points < reward.pointsCost"
            @click="redeem(reward)"
          >
            兑换
          </el-button>
        </el-card>
      </el-col>
    </el-row>
    <el-empty v-if="!rewards.length" description="还没有奖励，先创建一个吧" />

    <el-card shadow="never">
      <template #header><span class="text-h6">兑换记录</span></template>
      <el-table :data="redemptions">
        <el-table-column label="奖励">
          <template #default="{ row }">{{ row.rewardIdName || row.rewardIdId }}</template>
        </el-table-column>
        <el-table-column prop="pointsSpent" label="消耗积分" width="110" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.isCancelled ? 'info' : 'success'" size="small">
              {{ row.isCancelled ? '已取消' : '已兑换' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="时间" width="190" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button v-if="!row.isCancelled" size="small" @click="cancel(row)">取消</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="createOpen" title="新建奖励" width="460">
      <el-form label-width="88px">
        <el-form-item label="名称"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="所需积分"><el-input-number v-model="form.pointsCost" :min="1" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createOpen = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="create">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import { kidsApi, type KidsRedemption, type KidsReward, type KidsStats } from '@/api/kids'

const { t } = useI18n()
const loading = ref(false)
const saving = ref(false)
const createOpen = ref(false)
const rewards = ref<KidsReward[]>([])
const redemptions = ref<KidsRedemption[]>([])
const stats = ref<KidsStats>({ total: 0, done: 0, completionRate: 0, members: 0, points: 0 })
const form = reactive({ title: '', description: '', pointsCost: 20 })

async function load() {
  loading.value = true
  try {
    const [rewardList, redemptionList, overview] = await Promise.all([
      kidsApi.rewards(),
      kidsApi.redemptions(),
      kidsApi.stats(),
    ])
    rewards.value = rewardList
    redemptions.value = redemptionList
    stats.value = overview
  } catch (err) {
    ElMessage.error((err as Error).message)
  } finally {
    loading.value = false
  }
}

async function create() {
  saving.value = true
  try {
    await kidsApi.createReward({ ...form, isActive: true })
    createOpen.value = false
    form.title = ''
    form.description = ''
    form.pointsCost = 20
    ElMessage.success('奖励已创建')
    await load()
  } catch (err) {
    ElMessage.error((err as Error).message)
  } finally {
    saving.value = false
  }
}

async function redeem(reward: KidsReward) {
  try {
    await kidsApi.redeemReward(reward.id)
    ElMessage.success('兑换成功')
    await load()
  } catch (err) {
    ElMessage.error((err as Error).message)
  }
}

async function cancel(row: KidsRedemption) {
  try {
    await kidsApi.cancelRedemption(row.id)
    ElMessage.success('已取消并退回积分')
    await load()
  } catch (err) {
    ElMessage.error((err as Error).message)
  }
}

onMounted(load)
</script>
