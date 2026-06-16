<template>
  <div class="favorite-page">
    <div class="page-header">
      <el-button text @click="router.push('/')">
        <el-icon><ArrowLeft /></el-icon>
        返回节日列表
      </el-button>
      <h2>我的收藏</h2>
    </div>

    <div v-if="favStore.loading" class="loading-wrapper">
      <el-skeleton :rows="3" animated />
    </div>

    <el-empty v-else-if="favStore.favorites.length === 0" description="暂无收藏的节日">
      <el-button type="primary" @click="router.push('/')">去浏览节日</el-button>
    </el-empty>

    <div v-else class="card-grid">
      <el-card
        v-for="item in favStore.favorites"
        :key="item.favorite_id"
        shadow="hover"
        class="fav-card"
      >
        <template #header>
          <div class="card-header">
            <span class="card-title">{{ item.name }}</span>
            <el-button
              type="warning"
              text
              size="small"
              @click="handleRemove(item)"
            >
              取消收藏
            </el-button>
          </div>
        </template>
        <div class="card-body">
          <div class="card-meta">
            <el-tag size="small" type="info">{{ item.region }}</el-tag>
          </div>
          <p class="card-summary">{{ item.custom_summary }}</p>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
import { useFavoriteStore } from '../stores/favorite';

const router = useRouter();
const favStore = useFavoriteStore();

onMounted(async () => {
  try {
    await favStore.loadFavorites();
  } catch {
    ElMessage.error('加载收藏列表失败');
  }
});

async function handleRemove(item) {
  try {
    await favStore.toggleFavorite(item.id);
    ElMessage.success('已取消收藏');
  } catch {
    ElMessage.error('操作失败');
  }
}
</script>

<style scoped>
.favorite-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 16px 40px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 22px;
  color: #303133;
}

.loading-wrapper {
  padding: 40px 0;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.fav-card {
  transition: transform 0.2s;
}

.fav-card:hover {
  transform: translateY(-4px);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 17px;
  font-weight: 600;
  color: #303133;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-summary {
  margin: 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
