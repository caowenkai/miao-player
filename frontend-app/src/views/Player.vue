<template>
  <div class="player-page">
    <div class="player-container">
      <!-- 封面 -->
      <div class="cover-wrapper">
        <div class="cover" :class="{ rotating: isPlaying }">
          <div class="cover-image">
            <svg viewBox="0 0 1024 1024">
              <path fill="rgba(255,255,255,0.9)" d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z m0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"/>
              <circle cx="512" cy="512" r="80" fill="rgba(255,255,255,0.9)"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- 歌曲信息 -->
      <div class="song-info">
        <h2 class="song-title">{{ currentSong?.title || '暂无播放' }}</h2>
        <p class="song-artist">{{ currentSong?.artist || '未知艺术家' }}</p>
      </div>

      <!-- 歌词区域 -->
      <div class="lyrics-container">
        <div v-if="currentSong?.lyrics" class="lyrics">
          {{ currentSong.lyrics }}
        </div>
        <div v-else class="no-lyrics">
          暂无歌词
        </div>
      </div>

      <!-- 进度条 -->
      <div class="progress-section">
        <div class="time">{{ formatTime(currentTime) }}</div>
        <div class="progress-bar" @click="handleProgressClick">
          <div class="progress-bg">
            <div class="progress-active" :style="{ width: progress + '%' }"></div>
            <div class="progress-dot" :style="{ left: progress + '%' }"></div>
          </div>
        </div>
        <div class="time">{{ formatTime(duration) }}</div>
      </div>

      <!-- 控制按钮 -->
      <div class="controls">
        <button class="control-btn" @click="handlePrev" :disabled="!hasPrev">
          <svg viewBox="0 0 1024 1024">
            <path d="M272.9 512l265.4-339.1c4.1-5.2.4-12.9-6.3-12.9h-77.3c-4.9 0-9.6 2.3-12.6 6.1L186.8 492.3a31.99 31.99 0 0 0 0 39.5l255.3 326.1c3 3.9 7.7 6.1 12.6 6.1H532c6.7 0 10.4-7.7 6.3-12.9L272.9 512z m304 0l265.4-339.1c4.1-5.2.4-12.9-6.3-12.9h-77.3c-4.9 0-9.6 2.3-12.6 6.1L490.8 492.3a31.99 31.99 0 0 0 0 39.5l255.3 326.1c3 3.9 7.7 6.1 12.6 6.1H836c6.7 0 10.4-7.7 6.3-12.9L576.9 512z"/>
          </svg>
        </button>
        
        <button class="control-btn play-btn" @click="togglePlay">
          <svg v-if="!isPlaying" viewBox="0 0 1024 1024">
            <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z m0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"/>
            <path d="M719.4 499.1l-296.1-215A15.9 15.9 0 0 0 398 297v430c0 13.1 14.8 20.5 25.3 12.9l296.1-215a15.9 15.9 0 0 0 0-25.8z"/>
          </svg>
          <svg v-else viewBox="0 0 1024 1024">
            <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z m0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"/>
            <path d="M304 368h80v288h-80z m336 0h80v288h-80z"/>
          </svg>
        </button>
        
        <button class="control-btn" @click="handleNext" :disabled="!hasNext">
          <svg viewBox="0 0 1024 1024">
            <path d="M765.7 486.8L314.9 134.7A7.97 7.97 0 0 0 302 141v77.3c0 4.9 2.3 9.6 6.1 12.6l360 281.1-360 281.1c-3.9 3-6.1 7.7-6.1 12.6V883c0 6.7 7.7 10.4 12.9 6.3l450.8-352.1a31.96 31.96 0 0 0 0-50.4z"/>
            <path d="M765.7 486.8L314.9 134.7A7.97 7.97 0 0 0 302 141v77.3c0 4.9 2.3 9.6 6.1 12.6l360 281.1-360 281.1c-3.9 3-6.1 7.7-6.1 12.6V883c0 6.7 7.7 10.4 12.9 6.3l450.8-352.1a31.96 31.96 0 0 0 0-50.4z" transform="translate(-304 0)"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { usePlayerStore } from '@/stores/player'

const playerStore = usePlayerStore()

// 计算属性
const currentSong = computed(() => playerStore.currentSong)
const isPlaying = computed(() => playerStore.isPlaying)
const currentTime = computed(() => playerStore.currentTime)
const duration = computed(() => playerStore.duration)
const progress = computed(() => playerStore.progress)
const hasNext = computed(() => playerStore.hasNext)
const hasPrev = computed(() => playerStore.hasPrev)

// 方法
function togglePlay() {
  if (!currentSong.value) return
  playerStore.togglePlay()
}

function handleNext() {
  playerStore.next()
}

function handlePrev() {
  playerStore.prev()
}

function handleProgressClick(e) {
  if (!duration.value) return
  const rect = e.currentTarget.getBoundingClientRect()
  const percent = (e.clientX - rect.left) / rect.width
  const time = percent * duration.value
  playerStore.seek(time)
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}
</script>

<style scoped>
.player-page {
  min-height: 100vh;
  padding: 20px;
}

.player-container {
  max-width: 500px;
  margin: 0 auto;
}

.cover-wrapper {
  display: flex;
  justify-content: center;
  margin: 40px 0;
}

.cover {
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s;
}

.cover.rotating {
  animation: rotate 20s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.cover-image {
  width: 200px;
  height: 200px;
}

.cover-image svg {
  width: 100%;
  height: 100%;
}

.song-info {
  text-align: center;
  margin: 30px 0;
  color: white;
}

.song-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.song-artist {
  font-size: 16px;
  opacity: 0.9;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.lyrics-container {
  min-height: 120px;
  margin: 30px 0;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  color: white;
  text-align: center;
  overflow-y: auto;
  max-height: 200px;
}

.lyrics {
  line-height: 1.8;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.no-lyrics {
  opacity: 0.6;
  padding: 40px 0;
}

.progress-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 30px 0;
  color: white;
}

.time {
  font-size: 12px;
  min-width: 45px;
  text-align: center;
  opacity: 0.9;
}

.progress-bar {
  flex: 1;
  cursor: pointer;
  padding: 10px 0;
}

.progress-bg {
  position: relative;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: visible;
}

.progress-active {
  height: 100%;
  background: white;
  border-radius: 2px;
  transition: width 0.1s;
}

.progress-dot {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 30px;
  margin: 40px 0;
}

.control-btn {
  width: 50px;
  height: 50px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  color: white;
}

.control-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.control-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.control-btn svg {
  width: 24px;
  height: 24px;
  fill: currentColor;
}

.play-btn {
  width: 70px;
  height: 70px;
}

.play-btn svg {
  width: 32px;
  height: 32px;
}
</style>

