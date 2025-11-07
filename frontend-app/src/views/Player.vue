<template>
  <div class="player-page" :class="{ 'theme-pink': isPinkTheme }">
    <!-- 卡通装饰元素（仅粉色主题显示） -->
    <div class="cartoon-decorations" v-show="isPinkTheme">
      <div class="star star-1">⭐</div>
      <div class="star star-2">✨</div>
      <div class="star star-3">💫</div>
      <div class="heart heart-1">💖</div>
      <div class="heart heart-2">💕</div>
      <div class="heart heart-3">💗</div>
      <div class="sparkle sparkle-1">✨</div>
      <div class="sparkle sparkle-2">✨</div>
      <div class="sparkle sparkle-3">✨</div>
    </div>
    
    <!-- 主题切换按钮 -->
    <div class="theme-switcher">
      <button class="theme-btn" @click="showThemeMenu = !showThemeMenu">
        <svg viewBox="0 0 1024 1024">
          <path fill="currentColor" d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z m0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"/>
          <path fill="currentColor" d="M512 176m-48 0a48 48 0 1 0 96 0 48 48 0 1 0-96 0ZM512 848m-48 0a48 48 0 1 0 96 0 48 48 0 1 0-96 0ZM176 512m-48 0a48 48 0 1 0 96 0 48 48 0 1 0-96 0ZM848 512m-48 0a48 48 0 1 0 96 0 48 48 0 1 0-96 0ZM291.2 291.2m-48 0a48 48 0 1 0 96 0 48 48 0 1 0-96 0ZM732.8 732.8m-48 0a48 48 0 1 0 96 0 48 48 0 1 0-96 0ZM291.2 732.8m-48 0a48 48 0 1 0 96 0 48 48 0 1 0-96 0ZM732.8 291.2m-48 0a48 48 0 1 0 96 0 48 48 0 1 0-96 0Z"/>
        </svg>
      </button>
      <!-- 首次进入提示 -->
      <div v-if="showThemeTip" class="theme-tip">
        <div class="theme-tip-content">
          <span>点击这里可以切换主题哦~</span>
        </div>
      </div>
      <!-- 主题菜单 -->
      <div v-if="showThemeMenu" class="theme-menu" @click.stop>
        <div
          v-for="theme in themeList"
          :key="theme.id"
          class="theme-item"
          :class="{ active: currentTheme === theme.id }"
          @click="switchTheme(theme.id)"
        >
          <div class="theme-color" :style="{ background: theme.colors.background }"></div>
          <span class="theme-name">{{ theme.name }}</span>
          <svg v-if="currentTheme === theme.id" class="check-icon" viewBox="0 0 1024 1024">
            <path fill="currentColor" d="M912 190h-69.9c-9.8 0-19.1 4.5-25.1 12.2L404.7 724.5 207 474a32 32 0 0 0-25.1-12.2H112c-6.7 0-10.4 7.7-6.3 12.9l273.9 347c12.8 16.2 37.4 16.2 50.3 0l488.4-618.9c4.1-5.1.4-12.8-6.3-12.8z"/>
          </svg>
        </div>
      </div>
    </div>
    
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
          <!-- 猫爪形状 - 暂停状态 -->
          <svg v-if="!isPlaying" class="paw-icon" viewBox="0 0 1304 1024" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 446.49054a171.094255 145.438963 90 1 0 290.877927 0 171.094255 145.438963 90 1 0-290.877927 0Z" :fill="pawColor"></path>
            <path d="M1126.923945 768.927392a140.307905 171.094255 12.07 1 0 71.553865-334.6237 140.307905 171.094255 12.07 1 0-71.553865 334.6237Z" :fill="pawColor"></path>
            <path d="M353.069892 190.999222a190.999222 149.508423 90 1 0 299.016847 0 190.999222 149.508423 90 1 0-299.016847 0Z" :fill="pawColor"></path>
            <path d="M887.858242 431.109679a149.508423 190.999222 6.71 1 0 44.634256-379.38186 149.508423 190.999222 6.71 1 0-44.634256 379.38186Z" :fill="pawColor"></path>
            <path d="M962.073434 786.025054c-10.704449 162.07067-167.201728 249.033261-352.36216 236.736415s-328.918531-118.899006-318.479481-281.058143 173.305918-264.957235 354.662289-271.415291c187.549028 37.686739 326.883801 153.577883 316.179352 315.737019z" :fill="pawColor"></path>
          </svg>
          <!-- 猫爪形状 - 播放状态（稍微放大） -->
          <svg v-else class="paw-icon playing" viewBox="0 0 1304 1024" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 446.49054a171.094255 145.438963 90 1 0 290.877927 0 171.094255 145.438963 90 1 0-290.877927 0Z" :fill="pawColor"></path>
            <path d="M1126.923945 768.927392a140.307905 171.094255 12.07 1 0 71.553865-334.6237 140.307905 171.094255 12.07 1 0-71.553865 334.6237Z" :fill="pawColor"></path>
            <path d="M353.069892 190.999222a190.999222 149.508423 90 1 0 299.016847 0 190.999222 149.508423 90 1 0-299.016847 0Z" :fill="pawColor"></path>
            <path d="M887.858242 431.109679a149.508423 190.999222 6.71 1 0 44.634256-379.38186 149.508423 190.999222 6.71 1 0-44.634256 379.38186Z" :fill="pawColor"></path>
            <path d="M962.073434 786.025054c-10.704449 162.07067-167.201728 249.033261-352.36216 236.736415s-328.918531-118.899006-318.479481-281.058143 173.305918-264.957235 354.662289-271.415291c187.549028 37.686739 326.883801 153.577883 316.179352 315.737019z" :fill="pawColor"></path>
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
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { useThemeStore, themes } from '@/stores/theme'

const playerStore = usePlayerStore()
const themeStore = useThemeStore()

const showThemeMenu = ref(false)
const currentTheme = computed(() => themeStore.currentTheme)
const themeList = computed(() => Object.values(themes))
const isPinkTheme = computed(() => currentTheme.value === 'pink')
const showThemeTip = ref(false)

// 根据主题获取猫爪颜色
const pawColor = computed(() => {
  const theme = themeStore.getTheme()
  return theme.colors.primary
})

function switchTheme(themeId) {
  themeStore.setTheme(themeId)
  showThemeMenu.value = false
  // 如果用户切换了主题，隐藏提示并标记已显示
  if (showThemeTip.value) {
    hideThemeTip()
  }
}

// 检查是否首次进入
function checkFirstVisit() {
  const tipShown = localStorage.getItem('themeTipShown')
  if (!tipShown) {
    showThemeTip.value = true
    // 3秒后自动隐藏
    setTimeout(() => {
      hideThemeTip()
    }, 3000)
  }
}

// 隐藏提示并标记已显示
function hideThemeTip() {
  showThemeTip.value = false
  localStorage.setItem('themeTipShown', 'true')
}

// 点击外部关闭菜单
function handleClickOutside(event) {
  if (!event.target.closest('.theme-switcher')) {
    showThemeMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  // 检查是否首次进入，显示主题切换提示
  checkFirstVisit()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

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
  height: calc(100vh - 60px);
  height: calc(100dvh - 60px); /* 动态视口高度，移动端更准确 */
  width: 100%;
  padding: 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
  position: relative;
  background: var(--theme-background);
  background-attachment: fixed;
}

.player-container {
  position: relative;
  z-index: 1;
}

/* 主题切换器 */
.theme-switcher {
  position: absolute;
  top: 15px;
  right: 15px;
  z-index: 100;
}

.theme-btn {
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
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.theme-btn:active {
  transform: scale(0.95);
  background: var(--theme-card-bg-hover);
}

@media (hover: hover) {
  .theme-btn:hover {
    background: var(--theme-card-bg-hover);
    transform: scale(1.05);
  }
}

.theme-btn svg {
  width: 20px;
  height: 20px;
}

/* 首次进入提示 */
.theme-tip {
  position: absolute;
  top: 50px;
  right: 0;
  z-index: 101;
  animation: fadeInDown 0.3s ease-out;
}

.theme-tip-content {
  background: var(--theme-card-bg);
  backdrop-filter: blur(20px);
  border-radius: 8px;
  padding: 8px 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
  position: relative;
}

.theme-tip-content::before {
  content: '';
  position: absolute;
  top: -6px;
  right: 20px;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid var(--theme-card-bg);
  filter: drop-shadow(0 -2px 2px rgba(0, 0, 0, 0.1));
}

.theme-tip-content span {
  font-size: 12px;
  color: var(--theme-text);
  font-weight: 500;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.theme-menu {
  position: absolute;
  top: 50px;
  right: 0;
  background: var(--theme-card-bg);
  backdrop-filter: blur(20px);
  border-radius: 12px;
  padding: 8px;
  min-width: 140px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  animation: slideDown 0.2s ease-out;
  z-index: 102;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.theme-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--theme-text);
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.theme-item:active {
  background: var(--theme-card-bg-hover);
}

@media (hover: hover) {
  .theme-item:hover {
    background: var(--theme-card-bg-hover);
  }
}

.theme-item.active {
  background: var(--theme-card-bg-hover);
}

.theme-color {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.theme-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
}

.check-icon {
  width: 16px;
  height: 16px;
  color: var(--theme-primary);
  flex-shrink: 0;
}

.player-container {
  width: 100%;
  height: 100%;
  max-width: 100%;
  margin: 0;
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0; /* 重要：允许 flex 子元素缩小 */
  overflow: hidden;
}

.cover-wrapper {
  display: flex;
  justify-content: center;
  margin: 10px 0;
  flex-shrink: 0;
}

.cover {
  width: 60vw;
  max-width: 280px;
  height: 60vw;
  max-height: 280px;
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--theme-card-bg);
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
  width: 70%;
  height: 70%;
  max-width: 200px;
  max-height: 200px;
}

.cover-image svg {
  width: 100%;
  height: 100%;
}

.song-info {
  text-align: center;
  margin: 10px 0;
  padding: 0 20px;
  color: var(--theme-text);
  flex-shrink: 0;
}

.song-title {
  font-size: clamp(18px, 5vw, 24px);
  font-weight: 600;
  margin-bottom: 8px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  word-break: break-word;
}

.song-artist {
  font-size: clamp(14px, 4vw, 16px);
  opacity: 0.9;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  word-break: break-word;
}

.lyrics-container {
  flex: 1;
  margin: 10px 0;
  padding: 15px;
  background: var(--theme-card-bg);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  color: var(--theme-text);
  text-align: center;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0; /* 重要：允许 flex 子元素缩小 */
  -webkit-overflow-scrolling: touch;
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
  gap: 8px;
  margin: 10px 0;
  padding: 0 10px;
  color: var(--theme-text);
  flex-shrink: 0;
}

.time {
  font-size: 11px;
  min-width: 40px;
  text-align: center;
  opacity: 0.9;
  flex-shrink: 0;
}

.progress-bar {
  flex: 1;
  cursor: pointer;
  padding: 12px 0;
  touch-action: none;
  -webkit-tap-highlight-color: transparent;
}

.progress-bg {
  position: relative;
  height: 4px;
  background: var(--theme-progress-bg);
  border-radius: 2px;
  overflow: visible;
}

.progress-active {
  height: 100%;
  background: var(--theme-progress-active);
  border-radius: 2px;
  transition: width 0.1s;
}

.progress-dot {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: var(--theme-progress-active);
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(20px, 8vw, 30px);
  margin: 10px 0;
  padding: 0 10px;
  flex-shrink: 0;
}

.control-btn {
  width: clamp(44px, 12vw, 50px);
  height: clamp(44px, 12vw, 50px);
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
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.control-btn:active:not(:disabled) {
  background: var(--theme-card-bg-hover);
  transform: scale(0.95);
}

@media (hover: hover) {
.control-btn:hover:not(:disabled) {
    background: var(--theme-card-bg-hover);
  transform: scale(1.1);
  }
}

.control-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.control-btn svg {
  width: clamp(20px, 6vw, 24px);
  height: clamp(20px, 6vw, 24px);
  fill: currentColor;
}

.play-btn {
  width: clamp(60px, 16vw, 70px);
  height: clamp(60px, 16vw, 70px);
}

.paw-icon {
  width: clamp(117px, 32vw, 137px);
  height: clamp(90px, 26vw, 106px);
  transition: transform 0.3s ease;
  display: block;
}

.paw-icon.playing {
  transform: scale(1.05);
}

.play-btn:active .paw-icon {
  transform: scale(0.9);
}

.paw-icon.playing:active {
  transform: scale(0.95);
}

@media (hover: hover) {
  .play-btn:hover .paw-icon {
    transform: scale(1.1);
  }
  
  .play-btn:hover .paw-icon.playing {
    transform: scale(1.15);
  }
}

/* 移动端优化 */
@media (max-width: 768px) {
  .player-container {
    padding: 15px;
  }
  
  .cover-wrapper {
    margin: 8px 0;
  }
  
  .song-info {
    margin: 8px 0;
  }
  
  .lyrics-container {
    margin: 8px 0;
    padding: 12px;
  }
  
  .progress-section {
    margin: 8px 0;
    gap: 6px;
  }
  
  .controls {
    margin: 8px 0;
    gap: 20px;
  }
  
  .theme-btn {
    width: 36px;
    height: 36px;
  }
  
  .theme-btn svg {
    width: 18px;
    height: 18px;
  }
}

/* 小屏幕手机优化 */
@media (max-width: 480px) {
  .player-container {
    padding: 10px;
  }
  
  .cover-wrapper {
    margin: 5px 0;
  }
  
  .song-info {
    margin: 5px 0;
  }
  
  .lyrics-container {
    margin: 5px 0;
    padding: 10px;
  }
  
  .progress-section {
    margin: 5px 0;
  }
  
  .controls {
    margin: 5px 0;
    gap: 15px;
  }
  
  .theme-btn {
    width: 32px;
    height: 32px;
    top: 10px;
    right: 10px;
  }
  
  .theme-btn svg {
    width: 16px;
    height: 16px;
  }
}

/* 粉色主题卡通装饰 */
.cartoon-decorations {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.star,
.heart,
.sparkle {
  position: absolute;
  font-size: 24px;
  animation: float 6s ease-in-out infinite;
  filter: drop-shadow(0 2px 4px rgba(255, 255, 255, 0.3));
}

.star-1 {
  top: 10%;
  left: 10%;
  animation-delay: 0s;
  animation-duration: 5s;
}

.star-2 {
  top: 20%;
  right: 15%;
  animation-delay: 1s;
  animation-duration: 6s;
}

.star-3 {
  bottom: 30%;
  left: 8%;
  animation-delay: 2s;
  animation-duration: 7s;
}

.heart-1 {
  top: 15%;
  right: 20%;
  animation-delay: 0.5s;
  animation-duration: 5.5s;
  font-size: 20px;
}

.heart-2 {
  bottom: 25%;
  right: 10%;
  animation-delay: 1.5s;
  animation-duration: 6.5s;
  font-size: 18px;
}

.heart-3 {
  top: 50%;
  left: 5%;
  animation-delay: 2.5s;
  animation-duration: 5.5s;
  font-size: 22px;
}

.sparkle-1 {
  top: 30%;
  left: 20%;
  animation-delay: 0.3s;
  animation-duration: 4s;
  font-size: 16px;
}

.sparkle-2 {
  bottom: 40%;
  right: 25%;
  animation-delay: 1.3s;
  animation-duration: 4.5s;
  font-size: 14px;
}

.sparkle-3 {
  top: 60%;
  right: 5%;
  animation-delay: 2.3s;
  animation-duration: 5s;
  font-size: 18px;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg) scale(1);
    opacity: 0.7;
  }
  25% {
    transform: translateY(-20px) rotate(5deg) scale(1.1);
    opacity: 1;
  }
  50% {
    transform: translateY(-10px) rotate(-5deg) scale(0.9);
    opacity: 0.8;
  }
  75% {
    transform: translateY(-25px) rotate(3deg) scale(1.05);
    opacity: 0.9;
  }
}

/* 移动端调整卡通元素大小 */
@media (max-width: 768px) {
  .star,
  .heart,
  .sparkle {
    font-size: 20px;
  }
  
  .heart-1,
  .heart-2,
  .heart-3 {
    font-size: 16px;
  }
  
  .sparkle-1,
  .sparkle-2,
  .sparkle-3 {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .star,
  .heart,
  .sparkle {
    font-size: 16px;
  }
  
  .heart-1,
  .heart-2,
  .heart-3 {
    font-size: 14px;
  }
  
  .sparkle-1,
  .sparkle-2,
  .sparkle-3 {
    font-size: 12px;
  }
}
</style>

