<template>
  <div class="songs-page">
    <div class="toolbar">
      <el-button type="primary" @click="showUploadDialog">
        <el-icon><Upload /></el-icon>
        上传音乐
      </el-button>
      <el-input
        v-model="searchText"
        placeholder="搜索歌曲"
        clearable
        style="width: 300px"
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <el-table
      :data="songs"
      v-loading="loading"
      style="width: 100%"
      stripe
    >
      <el-table-column type="index" label="#" width="60" />
      <el-table-column prop="title" label="歌曲名称" min-width="180" />
      <el-table-column prop="artist" label="艺术家" width="150" />
      <el-table-column prop="album" label="专辑" width="150" />
      <el-table-column prop="duration" label="时长" width="100">
        <template #default="{ row }">
          {{ formatDuration(row.duration) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="playAudio(row)">
            <el-icon><VideoPlay /></el-icon>
            试听
          </el-button>
          <el-button link type="primary" @click="editSong(row)">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button link type="danger" @click="deleteSong(row)">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadSongs"
        @current-change="loadSongs"
      />
    </div>

    <!-- 上传对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="上传音乐"
      width="600px"
      @closed="resetUploadForm"
    >
      <el-form :model="uploadForm" label-width="80px">
        <el-form-item label="音乐文件" required>
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            accept="audio/*"
            :on-change="handleFileChange"
          >
            <el-button type="primary">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持 mp3, wav, flac, m4a, ogg 格式
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="歌曲名称">
          <el-input v-model="uploadForm.title" placeholder="留空则从文件名提取" />
        </el-form-item>
        <el-form-item label="艺术家">
          <el-input v-model="uploadForm.artist" placeholder="留空则从元数据提取" />
        </el-form-item>
        <el-form-item label="专辑">
          <el-input v-model="uploadForm.album" />
        </el-form-item>
        <el-form-item label="歌词">
          <el-input
            v-model="uploadForm.lyrics"
            type="textarea"
            :rows="6"
            placeholder="输入歌词（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="handleUpload">
          确定上传
        </el-button>
      </template>
    </el-dialog>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑歌曲"
      width="600px"
    >
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="歌曲名称" required>
          <el-input v-model="editForm.title" />
        </el-form-item>
        <el-form-item label="艺术家" required>
          <el-input v-model="editForm.artist" />
        </el-form-item>
        <el-form-item label="专辑">
          <el-input v-model="editForm.album" />
        </el-form-item>
        <el-form-item label="歌词">
          <el-input
            v-model="editForm.lyrics"
            type="textarea"
            :rows="6"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUpdate">确定</el-button>
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
import { Upload, Search, VideoPlay, Edit, Delete } from '@element-plus/icons-vue'
import { songsApi, getAudioUrl } from '@/api'

const songs = ref([])
const loading = ref(false)
const searchText = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const uploadDialogVisible = ref(false)
const uploadForm = ref({
  file: null,
  title: '',
  artist: '',
  album: '',
  lyrics: ''
})
const uploading = ref(false)
const uploadRef = ref(null)

const editDialogVisible = ref(false)
const editForm = ref({
  id: null,
  title: '',
  artist: '',
  album: '',
  lyrics: ''
})

const audioDialogVisible = ref(false)
const audioPlayerRef = ref(null)
const currentAudio = ref(null)

async function loadSongs() {
  try {
    loading.value = true
    const res = await songsApi.getList({
      search: searchText.value,
      page: currentPage.value,
      limit: pageSize.value
    })
    if (res.success) {
      songs.value = res.data.songs
      total.value = res.data.total
    }
  } catch (error) {
    console.error('加载歌曲列表失败:', error)
  } finally {
    loading.value = false
  }
}

let searchTimer = null
function handleSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    loadSongs()
  }, 500)
}

function showUploadDialog() {
  uploadDialogVisible.value = true
}

function handleFileChange(file) {
  uploadForm.value.file = file.raw
}

async function handleUpload() {
  if (!uploadForm.value.file) {
    ElMessage.warning('请选择要上传的文件')
    return
  }

  try {
    uploading.value = true
    const formData = new FormData()
    formData.append('file', uploadForm.value.file)
    if (uploadForm.value.title) formData.append('title', uploadForm.value.title)
    if (uploadForm.value.artist) formData.append('artist', uploadForm.value.artist)
    if (uploadForm.value.album) formData.append('album', uploadForm.value.album)
    if (uploadForm.value.lyrics) formData.append('lyrics', uploadForm.value.lyrics)

    const res = await songsApi.upload(formData)
    if (res.success) {
      ElMessage.success('上传成功')
      uploadDialogVisible.value = false
      loadSongs()
    }
  } catch (error) {
    console.error('上传失败:', error)
  } finally {
    uploading.value = false
  }
}

function resetUploadForm() {
  uploadForm.value = {
    file: null,
    title: '',
    artist: '',
    album: '',
    lyrics: ''
  }
  uploadRef.value?.clearFiles()
}

function editSong(song) {
  editForm.value = {
    id: song.id,
    title: song.title,
    artist: song.artist,
    album: song.album || '',
    lyrics: song.lyrics || ''
  }
  editDialogVisible.value = true
}

async function handleUpdate() {
  try {
    const { id, ...data } = editForm.value
    const res = await songsApi.update(id, data)
    if (res.success) {
      ElMessage.success('更新成功')
      editDialogVisible.value = false
      loadSongs()
    }
  } catch (error) {
    console.error('更新失败:', error)
  }
}

function deleteSong(song) {
  ElMessageBox.confirm(
    `确定要删除歌曲《${song.title}》吗？`,
    '提示',
    {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    }
  ).then(async () => {
    try {
      const res = await songsApi.delete(song.id)
      if (res.success) {
        ElMessage.success('删除成功')
        loadSongs()
      }
    } catch (error) {
      console.error('删除失败:', error)
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
  loadSongs()
})
</script>

<style scoped>
.songs-page {
  background: white;
  border-radius: 8px;
  padding: 24px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.audio-player {
  padding: 20px 0;
}
</style>

