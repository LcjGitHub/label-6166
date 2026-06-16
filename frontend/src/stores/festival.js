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
  const page = ref(1);
  const pageSize = ref(10);
  const total = ref(0);

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
      const params = {
        page: page.value,
        pageSize: pageSize.value,
      };
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
      festivals.value = data.data;
      total.value = data.total;
      page.value = data.page;
      pageSize.value = data.pageSize;
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
    page.value = 1;
    await loadFestivals();
  }

  /**
   * 设置标签筛选并刷新列表
   * @param {string} tag
   */
  async function filterByTag(tag) {
    selectedTag.value = tag;
    page.value = 1;
    await loadFestivals();
  }

  async function searchByKeyword(kw) {
    keyword.value = kw;
    page.value = 1;
    await loadFestivals();
  }

  /**
   * 设置页码并刷新列表
   * @param {number} p
   */
  async function setPage(p) {
    page.value = p;
    await loadFestivals();
  }

  /**
   * 设置每页条数并刷新列表
   * @param {number} size
   */
  async function setPageSize(size) {
    pageSize.value = size;
    page.value = 1;
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
    page.value = 1;
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
    page.value = 1;
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
    page,
    pageSize,
    total,
    loadRegions,
    loadTags,
    loadFestivals,
    filterByRegion,
    filterByTag,
    searchByKeyword,
    setPage,
    setPageSize,
    loadFestivalDetail,
    addFestival,
    editFestival,
    removeFestival,
  };
});
