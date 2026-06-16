import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  fetchFestivals,
  fetchRegions,
  fetchFestivalById,
  createFestival,
  updateFestival,
  deleteFestival,
} from '../api/festival';

export const useFestivalStore = defineStore('festival', () => {
  const festivals = ref([]);
  const regions = ref([]);
  const currentFestival = ref(null);
  const loading = ref(false);
  const selectedRegion = ref('');

  /**
   * 加载地区列表
   */
  async function loadRegions() {
    const { data } = await fetchRegions();
    regions.value = data;
  }

  /**
   * 加载节日列表
   * @param {string} [region]
   */
  async function loadFestivals(region = selectedRegion.value) {
    loading.value = true;
    try {
      const params = region ? { region } : {};
      const { data } = await fetchFestivals(params);
      festivals.value = data;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 设置地区筛选并刷新列表
   * @param {string} region
   */
  async function filterByRegion(region) {
    selectedRegion.value = region;
    await loadFestivals(region);
  }

  /**
   * 加载节日详情
   * @param {number} id
   */
  async function loadFestivalDetail(id) {
    const { data } = await fetchFestivalById(id);
    currentFestival.value = data;
    return data;
  }

  /**
   * 新增节日
   * @param {object} payload
   */
  async function addFestival(payload) {
    await createFestival(payload);
    await loadRegions();
    await loadFestivals();
  }

  /**
   * 更新节日
   * @param {number} id
   * @param {object} payload
   */
  async function editFestival(id, payload) {
    await updateFestival(id, payload);
    await loadRegions();
    await loadFestivals();
  }

  /**
   * 删除节日
   * @param {number} id
   */
  async function removeFestival(id) {
    await deleteFestival(id);
    await loadRegions();
    await loadFestivals();
  }

  return {
    festivals,
    regions,
    currentFestival,
    loading,
    selectedRegion,
    loadRegions,
    loadFestivals,
    filterByRegion,
    loadFestivalDetail,
    addFestival,
    editFestival,
    removeFestival,
  };
});
