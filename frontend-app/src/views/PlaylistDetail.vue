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
  color: white;
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
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.back-btn svg {
  width: 20px;
  height: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.playlist-desc {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  margin-bottom: 16px;
  opacity: 0.9;
}

.playlist-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.action-btn {
  padding: 10px 20px;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  color: #667eea;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
}

.action-btn:hover {
  background: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.action-btn svg {
  width: 18px;
  height: 18px;
}

.song-count {
  opacity: 0.8;
}

.loading,
.empty {
  text-align: center;
  padding: 60px 20px;
  opacity: 0.8;
}

.song-list {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  overflow: hidden;
}

.song-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.song-item:last-child {
  border-bottom: none;
}

.song-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.song-item.active {
  background: rgba(255, 255, 255, 0.15);
}

.song-index {
  width: 30px;
  text-align: center;
  font-size: 14px;
  opacity: 0.6;
}

.song-info-wrapper {
  flex: 1;
  min-width: 0;
}

.song-name {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.song-meta {
  font-size: 13px;
  opacity: 0.7;
}

.playing-icon {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 16px;
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
</style>

