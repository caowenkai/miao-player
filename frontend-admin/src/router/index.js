import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    redirect: '/songs',
    children: [
      {
        path: 'songs',
        name: 'Songs',
        component: () => import('@/views/Songs.vue'),
        meta: { title: '音乐管理' }
      },
      {
        path: 'playlists',
        name: 'Playlists',
        component: () => import('@/views/Playlists.vue'),
        meta: { title: '歌单管理' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

