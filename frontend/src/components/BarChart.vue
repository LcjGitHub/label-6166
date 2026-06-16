<template>
  <div class="bar-chart">
    <svg :width="svgWidth" :height="svgHeight" :viewBox="`0 0 ${svgWidth} ${svgHeight}`">
      <g class="grid-lines">
        <line
          v-for="i in gridLineCount"
          :key="i"
          :x1="paddingLeft"
          :x2="svgWidth - paddingRight"
          :y1="getGridLineY(i)"
          :y2="getGridLineY(i)"
          stroke="#e4e7ed"
          stroke-dasharray="4,4"
        />
        <text
          v-for="(label, index) in yAxisLabels"
          :key="`label-${index}`"
          :x="paddingLeft - 8"
          :y="getYAxisLabelY(index) + 4"
          text-anchor="end"
          font-size="12"
          fill="#909399"
        >
          {{ label }}
        </text>
      </g>

      <g class="bars">
        <g
          v-for="(item, index) in data"
          :key="item[labelKey]"
          :transform="`translate(${getBarX(index)}, 0)`"
        >
          <rect
            :x="0"
            :y="getBarY(item[valueKey])"
            :width="barWidth"
            :height="getBarHeight(item[valueKey])"
            :fill="barColor"
            rx="4"
            ry="4"
            class="bar-rect"
          />
          <text
            :x="barWidth / 2"
            :y="getBarY(item[valueKey]) - 6"
            text-anchor="middle"
            font-size="12"
            font-weight="500"
            fill="#303133"
          >
            {{ item[valueKey] }}
          </text>
          <text
            :x="barWidth / 2"
            :y="svgHeight - paddingBottom + 18"
            text-anchor="middle"
            font-size="12"
            fill="#606266"
          >
            {{ item[labelKey] }}
          </text>
        </g>
      </g>

      <line
        :x1="paddingLeft"
        :y1="paddingTop"
        :x2="paddingLeft"
        :y2="svgHeight - paddingBottom"
        stroke="#dcdfe6"
      />
      <line
        :x1="paddingLeft"
        :y1="svgHeight - paddingBottom"
        :x2="svgWidth - paddingRight"
        :y2="svgHeight - paddingBottom"
        stroke="#dcdfe6"
      />
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
  labelKey: {
    type: String,
    default: 'region',
  },
  valueKey: {
    type: String,
    default: 'count',
  },
  barColor: {
    type: String,
    default: '#409eff',
  },
  width: {
    type: Number,
    default: 800,
  },
  height: {
    type: Number,
    default: 400,
  },
});

const paddingTop = 30;
const paddingBottom = 50;
const paddingLeft = 50;
const paddingRight = 30;
const barGap = 20;

const svgWidth = computed(() => props.width);
const svgHeight = computed(() => props.height);

const chartWidth = computed(() => svgWidth.value - paddingLeft - paddingRight);
const chartHeight = computed(() => svgHeight.value - paddingTop - paddingBottom);

const maxValue = computed(() => {
  if (!props.data.length) return 10;
  const max = Math.max(...props.data.map((item) => item[props.valueKey]));
  if (max <= 5) {
    return max + 1;
  }
  if (max <= 10) {
    return Math.ceil(max / 2) * 2;
  }
  const step = Math.ceil(max / 5);
  return step * 5;
});

const gridLineCount = computed(() => {
  if (maxValue.value <= 6) {
    return maxValue.value;
  }
  return 5;
});

const yAxisLabels = computed(() => {
  const labels = [];
  for (let i = 0; i <= gridLineCount.value; i++) {
    labels.push(Math.round((maxValue.value / gridLineCount.value) * i));
  }
  return labels;
});

function getYAxisLabelY(index) {
  return paddingTop + (chartHeight.value / gridLineCount.value) * (gridLineCount.value - index);
}

function getGridLineY(i) {
  return paddingTop + (chartHeight.value / gridLineCount.value) * (gridLineCount.value - i);
}

function getGridLineValue(i) {
  return Math.round((maxValue.value / gridLineCount.value) * i);
}

const barWidth = computed(() => {
  const count = props.data.length || 1;
  const totalGap = barGap * (count + 1);
  return Math.max(30, (chartWidth.value - totalGap) / count);
});

function getBarX(index) {
  return paddingLeft + barGap + index * (barWidth.value + barGap);
}

function getBarY(value) {
  const height = (value / maxValue.value) * chartHeight.value;
  return paddingTop + chartHeight.value - height;
}

function getBarHeight(value) {
  return (value / maxValue.value) * chartHeight.value;
}
</script>

<style scoped>
.bar-chart {
  width: 100%;
  overflow-x: auto;
}

.bar-rect {
  transition: fill 0.2s;
}

.bar-rect:hover {
  fill: #66b1ff;
}
</style>
