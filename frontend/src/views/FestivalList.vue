<template>
  <el-card shadow="never">
    <div class="toolbar">
      <div class="filters">
        <span class="filter-label">地区筛选</span>
        <el-select
          v-model="regionFilter"
          clearable
          placeholder="全部地区"
          style="width: 160px"
          @change="handleRegionChange"
        >
          <el-option label="全部地区" value="" />
          <el-option
            v-for="region in store.regions"
            :key="region"
            :label="region"
            :value="region"
          />
        </el-select>
        <span class="filter-label">标签筛选</span>
        <el-select
          v-model="tagFilter"
          clearable
          placeholder="全部标签"
          style="width: 160px"
          @change="handleTagChange"
        >
          <el-option label="全部标签" value="" />
          <el-option
            v-for="tag in store.tags"
            :key="tag"
            :label="tag"
            :value="tag"
          />
        </el-select>
      </div>
      <div class="toolbar-actions">
        <el-button type="success" plain @click="goToStatistics">查看统计</el-button>
        <el-button type="primary" @click="openCreate">新增节日</el-button>
      </div>
    </div>

    <el-table
      v-loading="store.loading"
      :data="store.festivals"
      stripe
      style="width: 100%; margin-top: 16px"
      @row-click="openDetail"
    >
      <el-table-column prop="name" label="名称" min-width="120" />
      <el-table-column prop="region" label="地区" width="90" />
      <el-table-column label="标签" min-width="200">
        <template #default="{ row }">
          <el-tag
            v-for="tag in row.tags"
            :key="tag"
            size="small"
            :type="getTagType(tag)"
            class="tag-item"
          >
            {{ tag }}
          </el-tag>
          <span v-if="!row.tags || row.tags.length === 0" class="no-tags">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="date_description" label="日期说明" min-width="180" show-overflow-tooltip />
      <el-table-column prop="custom_summary" label="习俗摘要" min-width="220" show-overflow-tooltip />
      <el-table-column prop="source" label="来源" min-width="160" show-overflow-tooltip />
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="{ row }">
          <el-button
            :link="true"
            :type="favStore.isFavorited(row.id) ? 'warning' : 'default'"
            @click.stop="handleToggleFavorite(row)"
          >
            {{ favStore.isFavorited(row.id) ? '已收藏' : '收藏' }}
          </el-button>
          <el-button link type="primary" @click.stop="openDetail(row)">详情</el-button>
          <el-button link type="primary" @click.stop="openEdit(row)">编辑</el-button>
          <el-button link type="danger" @click.stop="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <FestivalDetail
    v-model="detailVisible"
    :festival="currentRow"
  />

  <FestivalForm
    v-model="formVisible"
    :festival="editingFestival"
    @submit="handleFormSubmit"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useFestivalStore } from '../stores/festival';
import { useFavoriteStore } from '../stores/favorite';
import FestivalDetail from '../components/FestivalDetail.vue';
import FestivalForm from '../components/FestivalForm.vue';

const router = useRouter();

const store = useFestivalStore();
const favStore = useFavoriteStore();

const regionFilter = ref('');
const tagFilter = ref('');
const detailVisible = ref(false);
const formVisible = ref(false);
const currentRow = ref(null);
const editingFestival = ref(null);

const tagTypeMap = {
  '民族节日': 'primary',
  '饮食习俗': 'success',
  '宗教祭祀': 'warning',
  '传统庆典': 'info',
  '体育竞技': 'danger',
  '民间信仰': '',
  '民间表演': 'primary',
};

function getTagType(tag) {
  return tagTypeMap[tag] || 'info';
}

/**
 * 初始化数据
 */
onMounted(async () => {
  try {
    await store.loadRegions();
    await store.loadTags();
    await store.loadFestivals();
    await favStore.loadFavoritedIds();
  } catch {
    ElMessage.error('加载节日数据失败，请确认后端已启动');
  }
});

/**
 * 地区筛选变更
 * @param {string} value
 */
function handleRegionChange(value) {
  store.filterByRegion(value || '');
}

/**
 * 标签筛选变更
 * @param {string} value
 */
function handleTagChange(value) {
  store.filterByTag(value || '');
}

/**
 * 跳转到统计页面
 */
function goToStatistics() {
  router.push('/statistics');
}

/**
 * 打开详情弹窗
 * @param {object} row
 */
function openDetail(row) {
  currentRow.value = row;
  detailVisible.value = true;
}

/**
 * 打开新增表单
 */
function openCreate() {
  editingFestival.value = null;
  formVisible.value = true;
}

/**
 * 打开编辑表单
 * @param {object} row
 */
function openEdit(row) {
  editingFestival.value = { ...row };
  formVisible.value = true;
}

/**
 * 删除节日
 * @param {object} row
 */
async function handleToggleFavorite(row) {
  try {
    await favStore.toggleFavorite(row.id);
    ElMessage.success(favStore.isFavorited(row.id) ? '收藏成功' : '已取消收藏');
  } catch {
    ElMessage.error('操作失败');
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除「${row.name}」吗？`, '提示', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    });
    await store.removeFestival(row.id);
    favStore.removeFestivalFromCache(row.id);
    ElMessage.success('删除成功');
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
}

/**
 * 表单提交（新增或编辑）
 * @param {object} payload
 */
async function handleFormSubmit(payload) {
  try {
    if (editingFestival.value?.id) {
      await store.editFestival(editingFestival.value.id, payload);
      ElMessage.success('更新成功');
    } else {
      await store.addFestival(payload);
      ElMessage.success('新增成功');
    }
    formVisible.value = false;
  } catch {
    ElMessage.error('保存失败');
  }
}
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
}

.filters {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-label {
  font-size: 14px;
  color: #606266;
}

.tag-item {
  margin-right: 4px;
  margin-bottom: 4px;
}

.no-tags {
  color: #c0c4cc;
}

:deep(.el-table__row) {
  cursor: pointer;
}
</style>
