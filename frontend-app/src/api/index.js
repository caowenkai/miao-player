import axios from 'axios'

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
  response => response.data,
  error => {
    console.error('API Error:', error)
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
  }
}

// 获取音频文件 URL
export function getAudioUrl(filePath) {
  return `/uploads/${filePath}`
}

export default request

