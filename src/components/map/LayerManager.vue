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
  top: 50%;
  right: 45px;
  transform: translateY(-50%);
  z-index: 200;
  display: flex;
  align-items: center;
}

.toggle-button {
  width: 40px;
  height: 60px;
  padding: 0;
  font-size: 16px;
  font-weight: bold;
  border-radius: 8px 0 0 8px;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
}

.layer-manager {
  margin-right: 10px;
}

.layer-card {
  width: 280px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 16px;
  color: #333;
}

.layer-checkbox-group {
  display: flex;
  flex-direction: column;
}

.draggable-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
  background-color: rgba(128, 128, 128, 0.05);
  border-radius: 4px;
}

.layer-checkbox {
  padding: 10px;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  cursor: move;
  transition: all 0.3s;
}

.layer-checkbox:hover {
  background: #f5f7fa;
  border-color: #409eff;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.1);
}

.ghost {
  opacity: 0.5;
  background: #c8e1ff;
}

/* 过渡动画 */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
