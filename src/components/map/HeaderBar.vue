<template>
  <div class="header">
    <!-- 头部内容 -->
    <div class="logo">
      <img src="/icon.png" alt="Logo Icon" class="logo-icon" />
      <span>城市绿色空间展示平台</span>
    </div>
    <div class="nav">
      <el-cascader
        v-model="dataStore.selectedDataType"
        placeholder="请选择数据类型"
        :options="dataStore.typeOptions"
        :props="{ expandTrigger: 'hover' }"
        size="large"
        style="width: 180px"
      >
      </el-cascader>

      <el-select
        v-model="dataStore.selectedYear"
        placeholder="请选择数据年份"
        size="large"
        style="width: 180px"
      >
        <el-option
          v-for="year in dataStore.yearOptions"
          :key="year"
          :label="year"
          :value="year"
          :disabled="isYearDisabled(year)"
        ></el-option>
      </el-select>

      <el-select
        v-model="dataStore.selectedPolicy"
        placeholder="请选择政策"
        size="large"
        style="width: 180px"
        :disabled="dataStore.isPolicyDisabled"
      >
        <el-option
          v-for="policy in dataStore.policyOptions"
          :key="policy.value"
          :label="policy.label"
          :value="policy.value"
        ></el-option>
      </el-select>

      <el-button @click="handleLoadShp()" size="large">确定</el-button>
      <el-button
        @click="uiStore.toggleChart()"
        size="large"
        :class="{ active: uiStore.chartVisible }"
        >查看图表</el-button
      >
      <el-button
        @click="uiStore.toggleSuggestion()"
        size="large"
        :class="{ active: uiStore.suggestionVisible }"
        >查看建议</el-button
      >

      <el-button @click="uiStore.toggleBasemap()" size="large">底图</el-button>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue'
import { ElMessage } from 'element-plus'
import { useDataStore, useUIStore } from '@/stores'

// Stores
const dataStore = useDataStore()
const uiStore = useUIStore()

// Inject from parent Map.vue
const loadShp = inject('loadShp')

// Methods
function isYearDisabled(year) {
  if (!dataStore.isPredict) {
    return year !== '2014'
  }
  return false
}

function handleLoadShp() {
  // 验证必填项
  if (dataStore.selectedDataType.length === 0 || !dataStore.selectedYear) {
    ElMessage.error('请选择数据类型和数据年份')
    return
  }

  if (!dataStore.selectedPolicy && dataStore.isPredict) {
    ElMessage.error('请选择政策类型')
    return
  }

  // 调用父组件的 loadShp 方法
  if (loadShp) {
    loadShp()
  }
}
</script>

<style scoped>
.header {
  position: fixed;
  width: calc(100% - 40px);
  height: 70px;
  top: 20px;
  left: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 1000;
  box-sizing: border-box;
  
  /* Apply Glassmorphism */
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  border-radius: var(--panel-radius);
  transition: all var(--transition-speed) ease;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 600;
  color: var(--primary-dark);
  user-select: none;
}

.logo-icon {
  width: 40px;
  height: 40px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}

.nav {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* Custom Button Styles for Header */
.nav .el-button {
  border-radius: 8px;
  font-weight: 500;
}

.nav .el-button.active {
  background-color: var(--accent-color);
  border-color: var(--accent-color);
  color: #fff;
}

/* Make inputs blend in */
:deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}
:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--primary-color) inset;
}
</style>
