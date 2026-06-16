<template>
  <div class="statistics-page">
    <el-card shadow="never" class="summary-card">
      <div class="summary-content">
        <div class="summary-item">
          <div class="summary-value">{{ store.total }}</div>
          <div class="summary-label">节日总数</div>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <div class="summary-value">{{ store.regionStats.length }}</div>
          <div class="summary-label">地区数量</div>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <div class="summary-value">{{ topRegion }}</div>
          <div class="summary-label">节日最多地区</div>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="chart-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">各地区节日数量对比</span>
          <el-button type="primary" plain size="small" @click="handleRefresh">
            刷新数据
          </el-button>
        </div>
      </template>

      <div v-loading="store.loading" class="chart-wrapper" ref="chartContainerRef">
        <BarChart
          v-if="store.regionStats.length || store.loading"
          :data="store.regionStats"
          label-key="region"
          value-key="count"
          :width="chartWidth"
          :height="400"
        />
        <el-empty v-if="!store.loading && !store.regionStats.length" description="暂无数据" />
      </div>
    </el-card>

    <el-card shadow="never" class="ranking-card">
      <template #header>
        <span class="card-title">地区节日排行榜</span>
      </template>
      <el-table :data="store.regionStats" stripe style="width: 100%">
        <el-table-column type="index" label="排名" width="80" align="center">
          <template #default="{ $index }">
            <span :class="getRankClass($index)">{{ $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="region" label="地区" min-width="120" />
        <el-table-column prop="count" label="节日数量" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="primary" size="small">{{ row.count }} 个</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="占比" min-width="200">
          <template #default="{ row }">
            <div class="progress-wrapper">
              <el-progress
                :percentage="getPercentage(row.count)"
                :stroke-width="12"
                :show-text="false"
              />
              <span class="progress-text">{{ getPercentage(row.count) }}%</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { useStatisticsStore } from '../stores/statistics';
import BarChart from '../components/BarChart.vue';

const store = useStatisticsStore();
const chartContainerRef = ref(null);
const chartWidth = ref(800);

let resizeObserver = null;

function updateChartWidth() {
  if (chartContainerRef.value) {
    const containerWidth = chartContainerRef.value.clientWidth;
    chartWidth.value = Math.max(600, containerWidth);
  }
}

function initResizeObserver() {
  if (chartContainerRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      updateChartWidth();
    });
    resizeObserver.observe(chartContainerRef.value);
  }
}

onMounted(async () => {
  try {
    await store.loadRegionStats();
  } catch {
    ElMessage.error('加载统计数据失败，请确认后端已启动');
  }
  await nextTick();
  updateChartWidth();
  initResizeObserver();
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});

const topRegion = computed(() => {
  if (!store.regionStats.length) return '-';
  return store.regionStats[0].region;
});

function getPercentage(count) {
  if (!store.total) return 0;
  return Math.round((count / store.total) * 100);
}

function getRankClass(index) {
  if (index === 0) return 'rank rank-1';
  if (index === 1) return 'rank rank-2';
  if (index === 2) return 'rank rank-3';
  return 'rank';
}

async function handleRefresh() {
  try {
    await store.loadRegionStats();
    ElMessage.success('数据已刷新');
  } catch {
    ElMessage.error('刷新失败，请确认后端已启动');
  }
}
</script>

<style scoped>
.statistics-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-card {
  background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%);
}

.summary-content {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 20px 0;
}

.summary-item {
  text-align: center;
  flex: 1;
}

.summary-value {
  font-size: 36px;
  font-weight: 700;
  color: #409eff;
  line-height: 1.2;
}

.summary-label {
  font-size: 14px;
  color: #606266;
  margin-top: 8px;
}

.summary-divider {
  width: 1px;
  height: 60px;
  background: #c6e2ff;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-wrapper {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-text {
  font-size: 12px;
  color: #909399;
  min-width: 45px;
}

.rank {
  display: inline-block;
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  background: #f4f4f5;
  color: #909399;
}

.rank-1 {
  background: #fef0f0;
  color: #f56c6c;
}

.rank-2 {
  background: #fdf6ec;
  color: #e6a23c;
}

.rank-3 {
  background: #ecf5ff;
  color: #409eff;
}
</style>
