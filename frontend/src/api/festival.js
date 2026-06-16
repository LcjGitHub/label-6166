import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

/**
 * 获取节日列表
 * @param {{ region?: string }} [params]
 */
export function fetchFestivals(params) {
  return api.get('/festivals', { params });
}

/**
 * 获取地区列表
 */
export function fetchRegions() {
  return api.get('/festivals/regions');
}

/**
 * 获取节日详情
 * @param {number} id
 */
export function fetchFestivalById(id) {
  return api.get(`/festivals/${id}`);
}

/**
 * 新增节日
 * @param {object} data
 */
export function createFestival(data) {
  return api.post('/festivals', data);
}

/**
 * 更新节日
 * @param {number} id
 * @param {object} data
 */
export function updateFestival(id, data) {
  return api.put(`/festivals/${id}`, data);
}

/**
 * 删除节日
 * @param {number} id
 */
export function deleteFestival(id) {
  return api.delete(`/festivals/${id}`);
}

export function fetchFavorites() {
  return api.get('/favorites');
}

export function addFavorite(festivalId) {
  return api.post('/favorites', { festival_id: festivalId });
}

export function removeFavorite(festivalId) {
  return api.delete(`/favorites/${festivalId}`);
}

export function checkFavorite(festivalId) {
  return api.get(`/favorites/check/${festivalId}`);
}
