<template>
  <div class="chart-panel" v-show="uiStore.chartVisible">
    <div class="chart-header">
      <span>{{ chartTitle }}</span>
      <i class="el-icon-close" @click="uiStore.closeChart()"></i>
    </div>

    <!-- 可达性表格 -->
    <div class="chart-body-1" v-show="isAccessibilityChart">
      <el-table :data="tableData" height="300" style="width: 100%">
        <el-table-column
          v-for="(header, index) in tableHeaders"
          :key="index"
          :prop="header"
          :label="header"
        >
        </el-table-column>
      </el-table>
    </div>

    <!-- 公平性图片 -->
    <div class="chart-body-2" v-show="isEquityChart">
      <div v-for="(image, index) in equityImages" :key="image" class="block">
        <span class="demonstration">{{ equityLabels[index] }}</span>
        <el-image
          style="width: 200px; height: 130px"
          :src="image"
          :fit="'fill'"
        ></el-image>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import * as d3 from 'd3'
import { useDataStore, useUIStore } from '@/stores'

// Stores
const dataStore = useDataStore()
const uiStore = useUIStore()

// State
const tableData = ref([])
const tableHeaders = ref([])
const equityImages = ref([])
const equityLabels = ref([])

// Computed
const chartTitle = computed(() => {
  if (isEquityChart.value) {
    return '绿地公平性指标'
  } else if (isAccessibilityChart.value) {
    return `${dataStore.selectedYear} 年绿地可达性指标`
  }
  return '数据图表'
})

const isAccessibilityChart = computed(() => {
  return dataStore.selectedDataType[0] === 'greenAccessibility'
})

const isEquityChart = computed(() => {
  return dataStore.selectedDataType[0] === 'greenEquity'
})

// Methods
function loadAccessibilityData() {
  if (!dataStore.selectedYear) {
    ElMessage.error('请选择数据年份')
    return
  }

  const tableUrl = `/tables/分区统计Aij_${dataStore.selectedYear}.csv`

  d3.csv(tableUrl)
    .then((data) => {
      if (data.length > 0) {
        tableHeaders.value = Object.keys(data[0])
        tableData.value = data
      } else {
        ElMessage.error('表格数据为空')
      }
    })
    .catch((error) => {
      ElMessage.error('加载表格数据失败')
      console.error('Error loading table data:', error)
    })
}

function loadEquityData() {
  equityImages.value = [
    '/images/步行公平性.png',
    '/images/驾车公平性.png',
    '/images/近邻公平性.png',
    '/images/总体公平性.png',
  ]
  equityLabels.value = ['步行公平性', '驾车公平性', '近邻公平性', '总体公平性']
}

function loadChartData() {
  if (!dataStore.selectedYear || dataStore.selectedDataType.length === 0) {
    return
  }

  if (isAccessibilityChart.value) {
    loadAccessibilityData()
  } else if (isEquityChart.value) {
    loadEquityData()
  }
}

// Watch for data changes
watch(
  () => uiStore.chartVisible,
  (visible) => {
    if (visible) {
      loadChartData()
    }
  }
)

watch(
  () => [dataStore.selectedYear, dataStore.selectedDataType],
  () => {
    if (uiStore.chartVisible) {
      loadChartData()
    }
  },
  { deep: true }
)
</script>

<style scoped>
.chart-panel {
  position: absolute;
  top: 110px;
  left: 20px;
  width: 900px;
  max-height: 500px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 100;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: linear-gradient(to right, #409eff, #67c23a);
  color: white;
  font-size: 16px;
  font-weight: bold;
}

.chart-header i {
  cursor: pointer;
  font-size: 18px;
  transition: transform 0.2s;
}

.chart-header i:hover {
  transform: scale(1.2);
}

.chart-body-1,
.chart-body-2 {
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.chart-body-2 {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.demonstration {
  font-size: 14px;
  color: #606266;
}
</style>
