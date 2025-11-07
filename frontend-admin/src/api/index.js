import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '/api',
  timeout: 30000
})

// 请求拦截器
request.interceptors.request.use(
  config => config,
  error => Promise.reject(error)
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response.data
    if (!res.success && res.message) {
      ElMessage.error(res.message)
    }
    return res
  },
  error => {
    console.error('API Error:', error)
    ElMessage.error(error.response?.data?.message || '请求失败')
    return Promise.reject(error)
  }
)

// 歌曲相关 API
export const songsApi = {
  // 获取歌曲列表
  getList(params) {
    return request.get('/songs', { params })
  },
  // 获取歌曲详情
  getDetail(id) {
    return request.get(`/songs/${id}`)
  },
  // 上传歌曲
  upload(formData) {
    return request.post('/songs/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  // 更新歌曲
  update(id, data) {
    return request.put(`/songs/${id}`, data)
  },
  // 删除歌曲
  delete(id) {
    return request.delete(`/songs/${id}`)
  }
}

// 歌单相关 API
export const playlistsApi = {
  // 获取歌单列表
  getList() {
    return request.get('/playlists')
  },
  // 获取歌单详情（包含歌曲）
  getDetail(id) {
    return request.get(`/playlists/${id}`)
  },
  // 创建歌单
  create(data) {
    return request.post('/playlists', data)
  },
  // 更新歌单
  update(id, data) {
    return request.put(`/playlists/${id}`, data)
  },
  // 删除歌单
  delete(id) {
    return request.delete(`/playlists/${id}`)
  },
  // 添加歌曲到歌单
  addSongs(id, songIds) {
    return request.post(`/playlists/${id}/songs`, { songIds })
  },
  // 从歌单移除歌曲
  removeSong(id, songId) {
    return request.delete(`/playlists/${id}/songs/${songId}`)
  }
}

// 获取音频文件 URL
export function getAudioUrl(filePath) {
  return `/uploads/${filePath}`
}

export default request

