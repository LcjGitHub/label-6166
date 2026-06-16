<template>
  <el-dialog
    :model-value="modelValue"
    :title="festival?.name || '节日详情'"
    width="560px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-descriptions v-if="festival" :column="1" border>
      <el-descriptions-item label="名称">{{ festival.name }}</el-descriptions-item>
      <el-descriptions-item label="地区">{{ festival.region }}</el-descriptions-item>
      <el-descriptions-item label="标签">
        <el-tag
          v-for="tag in festival.tags"
          :key="tag"
          size="small"
          :type="getTagType(tag)"
          class="tag-item"
        >
          {{ tag }}
        </el-tag>
        <span v-if="!festival.tags || festival.tags.length === 0" class="no-tags">-</span>
      </el-descriptions-item>
      <el-descriptions-item label="日期说明">{{ festival.date_description }}</el-descriptions-item>
      <el-descriptions-item label="习俗摘要">{{ festival.custom_summary }}</el-descriptions-item>
      <el-descriptions-item label="来源">{{ festival.source }}</el-descriptions-item>
    </el-descriptions>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { getTagType } from '../utils/tags';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  festival: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['update:modelValue']);
</script>

<style scoped>
.tag-item {
  margin-right: 4px;
  margin-bottom: 4px;
}

.no-tags {
  color: #c0c4cc;
}
</style>
