import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  fetchFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite,
} from '../api/festival';

export const useFavoriteStore = defineStore('favorite', () => {
  const favorites = ref([]);
  const favoritedIds = ref(new Set());
  const loading = ref(false);

  async function loadFavorites() {
    loading.value = true;
    try {
      const { data } = await fetchFavorites();
      favorites.value = data;
      favoritedIds.value = new Set(data.map((f) => f.id));
    } finally {
      loading.value = false;
    }
  }

  async function toggleFavorite(festivalId) {
    if (favoritedIds.value.has(festivalId)) {
      await removeFavorite(festivalId);
      favoritedIds.value.delete(festivalId);
      favorites.value = favorites.value.filter((f) => f.id !== festivalId);
    } else {
      const { data } = await addFavorite(festivalId);
      favoritedIds.value.add(festivalId);
      favorites.value.unshift(data);
    }
  }

  async function checkFavorited(festivalId) {
    const { data } = await checkFavorite(festivalId);
    if (data.favorited) {
      favoritedIds.value.add(festivalId);
    } else {
      favoritedIds.value.delete(festivalId);
    }
    return data.favorited;
  }

  async function batchCheckFavorited(ids) {
    const results = await Promise.all(ids.map((id) => checkFavorite(id)));
    const newSet = new Set(favoritedIds.value);
    ids.forEach((id, i) => {
      if (results[i].data.favorited) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
    });
    favoritedIds.value = newSet;
  }

  function isFavorited(festivalId) {
    return favoritedIds.value.has(festivalId);
  }

  return {
    favorites,
    favoritedIds,
    loading,
    loadFavorites,
    toggleFavorite,
    checkFavorited,
    batchCheckFavorited,
    isFavorited,
  };
});
