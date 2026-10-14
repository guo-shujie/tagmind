<template>
  <div>
    <div class="toolbar">
      <el-input v-model="keyword" placeholder="搜索内容..." style="width: 250px" clearable @keyup.enter="fetchList" />
      <el-select v-model="selectedTags" multiple placeholder="按标签筛选" style="width: 300px; margin-left: 10px"
        @change="fetchList">
        <el-option v-for="tag in allTags" :key="tag.id" :label="tag.name" :value="tag.id" />
      </el-select>
      <el-button type="primary" style="margin-left: 10px" @click="fetchList">搜索</el-button>
      <el-button type="success" style="float: right" @click="$router.push('/content/edit')">
        新建内容
      </el-button>
    </div>

    <div class="content-list">
      <el-card v-for="item in list" :key="item.id" class="content-card" @click="$router.push(`/content/${item.id}`)">
        <h3>{{ item.title }}</h3>
        <p class="summary">{{ item.summary || item.content_text?.substring(0, 100) + '...' }}</p>
        <div class="tags">
          <el-tag v-for="tag in item.tags" :key="tag.id" :color="tag.color" size="small" style="margin-right: 5px">
            {{ tag.name }}
          </el-tag>
        </div>
        <div class="meta">
          <span>{{ formatDate(item.created_at) }}</span>
          <span>浏览 {{ item.view_count }}</span>
        </div>
      </el-card>
    </div>

    <el-pagination v-if="total > pageSize" v-model:current-page="page" :page-size="pageSize" :total="total"
      layout="prev, pager, next" @current-change="fetchList" style="margin-top: 20px; text-align: center" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { contentApi } from '../api/content';
import { tagApi } from '../api/tag';

const list = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const keyword = ref('');
const selectedTags = ref([]);
const allTags = ref([]);

async function fetchList() {
  const params = {
    page: page.value,
    pageSize: pageSize.value,
  };
  if (keyword.value) params.keyword = keyword.value;
  if (selectedTags.value.length) params.tag_ids = selectedTags.value.join(',');

  const data = await contentApi.list(params);
  list.value = data.list;
  total.value = data.total;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString();
}

onMounted(async () => {
  await fetchList();
  const tags = await tagApi.list();
  allTags.value = tags;
});
</script>

<style scoped>
.toolbar {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.content-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.content-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.content-card:hover {
  transform: translateY(-2px);
}

.summary {
  color: #666;
  font-size: 13px;
  line-height: 1.5;
  height: 40px;
  overflow: hidden;
}

.tags {
  margin: 10px 0;
}

.meta {
  display: flex;
  justify-content: space-between;
  color: #999;
  font-size: 12px;
}
</style>