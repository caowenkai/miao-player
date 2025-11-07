import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePlayerStore = defineStore('player', () => {
  // 状态
  const currentSong = ref(null)
  const playlist = ref([])
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(1)
  const playMode = ref('list') // list: 列表循环, single: 单曲循环, random: 随机
  const audioElement = ref(null)

  // 计算属性
  const currentIndex = computed(() => {
    if (!currentSong.value) return -1
    return playlist.value.findIndex(song => song.id === currentSong.value.id)
  })

  const hasNext = computed(() => {
    return playlist.value.length > 0 && currentIndex.value < playlist.value.length - 1
  })

  const hasPrev = computed(() => {
    return playlist.value.length > 0 && currentIndex.value > 0
  })

  const progress = computed(() => {
    if (duration.value === 0) return 0
    return (currentTime.value / duration.value) * 100
  })

  // 方法
  function setAudioElement(audio) {
    audioElement.value = audio
  }

  function setPlaylist(songs) {
    playlist.value = songs
  }

  function playSong(song) {
    currentSong.value = song
    isPlaying.value = true
    currentTime.value = 0
  }

  function play() {
    isPlaying.value = true
  }

  function pause() {
    isPlaying.value = false
  }

  function togglePlay() {
    isPlaying.value = !isPlaying.value
  }

  function next() {
    if (playMode.value === 'random') {
      const randomIndex = Math.floor(Math.random() * playlist.value.length)
      playSong(playlist.value[randomIndex])
    } else if (hasNext.value) {
      playSong(playlist.value[currentIndex.value + 1])
    } else if (playMode.value === 'list') {
      playSong(playlist.value[0])
    }
  }

  function prev() {
    if (hasPrev.value) {
      playSong(playlist.value[currentIndex.value - 1])
    }
  }

  function seek(time) {
    currentTime.value = time
    if (audioElement.value) {
      audioElement.value.currentTime = time
    }
  }

  function setVolume(vol) {
    volume.value = vol
    if (audioElement.value) {
      audioElement.value.volume = vol
    }
  }

  function setPlayMode(mode) {
    playMode.value = mode
  }

  function updateTime(time) {
    currentTime.value = time
  }

  function updateDuration(dur) {
    duration.value = dur
  }

  return {
    // 状态
    currentSong,
    playlist,
    isPlaying,
    currentTime,
    duration,
    volume,
    playMode,
    audioElement,
    // 计算属性
    currentIndex,
    hasNext,
    hasPrev,
    progress,
    // 方法
    setAudioElement,
    setPlaylist,
    playSong,
    play,
    pause,
    togglePlay,
    next,
    prev,
    seek,
    setVolume,
    setPlayMode,
    updateTime,
    updateDuration
  }
})

