<template>
  <div class="layout">
    <div class="content">
      <router-view />
    </div>
    
    <div class="tab-bar">
      <div 
        class="tab-item"
        :class="{ active: currentTab === 'player' }"
        @click="switchTab('player')"
      >
        <svg class="icon" viewBox="0 0 1024 1024">
          <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z m0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"/>
          <path d="M719.4 499.1l-296.1-215A15.9 15.9 0 0 0 398 297v430c0 13.1 14.8 20.5 25.3 12.9l296.1-215a15.9 15.9 0 0 0 0-25.8z"/>
        </svg>
        <span>播放器</span>
      </div>
      <div 
        class="tab-item"
        :class="{ active: currentTab === 'playlists' }"
        @click="switchTab('playlists')"
      >
        <svg class="icon" viewBox="0 0 1024 1024">
          <path d="M928 160H96c-17.7 0-32 14.3-32 32v640c0 17.7 14.3 32 32 32h832c17.7 0 32-14.3 32-32V192c0-17.7-14.3-32-32-32z m-40 632H136V232h752v560z"/>
          <path d="M610 304h144c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H610c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8z m0 236h144c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H610c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8z m0 236h144c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H610c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8z m-254-488c0 22.1-17.9 40-40 40s-40-17.9-40-40 17.9-40 40-40 40 17.9 40 40z m0 236c0 22.1-17.9 40-40 40s-40-17.9-40-40 17.9-40 40-40 40 17.9 40 40z m0 236c0 22.1-17.9 40-40 40s-40-17.9-40-40 17.9-40 40-40 40 17.9 40 40z"/>
        </svg>
        <span>歌单</span>
      </div>
    </div>

    <!-- 全局音频播放器 - 始终存在，不会因为切换页面而卸载 -->
    <audio
      ref="audioRef"
      @timeupdate="handleTimeUpdate"
      @loadedmetadata="handleLoadedMetadata"
      @ended="handleEnded"
    ></audio>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePlayerStore } from '@/stores/player'
import { getAudioUrl } from '@/api'

const router = useRouter()
const route = useRoute()
const playerStore = usePlayerStore()
const audioRef = ref(null)

const currentTab = computed(() => {
  return route.name === 'Player' ? 'player' : 'playlists'
})

const currentSong = computed(() => playerStore.currentSong)
const isPlaying = computed(() => playerStore.isPlaying)

function switchTab(tab) {
  router.push(`/${tab}`)
}

// 监听播放状态
watch(isPlaying, async (playing) => {
  if (!audioRef.value) return
  try {
    if (playing) {
      await audioRef.value.play()
    } else {
      audioRef.value.pause()
    }
  } catch (error) {
    console.error('播放控制失败:', error)
    if (playing) {
      playerStore.pause()
    }
  }
})

// 监听当前歌曲
watch(currentSong, async (song) => {
  if (!song || !audioRef.value) return
  audioRef.value.src = getAudioUrl(song.file_path)
  if (isPlaying.value) {
    try {
      await audioRef.value.play()
    } catch (error) {
      console.error('播放失败:', error)
      playerStore.pause()
    }
  }
})

function handleTimeUpdate() {
  if (audioRef.value) {
    playerStore.updateTime(audioRef.value.currentTime)
  }
}

function handleLoadedMetadata() {
  if (audioRef.value) {
    playerStore.updateDuration(audioRef.value.duration)
  }
}

function handleEnded() {
  playerStore.next()
}

// 初始化
onMounted(async () => {
  playerStore.setAudioElement(audioRef.value)
  
  // 如果当前没有歌曲，自动加载歌曲
  if (!currentSong.value) {
    try {
      const { playlistsApi, songsApi } = await import('@/api')
      
      // 先尝试加载第一个歌单的歌曲
      const playlistRes = await playlistsApi.getList()
      if (playlistRes.success && playlistRes.data.length > 0) {
        const firstPlaylist = playlistRes.data[0]
        const detailRes = await playlistsApi.getDetail(firstPlaylist.id)
        if (detailRes.success && detailRes.data.songs && detailRes.data.songs.length > 0) {
          playerStore.setPlaylist(detailRes.data.songs)
          playerStore.playSong(detailRes.data.songs[0])
          playerStore.pause()
          return
        }
      }
      
      // 如果没有歌单或歌单为空，加载所有歌曲
      const songsRes = await songsApi.getList({ page: 1, limit: 100 })
      if (songsRes.success && songsRes.data.songs && songsRes.data.songs.length > 0) {
        playerStore.setPlaylist(songsRes.data.songs)
        playerStore.playSong(songsRes.data.songs[0])
        playerStore.pause()
      }
    } catch (error) {
      console.error('自动加载歌曲失败:', error)
    }
  }
})
</script>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 70px;
}

.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: space-around;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 8px 20px;
  color: #999;
  transition: all 0.3s;
}

.tab-item.active {
  color: #667eea;
}

.icon {
  width: 24px;
  height: 24px;
  fill: currentColor;
  margin-bottom: 4px;
}

.tab-item span {
  font-size: 12px;
}
</style>

