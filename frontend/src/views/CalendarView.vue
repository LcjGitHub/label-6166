<template>
  <el-card shadow="never">
    <div class="calendar-header">
      <el-button :icon="ArrowLeft" circle @click="prevMonth" />
      <span class="calendar-title">{{ currentYear }}年{{ currentMonth }}月</span>
      <el-button :icon="ArrowRight" circle @click="nextMonth" />
      <el-button type="primary" plain size="small" style="margin-left: 12px" @click="goToday">今天</el-button>
    </div>

    <div class="calendar-grid">
      <div class="weekday-row">
        <div v-for="d in weekdays" :key="d" class="weekday-cell">{{ d }}</div>
      </div>
      <div class="date-rows">
        <div v-for="(week, wi) in calendarWeeks" :key="wi" class="week-row">
          <div
            v-for="day in week"
            :key="day.key"
            class="date-cell"
            :class="{
              'other-month': !day.currentMonth,
              'is-today': day.isToday,
              'is-selected': selectedDate === day.key,
              'has-festival': day.festivals.length > 0,
            }"
            @click="selectDate(day)"
          >
            <span class="date-number">{{ day.day }}</span>
            <div class="festival-tags">
              <span
                v-for="f in day.festivals"
                :key="f.id"
                class="festival-dot"
                :class="{ 'festival-lunar': f.date_type === 'lunar' }"
                :title="f.date_note || f.name"
              >{{ f.name }}<em v-if="f.date_note && f.date_type === 'lunar'">（{{ f.date_note }}）</em></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="noDayFestivals.length > 0" class="monthly-panel">
      <h3 class="monthly-title">本月内节日</h3>
      <div class="monthly-list">
        <div v-for="f in noDayFestivals" :key="f.id" class="monthly-card" @click="openDetail(f)">
          <div class="monthly-name">{{ f.name }}</div>
          <div class="monthly-region">
            <el-tag size="small" type="info">{{ f.region }}</el-tag>
          </div>
          <div class="monthly-note">
            <el-tag size="small" type="warning">{{ f.date_note || '本月内' }}</el-tag>
          </div>
          <div class="monthly-date-desc">{{ f.date_description }}</div>
          <div class="monthly-summary">{{ f.custom_summary }}</div>
        </div>
      </div>
    </div>

    <div v-if="selectedFestivals.length > 0" class="detail-panel">
      <h3 class="detail-title">{{ selectedLabel }} 的节日</h3>
      <div class="detail-list">
        <div v-for="f in selectedFestivals" :key="f.id" class="detail-card" @click="openDetail(f)">
          <div class="detail-name">{{ f.name }}</div>
          <div class="detail-region">
            <el-tag size="small" type="info">{{ f.region }}</el-tag>
            <el-tag v-if="f.date_note" size="small" type="warning" style="margin-left: 4px">{{ f.date_note }}</el-tag>
          </div>
          <div class="detail-date-desc">{{ f.date_description }}</div>
          <div class="detail-summary">{{ f.custom_summary }}</div>
          <div v-if="f.tags && f.tags.length" class="detail-tags">
            <el-tag
              v-for="tag in f.tags"
              :key="tag"
              size="small"
              :type="getTagType(tag)"
              class="tag-item"
            >{{ tag }}</el-tag>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="selectedDate" class="detail-panel empty">
      <p>{{ selectedLabel }} 暂无节日记录</p>
    </div>

    <FestivalDetail v-model="detailVisible" :festival="currentDetail" />
  </el-card>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue';
import { fetchFestivalsByMonth } from '../api/festival';
import { getTagType } from '../utils/tags';
import FestivalDetail from '../components/FestivalDetail.vue';

const today = new Date();
const currentYear = ref(today.getFullYear());
const currentMonth = ref(today.getMonth() + 1);
const festivals = ref([]);
const selectedDate = ref(null);
const detailVisible = ref(false);
const currentDetail = ref(null);

const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

const calendarWeeks = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

  const festivalMap = {};
  const noDayFestivals = [];
  for (const f of festivals.value) {
    const day = f.parsed_day;
    if (day && day >= 1 && day <= daysInMonth) {
      const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (!festivalMap[key]) festivalMap[key] = [];
      festivalMap[key].push(f);
    } else {
      noDayFestivals.push(f);
    }
  }

  const weeks = [];
  let week = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const pm = month === 1 ? 12 : month - 1;
    const py = month === 1 ? year - 1 : year;
    week.push({
      day: d,
      key: `${py}-${String(pm).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      currentMonth: false,
      isToday: false,
      festivals: [],
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    week.push({
      day: d,
      key,
      currentMonth: true,
      isToday: key === formatDate(today),
      festivals: festivalMap[key] || [],
    });
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  const remaining = 7 - week.length;
  for (let d = 1; d <= remaining; d++) {
    const nm = month === 12 ? 1 : month + 1;
    const ny = month === 12 ? year + 1 : year;
    week.push({
      day: d,
      key: `${ny}-${String(nm).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      currentMonth: false,
      isToday: false,
      festivals: [],
    });
  }
  if (week.length > 0) weeks.push(week);

  return weeks;
});

const selectedLabel = computed(() => {
  if (!selectedDate.value) return '';
  const parts = selectedDate.value.split('-');
  return `${parts[0]}年${Number(parts[1])}月${Number(parts[2])}日`;
});

const selectedFestivals = computed(() => {
  if (!selectedDate.value) return [];
  return calendarWeeks.value
    .flat()
    .find((d) => d.key === selectedDate.value)?.festivals || [];
});

const noDayFestivals = computed(() => {
  return festivals.value.filter((f) => !f.parsed_day);
});

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function loadFestivals() {
  try {
    const { data } = await fetchFestivalsByMonth(currentMonth.value);
    festivals.value = data;
  } catch {
    festivals.value = [];
  }
}

function prevMonth() {
  if (currentMonth.value === 1) {
    currentMonth.value = 12;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
}

function nextMonth() {
  if (currentMonth.value === 12) {
    currentMonth.value = 1;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
}

function goToday() {
  currentYear.value = today.getFullYear();
  currentMonth.value = today.getMonth() + 1;
  selectedDate.value = formatDate(today);
}

function selectDate(day) {
  if (day.currentMonth) {
    selectedDate.value = day.key;
  } else {
    const parts = day.key.split('-');
    currentYear.value = Number(parts[0]);
    currentMonth.value = Number(parts[1]);
    selectedDate.value = day.key;
  }
}

function openDetail(festival) {
  currentDetail.value = festival;
  detailVisible.value = true;
}

watch([currentYear, currentMonth], () => {
  const year = currentYear.value;
  const month = currentMonth.value;
  selectedDate.value = `${year}-${String(month).padStart(2, '0')}-01`;
  loadFestivals();
});

onMounted(() => {
  selectedDate.value = formatDate(today);
  loadFestivals();
});
</script>

<style scoped>
.calendar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  gap: 12px;
}

.calendar-title {
  font-size: 20px;
  font-weight: 600;
  min-width: 140px;
  text-align: center;
}

.calendar-grid {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.weekday-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #f5f7fa;
}

.weekday-cell {
  text-align: center;
  padding: 8px 0;
  font-weight: 600;
  font-size: 14px;
  color: #606266;
}

.week-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-top: 1px solid #e4e7ed;
}

.date-cell {
  min-height: 90px;
  padding: 6px 4px;
  border-right: 1px solid #e4e7ed;
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
}

.date-cell:last-child {
  border-right: none;
}

.date-cell:hover {
  background: #ecf5ff;
}

.date-cell.other-month {
  background: #fafafa;
}

.date-cell.other-month .date-number {
  color: #c0c4cc;
}

.date-cell.is-today .date-number {
  background: #409eff;
  color: #fff;
  border-radius: 50%;
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.date-cell.is-selected {
  background: #ecf5ff;
  box-shadow: inset 0 0 0 2px #409eff;
}

.date-number {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.festival-tags {
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.festival-dot {
  font-size: 11px;
  line-height: 1.4;
  padding: 1px 4px;
  border-radius: 3px;
  background: rgba(64, 158, 255, 0.1);
  color: #409eff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.festival-dot.festival-lunar {
  background: rgba(230, 162, 60, 0.15);
  color: #e6a23c;
}

.festival-dot em {
  font-style: normal;
  opacity: 0.8;
  font-size: 10px;
  margin-left: 2px;
}

.monthly-panel {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

.monthly-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px;
  color: #303133;
}

.monthly-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}

.monthly-card {
  background: #fdf6ec;
  border-radius: 8px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #f5dab1;
}

.monthly-card:hover {
  background: #faecd8;
  box-shadow: 0 2px 8px rgba(230, 162, 60, 0.15);
}

.monthly-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 6px;
}

.monthly-region {
  margin-bottom: 4px;
  display: inline-block;
}

.monthly-note {
  margin-bottom: 6px;
  display: inline-block;
  margin-left: 4px;
}

.monthly-date-desc {
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
}

.monthly-summary {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}

.detail-panel {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

.detail-panel.empty {
  text-align: center;
  color: #909399;
  font-size: 14px;
  padding: 20px 0;
}

.detail-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px;
  color: #303133;
}

.detail-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}

.detail-card {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.detail-card:hover {
  background: #ecf5ff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
}

.detail-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 6px;
}

.detail-region {
  margin-bottom: 6px;
}

.detail-date-desc {
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
}

.detail-summary {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 8px;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag-item {
  margin: 0;
}
</style>
