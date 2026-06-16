import { createRouter, createWebHistory } from 'vue-router';
import FestivalList from '../views/FestivalList.vue';
import FavoriteList from '../views/FavoriteList.vue';

const routes = [
  { path: '/', name: 'FestivalList', component: FestivalList },
  { path: '/favorites', name: 'FavoriteList', component: FavoriteList },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
