import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    children: [
      {
        path: '',
        redirect: '/player'
      },
      {
        path: 'player',
        name: 'Player',
        component: () => import('@/views/Player.vue')
      },
      {
        path: 'playlists',
        name: 'Playlists',
        component: () => import('@/views/Playlists.vue')
      }
    ]
  },
  {
    path: '/playlist/:id',
    name: 'PlaylistDetail',
    component: () => import('@/views/PlaylistDetail.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

