<template>
  <div class="map-tools">
    <!-- Draw Tools -->
    <div class="tool-group glass-panel">
      <div class="group-title">绘制</div>
      <el-button-group vertical>
        <el-tooltip content="绘制点" placement="right" :show-after="500">
          <el-button 
            :class="{ active: activeTool === 'Point' }" 
            @click="$emit('command', 'drawFeature', 'Point')"
          >画点</el-button>
        </el-tooltip>
        <el-tooltip content="绘制线" placement="right" :show-after="500">
          <el-button 
            :class="{ active: activeTool === 'LineString' }" 
            @click="$emit('command', 'drawFeature', 'LineString')"
          >画线</el-button>
        </el-tooltip>
        <el-tooltip content="绘制面" placement="right" :show-after="500">
          <el-button 
            :class="{ active: activeTool === 'Polygon' }" 
            @click="$emit('command', 'drawFeature', 'Polygon')"
          >画面</el-button>
        </el-tooltip>
      </el-button-group>
    </div>

    <!-- Edit Tools -->
    <div class="tool-group glass-panel">
      <div class="group-title">编辑</div>
      <el-button-group vertical>
        <el-tooltip content="选择要素" placement="right" :show-after="500">
          <el-button 
            :class="{ active: activeTool === 'selectFeature' }" 
            @click="$emit('command', 'selectFeature')"
          >选择</el-button>
        </el-tooltip>
        <el-tooltip content="平移要素" placement="right" :show-after="500">
          <el-button 
            :class="{ active: activeTool === 'translateFeature' }" 
            @click="$emit('command', 'translateFeature')"
          >平移</el-button>
        </el-tooltip>
        <el-tooltip content="编辑节点" placement="right" :show-after="500">
          <el-button 
            :class="{ active: activeTool === 'editVertices' }" 
            @click="$emit('command', 'editVertices')"
          >编辑</el-button>
        </el-tooltip>
        <el-tooltip content="旋转要素" placement="right" :show-after="500">
          <el-button 
            :class="{ active: activeTool === 'rotateFeature' }" 
            @click="$emit('command', 'rotateFeature')"
          >旋转</el-button>
        </el-tooltip>
      </el-button-group>
    </div>

    <!-- Operation Tools -->
    <div class="tool-group glass-panel">
      <div class="group-title">操作</div>
      <el-button-group vertical>
        <el-tooltip content="撤销上一步" placement="right" :show-after="500">
          <el-button @click="$emit('command', 'undo')">撤回</el-button>
        </el-tooltip>
        <el-tooltip content="清除所有绘制" placement="right" :show-after="500">
          <el-button @click="$emit('command', 'clearDrawLayer')">清除</el-button>
        </el-tooltip>
        <el-tooltip content="测量距离" placement="right" :show-after="500">
          <el-button 
            :class="{ active: activeTool === 'measureDistance' }" 
            @click="$emit('command', 'measureDistance')"
          >测距</el-button>
        </el-tooltip>
         <el-tooltip content="取消当前操作" placement="right" :show-after="500">
          <el-button @click="$emit('command', 'resetStatus')">取消</el-button>
        </el-tooltip>
      </el-button-group>
    </div>
    
     <!-- View Tools -->
    <div class="tool-group glass-panel">
      <div class="group-title">视图</div>
      <el-button-group vertical>
         <el-button @click="$emit('command', 'onMoveWh')">深圳</el-button>
         <el-button @click="$emit('command', 'onRestore')">复位</el-button>
         <el-button @click="$emit('command', 'checkArea')" :class="{ active: activeTool === 'checkArea' }">信息</el-button>
      </el-button-group>
    </div>
  </div>
</template>

<script setup>
defineProps({
  activeTool: {
    type: String,
    default: null
  }
})

defineEmits(['command'])
</script>

<style scoped>
.map-tools {
  position: absolute;
  top: 110px;
  left: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tool-group {
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.2s;
}

.tool-group:hover {
  transform: translateX(4px);
}

.group-title {
  font-size: 10px;
  color: var(--text-secondary);
  margin-bottom: 6px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.el-button-group > .el-button {
  width: 48px;
  height: 32px;
  padding: 0;
  font-size: 12px;
  margin-bottom: 1px;
}

.el-button.active {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}
</style>
