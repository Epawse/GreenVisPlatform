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
  width: 100%;
  height: 90px;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
  background: linear-gradient(to right, #409eff, #67c23a);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: bold;
  color: white;
}

.logo-icon {
  width: 50px;
  height: 50px;
}

.nav {
  display: flex;
  gap: 15px;
  align-items: center;
}

.el-button.active {
  background-color: #ffcc33;
  border-color: #ffcc33;
  color: #333;
}
</style>
