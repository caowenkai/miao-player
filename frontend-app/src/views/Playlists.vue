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
  min-height: 100vh;
}

.page-title {
  color: white;
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 24px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.loading,
.empty {
  text-align: center;
  color: white;
  padding: 60px 20px;
  font-size: 16px;
  opacity: 0.8;
}

.playlists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

.playlist-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.playlist-card:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.playlist-cover {
  width: 100%;
  aspect-ratio: 1;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  color: white;
}

.playlist-cover svg {
  width: 60%;
  height: 60%;
}

.playlist-info {
  color: white;
}

.playlist-name {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.playlist-count {
  font-size: 13px;
  opacity: 0.8;
}
</style>

