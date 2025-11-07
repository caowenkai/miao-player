import { defineStore } from 'pinia'
import { ref } from 'vue'

// 主题配置
export const themes = {
  light: {
    name: '白天',
    id: 'light',
    colors: {
      primary: '#667eea',
      secondary: '#764ba2',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      text: '#333333',
      textSecondary: '#666666',
      cardBg: 'rgba(255, 255, 255, 0.9)',
      cardBgHover: 'rgba(255, 255, 255, 0.95)',
      progressBg: 'rgba(0, 0, 0, 0.1)',
      progressActive: '#667eea',
      border: 'rgba(0, 0, 0, 0.1)'
    }
  },
  dark: {
    name: '暗夜',
    id: 'dark',
    colors: {
      primary: '#667eea',
      secondary: '#764ba2',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      text: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.8)',
      cardBg: 'rgba(255, 255, 255, 0.1)',
      cardBgHover: 'rgba(255, 255, 255, 0.15)',
      progressBg: 'rgba(255, 255, 255, 0.2)',
      progressActive: '#ffffff',
      border: 'rgba(255, 255, 255, 0.1)'
    }
  },
  sky: {
    name: '天蓝',
    id: 'sky',
    colors: {
      primary: '#4facfe',
      secondary: '#00f2fe',
      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      text: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.9)',
      cardBg: 'rgba(255, 255, 255, 0.15)',
      cardBgHover: 'rgba(255, 255, 255, 0.2)',
      progressBg: 'rgba(255, 255, 255, 0.3)',
      progressActive: '#ffffff',
      border: 'rgba(255, 255, 255, 0.2)'
    }
  },
  pink: {
    name: '粉色少女',
    id: 'pink',
    colors: {
      primary: '#ff6b9d',
      secondary: '#ffc0cb',
      background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
      text: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.95)',
      cardBg: 'rgba(255, 255, 255, 0.25)',
      cardBgHover: 'rgba(255, 255, 255, 0.35)',
      progressBg: 'rgba(255, 255, 255, 0.4)',
      progressActive: '#ffffff',
      border: 'rgba(255, 255, 255, 0.3)'
    }
  },
  nightSky: {
    name: '夜景天空',
    id: 'nightSky',
    colors: {
      primary: '#4a90e2',
      secondary: '#6bb6ff',
      background: 'linear-gradient(135deg, #0c1445 0%, #1a237e 50%, #283593 100%)',
      text: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.9)',
      cardBg: 'rgba(255, 255, 255, 0.1)',
      cardBgHover: 'rgba(255, 255, 255, 0.15)',
      progressBg: 'rgba(255, 255, 255, 0.25)',
      progressActive: '#6bb6ff',
      border: 'rgba(255, 255, 255, 0.15)'
    }
  }
}

export const useThemeStore = defineStore('theme', () => {
  // 从 localStorage 读取保存的主题，默认为 sky（天蓝）
  const currentTheme = ref(localStorage.getItem('theme') || 'sky')

  // 获取当前主题配置
  function getTheme() {
    return themes[currentTheme.value] || themes.sky
  }

  // 设置主题
  function setTheme(themeId) {
    if (themes[themeId]) {
      currentTheme.value = themeId
      localStorage.setItem('theme', themeId)
      applyTheme()
    }
  }

  // 应用主题到文档
  function applyTheme() {
    const theme = getTheme()
    const root = document.documentElement
    
    // 设置 CSS 变量
    root.style.setProperty('--theme-primary', theme.colors.primary)
    root.style.setProperty('--theme-secondary', theme.colors.secondary)
    root.style.setProperty('--theme-background', theme.colors.background)
    root.style.setProperty('--theme-text', theme.colors.text)
    root.style.setProperty('--theme-text-secondary', theme.colors.textSecondary)
    root.style.setProperty('--theme-card-bg', theme.colors.cardBg)
    root.style.setProperty('--theme-card-bg-hover', theme.colors.cardBgHover)
    root.style.setProperty('--theme-progress-bg', theme.colors.progressBg)
    root.style.setProperty('--theme-progress-active', theme.colors.progressActive)
    root.style.setProperty('--theme-border', theme.colors.border)
    
    // 禁用系统主题自动应用，强制使用我们的主题
    root.style.colorScheme = 'light dark'
    root.style.setProperty('forced-color-adjust', 'none')
    
    // 更新 meta theme-color（用于移动端状态栏）
    updateThemeColor(theme.colors.primary)
    
    // 为粉色主题添加特殊类名，用于显示卡通元素
    if (theme.id === 'pink') {
      root.classList.add('theme-pink')
    } else {
      root.classList.remove('theme-pink')
    }
  }
  
  // 更新移动端状态栏颜色
  function updateThemeColor(color) {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta')
      metaThemeColor.setAttribute('name', 'theme-color')
      document.head.appendChild(metaThemeColor)
    }
    metaThemeColor.setAttribute('content', color)
  }

  // 初始化时应用主题
  applyTheme()

  return {
    currentTheme,
    getTheme,
    setTheme,
    applyTheme,
    themes
  }
})

