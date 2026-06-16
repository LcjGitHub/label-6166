import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  fetchFavorites,
  fetchFavoriteIds,
  addFavorite,
  removeFavorite,
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

  async function loadFavoritedIds() {
    const { data } = await fetchFavoriteIds();
    favoritedIds.value = new Set(data);
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

  function removeFestivalFromCache(festivalId) {
    favoritedIds.value.delete(festivalId);
    favorites.value = favorites.value.filter((f) => f.id !== festivalId);
  }

  function isFavorited(festivalId) {
    return favoritedIds.value.has(festivalId);
  }

  return {
    favorites,
    favoritedIds,
    loading,
    loadFavorites,
    loadFavoritedIds,
    toggleFavorite,
    removeFestivalFromCache,
    isFavorited,
  };
});
