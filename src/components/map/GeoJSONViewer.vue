<template>
  <div v-if="uiStore.geoJSONViewerVisible" class="geojson-viewer">
    <el-card class="geojson-card">
      <template #header>
        <div class="card-header">
          <span>GeoJSON 查看器</span>
          <el-button type="text" @click="closeViewer" class="close-btn">
            <i class="el-icon-close"></i>
          </el-button>
        </div>
      </template>
      <div class="geojson-content">
        <vue-json-pretty
          v-if="parsedGeoJSON"
          :data="parsedGeoJSON"
          :deep="3"
          selectableType="single"
          :highlightMouseoverNode="true"
          path="res"
        />
        <div v-else class="no-data">暂无GeoJSON数据</div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useUIStore, useFeaturesStore } from '@/stores'
import VueJsonPretty from 'vue-json-pretty/lib/vue-json-pretty.js'
import 'vue-json-pretty/lib/styles.css'

const uiStore = useUIStore()
const featuresStore = useFeaturesStore()

const parsedGeoJSON = computed(() => featuresStore.selectedFeatureGeoJSON)

function closeViewer() {
  uiStore.hideGeoJSONViewer()
}
</script>

<style scoped>
.geojson-viewer {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2000;
  max-width: 600px;
  max-height: 80vh;
  overflow: auto;
}

.geojson-card {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-btn {
  font-size: 18px;
  cursor: pointer;
}

.geojson-content {
  max-height: 60vh;
  overflow: auto;
}

.no-data {
  text-align: center;
  color: #909399;
  padding: 20px;
}
</style>
