<template>
  <div v-show="uiStore.suggestionVisible" class="suggestion-panel">
    <div v-if="loading" class="loading">
      <i class="el-icon-loading"></i> 加载中...
    </div>
    <div v-else-if="suggestionContent" v-html="suggestionContent" class="suggestion-content"></div>
    <div v-else class="no-content">暂无建议内容</div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useUIStore, useDataStore } from '@/stores'
import { ElMessage } from 'element-plus'

const uiStore = useUIStore()
const dataStore = useDataStore()

const suggestionContent = ref('')
const loading = ref(false)

// 监听年份变化，自动重新加载建议
watch(
  () => dataStore.selectedYear,
  async (newYear) => {
    if (uiStore.suggestionVisible && newYear) {
      await loadSuggestions(newYear)
    }
  }
)

// 监听面板可见性变化，显示时加载建议
watch(
  () => uiStore.suggestionVisible,
  async (isVisible) => {
    if (isVisible && dataStore.selectedYear) {
      await loadSuggestions(dataStore.selectedYear)
    }
  },
  { immediate: true }
)

async function loadSuggestions(year) {
  loading.value = true

  try {
    const response = await fetch(`/suggestions/suggestion_${year}.txt`)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const text = await response.text()
    suggestionContent.value = text.replace(/\n/g, '<br>')

    console.log(`建议内容加载成功: ${year}年`)
  } catch (error) {
    console.error('加载建议内容失败:', error)
    ElMessage.error(`加载${year}年建议内容失败`)
    suggestionContent.value = ''
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.suggestion-panel {
  position: absolute;
  right: 25%;
  top: 90px;
  width: 300px;
  max-height: 500px;
  overflow-y: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 20px;
  z-index: 100;
  transition: right 0.3s ease;
}

.loading,
.no-content {
  text-align: center;
  color: #909399;
  padding: 20px 0;
}

.loading i {
  font-size: 24px;
  margin-right: 8px;
}

.suggestion-content {
  line-height: 1.8;
  color: #303133;
  font-size: 14px;
}

/* 调整布局当图表面板显示时 */
.chart-panel-visible .suggestion-panel {
  right: 25%;
}
</style>
