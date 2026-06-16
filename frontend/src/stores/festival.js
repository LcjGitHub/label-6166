import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  fetchFestivals,
  fetchRegions,
  fetchTags,
  fetchFestivalById,
  createFestival,
  updateFestival,
  deleteFestival,
} from '../api/festival';

export const useFestivalStore = defineStore('festival', () => {
  const festivals = ref([]);
  const regions = ref([]);
  const tags = ref([]);
  const currentFestival = ref(null);
  const loading = ref(false);
  const selectedRegion = ref('');
  const selectedTag = ref('');
  const keyword = ref('');

  /**
   * 加载地区列表
   */
  async function loadRegions() {
    const { data } = await fetchRegions();
    regions.value = data;
  }

  /**
   * 加载标签列表
   */
  async function loadTags() {
    const { data } = await fetchTags();
    tags.value = data;
  }

  /**
   * 加载节日列表
   */
  async function loadFestivals() {
    loading.value = true;
    try {
      const params = {};
      if (selectedRegion.value) {
        params.region = selectedRegion.value;
      }
      if (selectedTag.value) {
        params.tag = selectedTag.value;
      }
      if (keyword.value) {
        params.keyword = keyword.value;
      }
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
    await loadFestivals();
  }

  /**
   * 设置标签筛选并刷新列表
   * @param {string} tag
   */
  async function filterByTag(tag) {
    selectedTag.value = tag;
    await loadFestivals();
  }

  async function searchByKeyword(kw) {
    keyword.value = kw;
    await loadFestivals();
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
    await loadTags();
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
    await loadTags();
    await loadFestivals();
  }

  /**
   * 删除节日
   * @param {number} id
   */
  async function removeFestival(id) {
    await deleteFestival(id);
    await loadRegions();
    await loadTags();
    await loadFestivals();
  }

  return {
    festivals,
    regions,
    tags,
    currentFestival,
    loading,
    selectedRegion,
    selectedTag,
    keyword,
    loadRegions,
    loadTags,
    loadFestivals,
    filterByRegion,
    filterByTag,
    searchByKeyword,
    loadFestivalDetail,
    addFestival,
    editFestival,
    removeFestival,
  };
});
