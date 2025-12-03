<template>
  <div class="layer-manager-container">
    <el-button
      @click="uiStore.toggleLayerManager()"
      type="primary"
      class="toggle-button"
    >
      {{ uiStore.layerManagerVisible ? '-->' : '<--' }}
    </el-button>

    <transition name="slide-fade">
      <div v-show="uiStore.layerManagerVisible" class="layer-manager">
        <el-card class="layer-card">
          <template #header>
            <div class="card-header">
              <span>图层管理</span>
            </div>
          </template>

          <el-checkbox-group
            v-model="layersStore.checkedLayers"
            class="layer-checkbox-group"
          >
            <VueDraggable
              v-model="layersStore.layers"
              :animation="150"
              ghost-class="ghost"
              class="draggable-list"
              @update="handleLayersUpdate"
            >
              <el-checkbox
                v-for="layer in layersStore.layers"
                :key="layer.name"
                :value="layer.name"
                @change="handleToggleLayer(layer)"
                class="layer-checkbox"
              >
                {{ layer.name }}
              </el-checkbox>
            </VueDraggable>
          </el-checkbox-group>
        </el-card>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { VueDraggable } from 'vue-draggable-plus'
import { useLayersStore, useUIStore } from '@/stores'

// Stores
const layersStore = useLayersStore()
const uiStore = useUIStore()

// Methods
function handleLayersUpdate() {
  // 更新图层的 z-index 顺序
  // 第一个图层 z-index 最高，最后一个最低
  layersStore.updateLayerOrder()
}

function handleToggleLayer(layer) {
  const layerName = layer.name
  const isVisible = layersStore.checkedLayers.includes(layerName)
  layersStore.toggleLayerVisibility(layerName, isVisible)
}
</script>

<style scoped>
.layer-manager-container {
  position: absolute;
  top: 110px; /* Below header */
  right: 20px;
  z-index: 200;
  display: flex;
  align-items: flex-start;
  transition: all var(--transition-speed) ease;
}

.toggle-button {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  border-radius: 50%;
  margin-right: 8px;
  background-color: var(--glass-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  color: var(--primary-color);
  box-shadow: var(--glass-shadow);
}

.toggle-button:hover {
  background-color: var(--primary-color);
  color: white;
}

.layer-manager {
  margin-right: 0;
}

.layer-card {
  width: 260px;
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  border-radius: var(--panel-radius);
  /* Override Element Card styles */
  --el-card-border-color: transparent;
  --el-card-bg-color: transparent;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 15px;
  color: var(--text-main);
}

.draggable-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0;
  max-height: 400px;
  overflow-y: auto;
}

.layer-checkbox {
  margin: 0;
  padding: 8px 12px;
  width: 100%;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid transparent;
  border-radius: 6px;
  transition: all 0.2s;
}

.layer-checkbox:hover {
  background: white;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

:deep(.el-checkbox__label) {
  font-size: 13px;
}
</style>
