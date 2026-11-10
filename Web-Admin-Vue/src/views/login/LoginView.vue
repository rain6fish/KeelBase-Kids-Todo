<!-- SPDX-License-Identifier: Apache-2.0 -->
<template>
  <div class="login-bg d-flex align-center justify-center">
    <el-card class="login-card" shadow="always">
      <div class="text-center pt-4">
        <AppLogo :size="40" class="mb-1" />
        <div class="text-h5 font-weight-bold">{{ t('appName') }}</div>
        <div class="text-caption text-medium-emphasis mt-1">{{ t('appTagline') }}</div>
      </div>
      <div class="px-6 py-4">
        <div class="login-tabs mb-4">
          <span
            class="login-tab"
            :class="{ active: mode === 'parent' }"
            @click="switchMode('parent')"
          >{{ t('loginTabParent') }}</span>
          <span
            class="login-tab"
            :class="{ active: mode === 'child' }"
            @click="switchMode('child')"
          >{{ t('loginTabChild') }}</span>
        </div>

        <el-alert v-if="errorMessage || auth.loginDetails" type="error" :closable="false" class="mb-4">
          <template v-if="errorMessage"><div style="font-weight:600">{{ errorMessage }}</div></template>
          <div v-if="auth.loginDetails?.reason" style="margin-top:4px">{{ t('errorReason') }}{{ auth.loginDetails.reason }}</div>
          <div v-if="auth.loginDetails?.impact" style="margin-top:2px">{{ t('errorImpact') }}{{ auth.loginDetails.impact }}</div>
          <div v-if="auth.loginDetails?.nextStep" style="margin-top:2px;color:var(--el-color-error)">{{ t('errorNextStep') }}{{ auth.loginDetails.nextStep }}</div>
        </el-alert>

        <el-form @submit.prevent="onSubmit">
          <template v-if="mode === 'parent'">
            <el-input
              v-model="username"
              :placeholder="t('usernamePlaceholder')"
              autocomplete="username"
              class="mb-3"
            >
              <template #prefix><AppIcon icon="mdi-account-outline" /></template>
            </el-input>
            <el-input
              v-model="password"
              :placeholder="t('passwordPlaceholder')"
              :type="showPwd ? 'text' : 'password'"
              autocomplete="current-password"
              @keyup.enter="onSubmit"
            >
              <template #prefix><AppIcon icon="mdi-lock-outline" /></template>
              <template #suffix>
                <el-button link @click="showPwd = !showPwd">
                  <AppIcon :icon="showPwd ? 'mdi-eye-off' : 'mdi-eye'" />
                </el-button>
              </template>
            </el-input>
          </template>
          <template v-else>
            <el-input
              v-model="inviteCode"
              :placeholder="t('familyInviteCodePlaceholder')"
              class="mb-3"
            >
              <template #prefix><AppIcon icon="mdi-ticket-outline" /></template>
            </el-input>
            <el-input
              v-model="childUsername"
              :placeholder="t('childUsernamePlaceholder')"
              autocomplete="username"
              class="mb-3"
            >
              <template #prefix><AppIcon icon="mdi-account-child-outline" /></template>
            </el-input>
            <el-input
              v-model="childPin"
              :placeholder="t('childPinPlaceholder')"
              :type="showPwd ? 'text' : 'password'"
              maxlength="6"
              @keyup.enter="onSubmit"
            >
              <template #prefix><AppIcon icon="mdi-lock-outline" /></template>
              <template #suffix>
                <el-button link @click="showPwd = !showPwd">
                  <AppIcon :icon="showPwd ? 'mdi-eye-off' : 'mdi-eye'" />
                </el-button>
              </template>
            </el-input>
          </template>
          <el-button
            type="primary"
            native-type="submit"
            size="large"
            class="mt-3 w-100"
            :loading="auth.status === 'loading'"
          >
            {{ t('login') }}
          </el-button>
        </el-form>

        <template v-if="hasEnterpriseSso">
          <el-divider><span class="text-caption text-medium-emphasis">{{ t('enterpriseSso') }}</span></el-divider>
          <el-button plain size="large" class="w-100" @click="onEnterpriseSso">
            {{ t('enterpriseSso') }}
          </el-button>
        </template>

      </div>
      <div class="text-center pb-4">
        <LangToggle />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { homeFor } from '@/router/guards'
import { authApi } from '@/api/auth'
import LangToggle from '@/components/LangToggle.vue'
import AppLogo from '@/components/AppLogo.vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const mode = ref<'parent' | 'child'>('parent')
const username = ref('')
const password = ref('')
const inviteCode = ref('')
const childUsername = ref('')
const childPin = ref('')
const showPwd = ref(false)
const errorMessage = ref('')
const hasEnterpriseSso = ref(false)

function switchMode(next: 'parent' | 'child') {
  mode.value = next
  errorMessage.value = ''
  auth.errorMessage = ''
  auth.loginDetails = null
}

onMounted(async () => {
  // 登录页访问统计（IP/OS/浏览器/时间 → 服务端文件）；失败静默不影响登录
  try {
    await authApi.loginStats()
  } catch {
    // 统计失败忽略
  }
  try {
    const cfg = await authApi.oauthProviders()
    const enterprise = (cfg.groups?.enterprise as Array<{ id?: string }> | undefined) ?? []
    hasEnterpriseSso.value = enterprise.some((p) => p.id === 'oidc')
  } catch {
    // providers 端点不可用时不显示企业 SSO 入口，不影响账号密码登录
  }
})

async function onEnterpriseSso() {
  try {
    // hash 路由回调：IdP 需将 redirect_uri 精确注册（OIDC redirect_uri 必须一致）
    const callback = `${location.origin}${location.pathname}#/auth/oidc/callback`
    const { url } = await authApi.oidcUrl(callback)
    location.href = url
  } catch {
    errorMessage.value = t('oidcLoginFailed')
  }
}

async function onSubmit() {
  let ok = false
  if (mode.value === 'child') {
    const invite = inviteCode.value.trim().toUpperCase()
    const account = childUsername.value.trim()
    const pin = childPin.value.trim()
    if (!account || !pin) {
      errorMessage.value = t('loginFailed')
      return
    }
    ok = await auth.childLogin(account, pin, invite || undefined)
  } else {
    if (!username.value || !password.value) {
      errorMessage.value = t('loginFailed')
      return
    }
    ok = await auth.login(username.value, password.value)
  }
  if (ok) {
    const redirect = route.query.redirect
    // 落地页由 homeFor 单源决定（守卫与 OIDC 回调用的是同一个）——此前这里硬编码
    // `auth.isAdmin ? '/' : '/workbench'`，既漏了 user 构建的分流，也与守卫各写一份。
    router.replace(typeof redirect === 'string' ? redirect : homeFor(auth.user?.role))
  } else {
    errorMessage.value = auth.errorMessage || t('loginFailed')
  }
}
</script>

<style scoped>
.login-bg {
  min-height: 100vh;
  background:
    radial-gradient(1200px 600px at 70% -10%, var(--keel-glow, rgba(109, 40, 217, 0.25)) 0%, transparent 60%),
    linear-gradient(135deg, var(--keel-brand-gradient-from, var(--el-color-primary)) 0%, var(--el-bg-color-page) 100%);
}
.login-card {
  width: 420px;
  max-width: 92vw;
  border-radius: var(--keel-radius-md);
}
.login-tabs {
  display: flex;
  justify-content: center;
  gap: 24px;
}
.login-tab {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  padding-bottom: 4px;
}
.login-tab.active {
  color: var(--el-color-primary);
  border-bottom: 2px solid var(--el-color-primary);
}
</style>
