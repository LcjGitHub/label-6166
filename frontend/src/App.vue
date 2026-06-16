<template>
  <div class="app">
    <header class="app-header">
      <div class="header-top">
        <h1>地方民俗节日日历</h1>
        <nav class="header-nav">
          <router-link to="/" class="nav-link" active-class="nav-active" :class="{ 'nav-active': $route.path === '/' }">节日列表</router-link>
          <router-link to="/favorites" class="nav-link" active-class="nav-active">我的收藏</router-link>
          <router-link to="/statistics" class="nav-link" active-class="nav-active">统计概览</router-link>
        </nav>
      </div>
      <p class="subtitle">浏览各地传统节日，了解日期说明与民俗习俗</p>
    </header>
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
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
  padding: 20px 24px 16px;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.app-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
}

.header-nav {
  display: flex;
  gap: 8px;
}

.nav-link {
  display: inline-block;
  padding: 6px 18px;
  border-radius: 20px;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.15);
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
}

.nav-active {
  background: rgba(255, 255, 255, 0.3);
  color: #fff;
}

.subtitle {
  margin: 8px 0 0;
  opacity: 0.9;
  font-size: 14px;
}

.app-main {
  max-width: 1100px;
  margin: 24px auto;
  padding: 0 16px 40px;
}
</style>
