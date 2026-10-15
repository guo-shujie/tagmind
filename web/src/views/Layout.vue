<template>
    <el-container class="layout">
        <el-header class="header">
            <span class="logo">TagMind</span>
            <el-dropdown @command="handleCommand">
                <span class="user-info">{{ userStore.user?.username }}</span>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </el-header>
        <el-container>
            <el-aside width="200px" class="aside">
                <el-menu :default-active="route.path" router>
                    <el-menu-item index="/dashboard">
                        <el-icon>
                            <House />
                        </el-icon>
                        <span>工作台</span>
                    </el-menu-item>
                    <el-menu-item index="/contents">
                       <el-icon>
                            <Document />
                        </el-icon>
                        <span>内容管理</span>
                    </el-menu-item>
                    <el-menu-item index="/tags">
                        <el-icon>
                            <CollectionTag />
                        </el-icon>
                        <span>标签管理</span>
                    </el-menu-item>
                   <el-menu-item index="/graph">
                        <el-icon>
                            <Share />
                        </el-icon>
                        <span>知识图谱</span>
                    </el-menu-item>
                </el-menu>
            </el-aside>
            <el-main>
                <router-view />
            </el-main>
        </el-container>
    </el-container>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

function handleCommand(cmd) {
    if (cmd === 'logout') {
        userStore.logout()
        router.push('/login')
    }
}
</script>

<style scoped>
.layout {
    height: 100vh;
}

.header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #fff;
    border-bottom: 1px solid #eee;
}

.logo {
    font-size: 20px;
    font-weight: bold;
}

.aside {
    background: #fff;
    border-right: 1px solid #eee;
}
</style>