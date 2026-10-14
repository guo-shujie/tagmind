<template>
    <div class="login-container">
        <el-card class="login-card">
            <h2 class="title">TagMind</h2>
            <p class="subtitle">AI 驱动的智能内容知识管理</p>

            <el-tabs v-model="activeTab">
                <el-tab-pane label="登录" name="login">
                    <el-form @submit.prevent="handleLogin">
                        <el-form-item>
                            <el-input v-model="loginForm.username" placeholder="用户名" prefix-icon="User" />
                        </el-form-item>
                        <el-form-item>
                            <el-input v-model="loginForm.password" type="password" placeholder="密码" prefix-icon="Lock"
                                show-password />
                        </el-form-item>
                        <el-button type="primary" :loading="loading" @click="handleLogin" style="width: 100%">
                            登 录
                        </el-button>
                    </el-form>
                </el-tab-pane>

                <el-tab-pane label="注册" name="register">
                    <el-form @submit.prevent="handleRegister">
                        <el-form-item>
                            <el-input v-model="registerForm.username" placeholder="用户名" prefix-icon="User" />
                        </el-form-item>
                        <el-form-item>
                            <el-input v-model="registerForm.email" placeholder="邮箱" prefix-icon="Message" />
                        </el-form-item>
                        <el-form-item>
                            <el-input v-model="registerForm.password" type="password" placeholder="密码"
                                prefix-icon="Lock" show-password />
                        </el-form-item>
                        <el-button type="primary" :loading="loading" @click="handleRegister" style="width: 100%">
                            注 册
                        </el-button>
                    </el-form>
                </el-tab-pane>
            </el-tabs>
        </el-card>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()
const activeTab = ref('login')
const loading = ref(false)

const loginForm = reactive({
    username: '',
    password: '',
})

const registerForm = reactive({
    username: '',
    email: '',
    password: '',
})

async function handleLogin() {
    if (!loginForm.username || !loginForm.password) return
    loading.value = true
    try {
        await userStore.login(loginForm.username, loginForm.password)
        router.push('/')
    } finally {
        loading.value = false
    }
}

async function handleRegister() {
    if (!registerForm.username || !registerForm.email || !registerForm.password) return
    loading.value = true
    try {
        await userStore.register(registerForm.username, registerForm.email, registerForm.password)
        router.push('/')
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
.login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
    width: 400px;
}

.title {
    text-align: center;
    margin: 0 0 5px;
    font-size: 28px;
}

.subtitle {
    text-align: center;
    color: #999;
    font-size: 13px;
    margin: 0 0 20px;
}
</style>