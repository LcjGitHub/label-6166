<template>
  <div class="app">
    <header class="app-header">
      <h1>地方民俗节日日历</h1>
      <p class="subtitle">浏览各地传统节日，了解日期说明与民俗习俗</p>
    </header>
    <main class="app-main">
      <FestivalList />
    </main>
  </div>
</template>

<script setup>
import FestivalList from './views/FestivalList.vue';
</script>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: #f5f7fa;
  color: #303133;
}

.app-header {
  background: linear-gradient(135deg, #409eff 0%, #337ecc 100%);
  color: #fff;
  padding: 28px 24px;
  text-align: center;
}

.app-header h1 {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 600;
}

.subtitle {
  margin: 0;
  opacity: 0.9;
  font-size: 14px;
}

.app-main {
  max-width: 1100px;
  margin: 24px auto;
  padding: 0 16px 40px;
}
</style>
