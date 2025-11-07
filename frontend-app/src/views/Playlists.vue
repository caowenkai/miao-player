<template>
  <div class="playlists-page">
    <h1 class="page-title">歌单列表</h1>
    
    <div v-if="loading" class="loading">加载中...</div>
    
    <div v-else-if="playlists.length === 0" class="empty">
      暂无歌单
    </div>
    
    <div v-else class="playlists-grid">
      <div
        v-for="playlist in playlists"
        :key="playlist.id"
        class="playlist-card"
        @click="goToPlaylist(playlist.id)"
      >
        <div class="playlist-cover">
          <svg viewBox="0 0 1024 1024">
            <path fill="currentColor" d="M928 160H96c-17.7 0-32 14.3-32 32v640c0 17.7 14.3 32 32 32h832c17.7 0 32-14.3 32-32V192c0-17.7-14.3-32-32-32z m-40 632H136V232h752v560z"/>
            <path fill="currentColor" d="M610 304h144c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H610c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8z m0 236h144c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H610c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8z m0 236h144c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H610c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8z"/>
          </svg>
        </div>
        <div class="playlist-info">
          <h3 class="playlist-name">{{ playlist.name }}</h3>
          <p class="playlist-count">{{ playlist.song_count }} 首歌曲</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { playlistsApi } from '@/api'

const router = useRouter()
const playlists = ref([])
const loading = ref(true)

async function loadPlaylists() {
  try {
    loading.value = true
    const res = await playlistsApi.getList()
    if (res.success) {
      playlists.value = res.data
    }
  } catch (error) {
    console.error('加载歌单失败:', error)
  } finally {
    loading.value = false
  }
}

function goToPlaylist(id) {
  router.push(`/playlist/${id}`)
}

onMounted(() => {
  loadPlaylists()
})
</script>

<style scoped>
.playlists-page {
  padding: 20px;
  padding-bottom: 80px; /* 为底部 tab 留出空间 */
  min-height: 100vh;
  width: 100%;
  box-sizing: border-box;
}

.page-title {
  color: var(--theme-text);
  font-size: clamp(22px, 6vw, 28px);
  font-weight: 600;
  margin-bottom: 24px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.loading,
.empty {
  text-align: center;
  color: var(--theme-text);
  padding: 60px 20px;
  font-size: 16px;
  opacity: 0.8;
}

.playlists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}

.playlist-card {
  background: var(--theme-card-bg);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.playlist-card:active {
  background: var(--theme-card-bg-hover);
  transform: scale(0.98);
}

@media (hover: hover) {
  .playlist-card:hover {
    background: var(--theme-card-bg-hover);
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }
}

.playlist-cover {
  width: 100%;
  aspect-ratio: 1;
  background: var(--theme-card-bg);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  color: var(--theme-text);
}

.playlist-cover svg {
  width: 60%;
  height: 60%;
}

.playlist-info {
  color: var(--theme-text);
}

.playlist-name {
  font-size: clamp(14px, 4vw, 16px);
  font-weight: 500;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.playlist-count {
  font-size: clamp(12px, 3.5vw, 13px);
  opacity: 0.8;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .playlists-page {
    padding: 15px;
    padding-bottom: 80px;
  }
  
  .playlists-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
  }
  
  .playlist-card {
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .playlists-page {
    padding: 10px;
    padding-bottom: 80px;
  }
  
  .playlists-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  
  .playlist-card {
    padding: 10px;
  }
}
</style>

