<template>
    <div v-loading="loading">
      <el-page-header @back="$router.back()" :content="detail.title" style="margin-bottom: 20px" />
  
      <el-card v-if="detail.id">
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
  
        <!-- SSE 实时进度条 -->
        <el-card v-if="taskStatus && taskStatus.status !== 'completed' && taskStatus.status !== 'failed'" 
                 class="progress-card">
          <div class="progress-row">
            <el-progress 
              :percentage="taskStatus.progress" 
              :status="taskStatus.status === 'failed' ? 'exception' : ''"
              style="flex: 1"
            />
            <el-tag size="small" type="warning">{{ statusText(taskStatus.status) }}</el-tag>
          </div>
          <p class="progress-hint">AI 正在分析内容，请稍候...（{{ taskStatus.progress }}%）</p>
        </el-card>
  
        <!-- AI 摘要（分析完成后展示） -->
        <el-alert
          v-if="detail.summary"
          title="AI 摘要"
          :description="detail.summary"
          type="success"
          :closable="false"
          style="margin-bottom: 20px"
        />
  
        <!-- 正文 -->
        <div class="content-body">
          <p v-for="(para, idx) in contentParagraphs" :key="idx">{{ para }}</p>
        </div>
  
        <!-- 标签 -->
        <div class="tags-section">
          <h4>标签</h4>
          <el-tag
            v-for="tag in detail.tags"
            :key="tag.id"
            :color="tag.color"
            style="margin-right: 8px; cursor: pointer"
            @click="$router.push(`/contents?tag=${tag.id}`)"
          >
            {{ tag.name }}
          </el-tag>
          <span v-if="!detail.tags?.length" class="no-tag">
            暂无标签
          </span>
        </div>
  
        <!-- 相似内容推荐 -->
        <div v-if="relatedList.length" class="related-section">
          <h4>相似内容推荐</h4>
          <div v-for="item in relatedList" :key="item.id" class="related-item"
               @click="$router.push(`/content/${item.id}`)">
            <span class="related-title">{{ item.title }}</span>
            <el-tag size="small" type="info">共享 {{ item.shared_tags }} 个标签</el-tag>
          </div>
        </div>
  
        <!-- 操作按钮 -->
        <div class="actions">
          <el-button @click="$router.push(`/content/edit/${detail.id}`)">编辑</el-button>
          <el-button type="danger" @click="handleDelete">删除</el-button>
        </div>
      </el-card>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { ElMessageBox, ElMessage } from 'element-plus';
  import { contentApi } from '../api/content';
  import { taskApi } from '../api/task';
  
  const route = useRoute();
  const router = useRouter();
  const loading = ref(true);
  const detail = ref({});
  const taskStatus = ref(null);
  const relatedList = ref([]);
  let evtSource = null;
  
  const contentParagraphs = computed(() => {
    if (!detail.value.content_text) return [];
    return detail.value.content_text.split('\n').filter(p => p.trim());
  });
  
  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleString();
  }
  
  function sentimentType(sentiment) {
    return { positive: 'success', neutral: 'info', negative: 'danger', pending: 'warning' }[sentiment] || 'info';
  }
  
  function sentimentText(sentiment) {
    return { positive: '正面', neutral: '中性', negative: '负面', pending: '待分析' }[sentiment] || '未知';
  }
  
  function statusText(status) {
    return { pending: '等待中', processing: '分析中', failed: '失败' }[status] || status;
  }
  
  async function handleDelete() {
    try {
      await ElMessageBox.confirm('确定删除这条内容吗？', '提示', { type: 'warning' });
      await contentApi.remove(detail.value.id);
      ElMessage.success('删除成功');
      router.push('/contents');
    } catch (err) {}
  }
  
  // 加载相似内容
  async function loadRelated() {
    const data = await contentApi.related(route.params.id);
    relatedList.value = data;
  }
  
  // 启动 SSE 监听
  function startSSE() {
    evtSource = taskApi.streamStatus(route.params.id, (task) => {
      taskStatus.value = task;
  
      // 分析完成，刷新详情和推荐列表
      if (task.status === 'completed') {
        loadDetail();
        loadRelated();
      }
    });
  }
  
  async function loadDetail() {
    detail.value = await contentApi.detail(route.params.id);
  }
  
  onMounted(async () => {
    try {
      await loadDetail();
      loadRelated();
  
      // 如果内容正在分析中，启动 SSE
      if (detail.value.status === 'analyzing') {
        startSSE();
      }
    } finally {
      loading.value = false;
    }
  });
  
  // 组件卸载时关闭 SSE
  onUnmounted(() => {
    if (evtSource) evtSource.close();
  });
</script>

<style scoped>
.detail-header { display: flex; justify-content: space-between; align-items: center; }
.detail-title { margin: 0; font-size: 22px; }
.meta-info { color: #999; font-size: 13px; display: flex; align-items: center; }
.content-body { line-height: 1.8; font-size: 15px; color: #333; }
.content-body p { margin: 0 0 12px; }
.tags-section { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
.no-tag { color: #999; font-size: 13px; }
.related-section { margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee; }
.related-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; cursor: pointer; border-bottom: 1px dashed #f0f0f0; }
.related-item:hover .related-title { color: #409eff; }
.related-title { font-size: 14px; }
.actions { margin-top: 30px; text-align: right; }
.progress-card { margin-bottom: 20px; }
.progress-row { display: flex; align-items: center; gap: 15px; }
.progress-hint { color: #999; font-size: 12px; margin: 10px 0 0; }
</style> 