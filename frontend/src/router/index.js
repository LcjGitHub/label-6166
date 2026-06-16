import { createRouter, createWebHistory } from 'vue-router';
import FestivalList from '../views/FestivalList.vue';
import FavoriteList from '../views/FavoriteList.vue';
import Statistics from '../views/Statistics.vue';

const routes = [
  { path: '/', name: 'FestivalList', component: FestivalList },
  { path: '/favorites', name: 'FavoriteList', component: FavoriteList },
  { path: '/statistics', name: 'Statistics', component: Statistics },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
