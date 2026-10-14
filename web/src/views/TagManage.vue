<template>
  <div>
    <div style="margin-bottom: 20px">
      <el-button type="primary" @click="dialogVisible = true">新建标签</el-button>
    </div>

    <el-table :data="tagList" border>
      <el-table-column prop="name" label="标签名" />
      <el-table-column prop="parent_name" label="父标签" />
      <el-table-column prop="usage_count" label="使用次数" width="100" />
      <el-table-column prop="description" label="描述" />
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button size="small" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" title="新建标签" width="500px">
      <el-form :model="tagForm" label-width="80px">
        <el-form-item label="标签名">
          <el-input v-model="tagForm.name" />
        </el-form-item>
        <el-form-item label="父标签">
          <el-select v-model="tagForm.parent_id" clearable placeholder="无（根标签）">
            <el-option v-for="tag in tagList" :key="tag.id" :label="tag.name" :value="tag.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="颜色">
          <el-color-picker v-model="tagForm.color" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="tagForm.description" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreateTag">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { tagApi } from '../api/tag';

const tagList = ref([]);
const dialogVisible = ref(false);
const tagForm = reactive({
  name: '',
  parent_id: null,
  color: '#1890ff',
  description: '',
});

async function fetchTags() {
  tagList.value = await tagApi.list();
}

async function handleCreateTag() {
  await tagApi.create(tagForm);
  dialogVisible.value = false;
  tagForm.name = '';
  tagForm.parent_id = null;
  await fetchTags();
}

async function handleDelete(id) {
  await tagApi.remove(id);
  await fetchTags();
}

onMounted(fetchTags);
</script>