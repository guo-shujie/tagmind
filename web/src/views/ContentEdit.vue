<template>
  <div>
    <h2>{{ isEdit ? '编辑内容' : '新建内容' }}</h2>
    <el-form :model="form" label-width="80px" style="max-width: 800px">
      <el-form-item label="标题">
        <el-input v-model="form.title" placeholder="请输入标题" />
      </el-form-item>
      <el-form-item label="内容">
        <el-input v-model="form.content_text" type="textarea" :rows="10" placeholder="请输入内容" />
      </el-form-item>
      <el-form-item label="来源URL">
        <el-input v-model="form.source_url" placeholder="可选，粘贴网页链接" />
      </el-form-item>
      <el-form-item label="标签">
        <el-select v-model="form.tag_ids" multiple placeholder="选择标签" style="width: 100%">
          <el-option v-for="tag in allTags" :key="tag.id" :label="tag.name" :value="tag.id" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSave" :loading="loading">保存</el-button>
        <el-button @click="$router.back()">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { contentApi } from '../api/content';
import { tagApi } from '../api/tag';

const route = useRoute();
const router = useRouter();
const isEdit = !!route.params.id;
const loading = ref(false);
const allTags = ref([]);

const form = reactive({
  title: '',
  content_text: '',
  source_url: '',
  tag_ids: [],
});

async function handleSave() {
  loading.value = true;
  try {
    if (isEdit) {
      await contentApi.update(route.params.id, form);
    } else {
      await contentApi.create(form);
    }
    router.push('/contents');
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  const tags = await tagApi.list();
  allTags.value = tags;

  if (isEdit) {
    const data = await contentApi.detail(route.params.id);
    form.title = data.title;
    form.content_text = data.content_text;
    form.source_url = data.source_url;
    form.tag_ids = data.tags?.map(t => t.id) || [];
  }
});
</script>