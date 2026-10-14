<template>
    <div v-loading="loading">
        <el-page-header @back="$router.back()" :content="detail.title" style="margin-bottom: 20px" />

        <el-card v-if="detail.id">
            <!-- 标题区 -->
            <template #header>
                <div class="detail-header">
                    <h1 class="detail-title">{{ detail.title }}</h1>
                    <div class="meta-info">
                        <span>创建于 {{ formatDate(detail.created_at) }}</span>
                        <span style="margin: 0 10px">|</span>
                        <span>浏览 {{ detail.view_count }}</span>
                        <span style="margin: 0 10px">|</span>
                        <el-tag :type="sentimentType(detail.sentiment)" size="small">
                            {{ sentimentText(detail.sentiment) }}
                        </el-tag>
                    </div>
                </div>
            </template>

            <!-- AI 摘要区（有摘要才展示，第三周 AI 分析后会有值） -->
            <el-alert v-if="detail.summary" title="AI 摘要" :description="detail.summary" type="info" :closable="false"
                style="margin-bottom: 20px" />

            <!-- 正文内容 -->
            <div class="content-body">
                <p v-for="(para, idx) in contentParagraphs" :key="idx">{{ para }}</p>
            </div>

            <!-- 标签区 -->
            <div class="tags-section" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee">
                <h4>标签</h4>
                <el-tag v-for="tag in detail.tags" :key="tag.id" :color="tag.color"
                    style="margin-right: 8px; cursor: pointer" @click="$router.push(`/contents?tag=${tag.id}`)">
                    {{ tag.name }}
                </el-tag>
                <span v-if="!detail.tags?.length" style="color: #999; font-size: 13px">
                    暂无标签（AI 分析后自动添加）
                </span>
            </div>

            <!-- 来源链接（如果有 URL 来源） -->
            <div v-if="detail.source_url" class="source-section" style="margin-top: 20px">
                <h4>来源</h4>
                <a :href="detail.source_url" target="_blank" style="color: #409eff">
                    {{ detail.source_url }}
                </a>
            </div>

            <!-- 操作按钮 -->
            <div style="margin-top: 30px; text-align: right">
                <el-button @click="$router.push(`/content/edit/${detail.id}`)">编辑</el-button>
                <el-button type="danger" @click="handleDelete">删除</el-button>
            </div>
        </el-card>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessageBox, ElMessage } from 'element-plus';
import { contentApi } from '../api/content';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const detail = ref({});

// 把正文按换行拆成段落，前端更好展示
const contentParagraphs = computed(() => {
    if (!detail.value.content_text) return [];
    return detail.value.content_text.split('\n').filter(p => p.trim());
});

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleString();
}

// 情感状态对应的标签颜色
function sentimentType(sentiment) {
    const map = { positive: 'success', neutral: 'info', negative: 'danger', pending: 'warning' };
    return map[sentiment] || 'info';
}

// 情感状态中文文案
function sentimentText(sentiment) {
    const map = { positive: '正面', neutral: '中性', negative: '负面', pending: '待分析' };
    return map[sentiment] || '未知';
}

async function handleDelete() {
    try {
        await ElMessageBox.confirm('确定删除这条内容吗？删除后不可恢复', '提示', { type: 'warning' });
        await contentApi.remove(detail.value.id);
        ElMessage.success('删除成功');
        router.push('/contents');
    } catch (err) {
        // 用户点取消，不处理
    }
}

onMounted(async () => {
    try {
        detail.value = await contentApi.detail(route.params.id);
    } finally {
        loading.value = false;
    }
});
</script>

<style scoped>
.detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.detail-title {
    margin: 0;
    font-size: 22px;
}

.meta-info {
    color: #999;
    font-size: 13px;
    display: flex;
    align-items: center;
}

.content-body {
    line-height: 1.8;
    font-size: 15px;
    color: #333;
}

.content-body p {
    margin: 0 0 12px;
}
</style>