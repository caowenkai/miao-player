<template>
  <el-container class="layout-container">
    <el-aside width="200px" class="sidebar">
      <div class="logo">
        <h2>🎵 喵音乐</h2>
        <p>后台管理系统</p>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        class="menu"
      >
        <el-menu-item index="/songs">
          <el-icon><Upload /></el-icon>
          <span>音乐管理</span>
        </el-menu-item>
        <el-menu-item index="/playlists">
          <el-icon><List /></el-icon>
          <span>歌单管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <h3>{{ currentTitle }}</h3>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Upload, List } from '@element-plus/icons-vue'

const route = useRoute()

const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta.title || '')
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background: #001529;
  color: white;
}

.logo {
  padding: 24px 16px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo h2 {
  font-size: 20px;
  margin-bottom: 4px;
}

.logo p {
  font-size: 12px;
  opacity: 0.7;
}

.menu {
  border-right: none;
  background: transparent;
}

.header {
  background: white;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  padding: 0 24px;
}

.header h3 {
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.main {
  background: #f0f2f5;
  padding: 24px;
}
</style>

