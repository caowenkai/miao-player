<template>
  <div class="playlist-detail-page">
    <div class="header">
      <button class="back-btn" @click="goBack">
        <svg viewBox="0 0 1024 1024">
          <path fill="currentColor" d="M724 218.3V141c0-6.7-7.7-10.4-12.9-6.3L260.3 486.8a31.86 31.86 0 0 0 0 50.3l450.8 352.1c5.3 4.1 12.9.4 12.9-6.3v-77.3c0-4.9-2.3-9.6-6.1-12.6l-360-281 360-281.1c3.8-3 6.1-7.7 6.1-12.6z"/>
        </svg>
      </button>
      <h1 class="page-title">{{ playlist?.name || '歌单详情' }}</h1>
    </div>

    <div v-if="playlist?.description" class="playlist-desc">
      {{ playlist.description }}
    </div>

    <div class="playlist-actions">
      <button class="action-btn play-all" @click="playAll">
        <svg viewBox="0 0 1024 1024">
          <path fill="currentColor" d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z m0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"/>
          <path fill="currentColor" d="M719.4 499.1l-296.1-215A15.9 15.9 0 0 0 398 297v430c0 13.1 14.8 20.5 25.3 12.9l296.1-215a15.9 15.9 0 0 0 0-25.8z"/>
        </svg>
        播放全部
      </button>
      <span class="song-count">共 {{ songs.length }} 首</span>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="songs.length === 0" class="empty">
      该歌单暂无歌曲
    </div>

    <div v-else class="song-list">
      <div
        v-for="(song, index) in songs"
        :key="song.id"
        class="song-item"
        :class="{ active: currentSong?.id === song.id }"
        @click="playSong(song)"
      >
        <div class="song-index">{{ index + 1 }}</div>
        <div class="song-info-wrapper">
          <div class="song-name">{{ song.title }}</div>
          <div class="song-meta">{{ song.artist }} · {{ formatDuration(song.duration) }}</div>
        </div>
        <div v-if="currentSong?.id === song.id && isPlaying" class="playing-icon">
          <div class="bar"></div>
          <div class="bar"></div>
          <div class="bar"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { playlistsApi } from '@/api'
import { usePlayerStore } from '@/stores/player'

const router = useRouter()
const route = useRoute()
const playerStore = usePlayerStore()

const playlist = ref(null)
const songs = ref([])
const loading = ref(true)

const currentSong = computed(() => playerStore.currentSong)
const isPlaying = computed(() => playerStore.isPlaying)

async function loadPlaylistDetail() {
  try {
    loading.value = true
    const res = await playlistsApi.getDetail(route.params.id)
    if (res.success) {
      playlist.value = res.data
      songs.value = res.data.songs || []
    }
  } catch (error) {
    console.error('加载歌单详情失败:', error)
  } finally {
    loading.value = false
  }
}

function playSong(song) {
  playerStore.setPlaylist(songs.value)
  playerStore.playSong(song)
}

function playAll() {
  if (songs.value.length === 0) return
  playerStore.setPlaylist(songs.value)
  playerStore.playSong(songs.value[0])
}

function goBack() {
  router.back()
}

function formatDuration(seconds) {
  if (!seconds) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

onMounted(() => {
  loadPlaylistDetail()
})
</script>

<style scoped>
.playlist-detail-page {
  min-height: 100vh;
  padding: 20px;
  padding-bottom: 80px; /* 为底部 tab 留出空间 */
  color: var(--theme-text);
  width: 100%;
  box-sizing: border-box;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.back-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: var(--theme-card-bg);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  color: var(--theme-text);
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.back-btn:active {
  background: var(--theme-card-bg-hover);
  transform: scale(0.95);
}

@media (hover: hover) {
  .back-btn:hover {
    background: var(--theme-card-bg-hover);
  }
}

.back-btn svg {
  width: 20px;
  height: 20px;
}

.page-title {
  font-size: clamp(20px, 5.5vw, 24px);
  font-weight: 600;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.playlist-desc {
  padding: 12px 16px;
  background: var(--theme-card-bg);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  margin-bottom: 16px;
  opacity: 0.9;
  word-break: break-word;
  line-height: 1.6;
}

.playlist-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 10px 20px;
  border: none;
  background: var(--theme-card-bg-hover);
  color: var(--theme-primary);
  border-radius: 20px;
  font-size: clamp(13px, 3.5vw, 14px);
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  white-space: nowrap;
}

.action-btn:active {
  background: var(--theme-card-bg);
  transform: scale(0.95);
}

@media (hover: hover) {
  .action-btn:hover {
    background: var(--theme-card-bg);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
}

.action-btn svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.song-count {
  opacity: 0.8;
  font-size: clamp(12px, 3.5vw, 14px);
}

.loading,
.empty {
  text-align: center;
  padding: 60px 20px;
  opacity: 0.8;
}

.song-list {
  background: var(--theme-card-bg);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  overflow: hidden;
}

.song-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.3s;
  border-bottom: 1px solid var(--theme-border);
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.song-item:last-child {
  border-bottom: none;
}

.song-item:active {
  background: var(--theme-card-bg-hover);
}

@media (hover: hover) {
  .song-item:hover {
    background: var(--theme-card-bg-hover);
  }
}

.song-item.active {
  background: var(--theme-card-bg-hover);
}

.song-index {
  width: 28px;
  text-align: center;
  font-size: clamp(13px, 3.5vw, 14px);
  opacity: 0.6;
  flex-shrink: 0;
}

.song-info-wrapper {
  flex: 1;
  min-width: 0;
}

.song-name {
  font-size: clamp(14px, 4vw, 15px);
  font-weight: 500;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.song-meta {
  font-size: clamp(12px, 3.5vw, 13px);
  opacity: 0.7;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.playing-icon {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 16px;
  flex-shrink: 0;
}

.bar {
  width: 3px;
  background: white;
  border-radius: 2px;
  animation: wave 1s ease-in-out infinite;
}

.bar:nth-child(1) {
  animation-delay: 0s;
}

.bar:nth-child(2) {
  animation-delay: 0.2s;
}

.bar:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes wave {
  0%, 100% {
    height: 4px;
  }
  50% {
    height: 16px;
  }
}

/* 移动端优化 */
@media (max-width: 768px) {
  .playlist-detail-page {
    padding: 15px;
    padding-bottom: 80px;
  }
  
  .song-item {
    padding: 12px;
    gap: 10px;
  }
}

@media (max-width: 480px) {
  .playlist-detail-page {
    padding: 10px;
    padding-bottom: 80px;
  }
  
  .header {
    gap: 10px;
  }
  
  .back-btn {
    width: 36px;
    height: 36px;
  }
  
  .back-btn svg {
    width: 18px;
    height: 18px;
  }
  
  .playlist-actions {
    gap: 10px;
  }
  
  .action-btn {
    padding: 8px 16px;
  }
  
  .song-item {
    padding: 10px 12px;
    gap: 8px;
  }
  
  .song-index {
    width: 24px;
  }
}
</style>

