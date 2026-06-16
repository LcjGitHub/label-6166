import { defineStore } from 'pinia';
import { ref } from 'vue';
import { fetchStatisticsByRegion } from '../api/festival';

export const useStatisticsStore = defineStore('statistics', () => {
  const regionStats = ref([]);
  const total = ref(0);
  const loading = ref(false);

  async function loadRegionStats() {
    loading.value = true;
    try {
      const { data } = await fetchStatisticsByRegion();
      regionStats.value = data.regions;
      total.value = data.total;
    } finally {
      loading.value = false;
    }
  }

  return {
    regionStats,
    total,
    loading,
    loadRegionStats,
  };
});
