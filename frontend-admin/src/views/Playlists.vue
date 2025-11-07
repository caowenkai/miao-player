<template>
  <div class="playlists-page">
    <div class="toolbar">
      <el-button type="primary" @click="showCreateDialog">
        <el-icon><Plus /></el-icon>
        创建歌单
      </el-button>
    </div>

    <el-table
      :data="playlists"
      v-loading="loading"
      style="width: 100%"
      stripe
    >
      <el-table-column type="index" label="#" width="60" />
      <el-table-column prop="name" label="歌单名称" min-width="200" />
      <el-table-column prop="description" label="描述" min-width="300" />
      <el-table-column prop="song_count" label="歌曲数" width="100" />
      <el-table-column prop="created_at" label="创建时间" width="180" />
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="viewPlaylist(row)">
            <el-icon><View /></el-icon>
            查看
          </el-button>
          <el-button link type="primary" @click="editPlaylist(row)">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button link type="primary" @click="manageSongs(row)">
            <el-icon><Plus /></el-icon>
            添加歌曲
          </el-button>
          <el-button link type="danger" @click="deletePlaylist(row)">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 创建/编辑歌单对话框 -->
    <el-dialog
      v-model="formDialogVisible"
      :title="formMode === 'create' ? '创建歌单' : '编辑歌单'"
      width="600px"
    >
      <el-form :model="playlistForm" label-width="80px">
        <el-form-item label="歌单名称" required>
          <el-input v-model="playlistForm.name" placeholder="请输入歌单名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="playlistForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入歌单描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 歌单详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="currentPlaylist?.name"
      width="800px"
    >
      <div v-if="playlistSongs.length === 0" class="empty">
        该歌单暂无歌曲
      </div>
      <el-table v-else :data="playlistSongs" style="width: 100%">
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="title" label="歌曲名称" min-width="180" />
        <el-table-column prop="artist" label="艺术家" width="150" />
        <el-table-column prop="duration" label="时长" width="100">
          <template #default="{ row }">
            {{ formatDuration(row.duration) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button link type="primary" @click="playAudio(row)">
              <el-icon><VideoPlay /></el-icon>
              试听
            </el-button>
            <el-button link type="danger" @click="removeSong(row)">
              <el-icon><Delete /></el-icon>
              移除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 添加歌曲对话框 -->
    <el-dialog
      v-model="addSongsDialogVisible"
      title="添加歌曲到歌单"
      width="900px"
    >
      <div class="search-bar">
        <el-input
          v-model="songSearchText"
          placeholder="搜索歌曲"
          clearable
          @input="handleSongSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      
      <el-table
        ref="songTableRef"
        :data="availableSongs"
        v-loading="songLoading"
        @selection-change="handleSelectionChange"
        style="width: 100%"
        max-height="400"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="title" label="歌曲名称" min-width="180" />
        <el-table-column prop="artist" label="艺术家" width="150" />
        <el-table-column prop="album" label="专辑" width="150" />
        <el-table-column prop="duration" label="时长" width="100">
          <template #default="{ row }">
            {{ formatDuration(row.duration) }}
          </template>
        </el-table-column>
        <el-table-column label="试听" width="80">
          <template #default="{ row }">
            <el-button link type="primary" @click="playAudio(row)">
              <el-icon><VideoPlay /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <template #footer>
        <el-button @click="addSongsDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAddSongs">
          确定添加 (已选 {{ selectedSongs.length }} 首)
        </el-button>
      </template>
    </el-dialog>

    <!-- 音频播放器对话框 -->
    <el-dialog
      v-model="audioDialogVisible"
      :title="currentAudio?.title"
      width="500px"
    >
      <div class="audio-player">
        <audio
          ref="audioPlayerRef"
          :src="currentAudio?.url"
          controls
          style="width: 100%"
        ></audio>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, View, Search, VideoPlay } from '@element-plus/icons-vue'
import { playlistsApi, songsApi, getAudioUrl } from '@/api'

const playlists = ref([])
const loading = ref(false)

const formDialogVisible = ref(false)
const formMode = ref('create')
const playlistForm = ref({
  id: null,
  name: '',
  description: ''
})

const detailDialogVisible = ref(false)
const currentPlaylist = ref(null)
const playlistSongs = ref([])

const addSongsDialogVisible = ref(false)
const availableSongs = ref([])
const selectedSongs = ref([])
const songLoading = ref(false)
const songSearchText = ref('')
const songTableRef = ref(null)

const audioDialogVisible = ref(false)
const audioPlayerRef = ref(null)
const currentAudio = ref(null)

async function loadPlaylists() {
  try {
    loading.value = true
    const res = await playlistsApi.getList()
    if (res.success) {
      playlists.value = res.data
    }
  } catch (error) {
    console.error('加载歌单列表失败:', error)
  } finally {
    loading.value = false
  }
}

function showCreateDialog() {
  formMode.value = 'create'
  playlistForm.value = {
    id: null,
    name: '',
    description: ''
  }
  formDialogVisible.value = true
}

function editPlaylist(playlist) {
  formMode.value = 'edit'
  playlistForm.value = {
    id: playlist.id,
    name: playlist.name,
    description: playlist.description || ''
  }
  formDialogVisible.value = true
}

async function handleSubmit() {
  if (!playlistForm.value.name) {
    ElMessage.warning('请输入歌单名称')
    return
  }

  try {
    const { id, ...data } = playlistForm.value
    let res
    if (formMode.value === 'create') {
      res = await playlistsApi.create(data)
    } else {
      res = await playlistsApi.update(id, data)
    }
    
    if (res.success) {
      ElMessage.success(formMode.value === 'create' ? '创建成功' : '更新成功')
      formDialogVisible.value = false
      loadPlaylists()
    }
  } catch (error) {
    console.error('提交失败:', error)
  }
}

function deletePlaylist(playlist) {
  ElMessageBox.confirm(
    `确定要删除歌单《${playlist.name}》吗？`,
    '提示',
    {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    }
  ).then(async () => {
    try {
      const res = await playlistsApi.delete(playlist.id)
      if (res.success) {
        ElMessage.success('删除成功')
        loadPlaylists()
      }
    } catch (error) {
      console.error('删除失败:', error)
    }
  }).catch(() => {})
}

async function viewPlaylist(playlist) {
  try {
    currentPlaylist.value = playlist
    const res = await playlistsApi.getDetail(playlist.id)
    if (res.success) {
      playlistSongs.value = res.data.songs || []
      detailDialogVisible.value = true
    }
  } catch (error) {
    console.error('加载歌单详情失败:', error)
  }
}

async function manageSongs(playlist) {
  currentPlaylist.value = playlist
  songSearchText.value = ''
  selectedSongs.value = []
  await loadAvailableSongs()
  addSongsDialogVisible.value = true
}

async function loadAvailableSongs() {
  try {
    songLoading.value = true
    const res = await songsApi.getList({
      search: songSearchText.value,
      page: 1,
      limit: 100
    })
    if (res.success) {
      availableSongs.value = res.data.songs
    }
  } catch (error) {
    console.error('加载歌曲列表失败:', error)
  } finally {
    songLoading.value = false
  }
}

let songSearchTimer = null
function handleSongSearch() {
  clearTimeout(songSearchTimer)
  songSearchTimer = setTimeout(() => {
    loadAvailableSongs()
  }, 500)
}

function handleSelectionChange(selection) {
  selectedSongs.value = selection
}

async function handleAddSongs() {
  if (selectedSongs.value.length === 0) {
    ElMessage.warning('请选择要添加的歌曲')
    return
  }

  try {
    const songIds = selectedSongs.value.map(song => song.id)
    const res = await playlistsApi.addSongs(currentPlaylist.value.id, songIds)
    if (res.success) {
      ElMessage.success(res.message)
      addSongsDialogVisible.value = false
      loadPlaylists()
    }
  } catch (error) {
    console.error('添加歌曲失败:', error)
  }
}

function removeSong(song) {
  ElMessageBox.confirm(
    `确定要从歌单中移除《${song.title}》吗？`,
    '提示',
    {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    }
  ).then(async () => {
    try {
      const res = await playlistsApi.removeSong(currentPlaylist.value.id, song.id)
      if (res.success) {
        ElMessage.success('移除成功')
        viewPlaylist(currentPlaylist.value)
      }
    } catch (error) {
      console.error('移除失败:', error)
    }
  }).catch(() => {})
}

function playAudio(song) {
  currentAudio.value = {
    title: song.title,
    url: getAudioUrl(song.file_path)
  }
  audioDialogVisible.value = true
}

function formatDuration(seconds) {
  if (!seconds) return '--:--'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

onMounted(() => {
  loadPlaylists()
})
</script>

<style scoped>
.playlists-page {
  background: white;
  border-radius: 8px;
  padding: 24px;
}

.toolbar {
  margin-bottom: 20px;
}

.empty {
  text-align: center;
  padding: 40px;
  color: #999;
}

.search-bar {
  margin-bottom: 16px;
}

.audio-player {
  padding: 20px 0;
}
</style>

