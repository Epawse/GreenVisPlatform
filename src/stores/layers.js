import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Vector as VectorLayer } from 'ol/layer'
import { Vector as VectorSource } from 'ol/source'
import { Style, Fill, Stroke, Circle } from 'ol/style'
import { useMapStore } from './map'

export const useLayersStore = defineStore('layers', () => {
  // State
  const layers = ref([])
  const checkedLayers = ref([])
  const drawLayer = ref(null)
  const drawSource = ref(null)

  // Actions
  function initDrawLayer() {
    const mapStore = useMapStore()

    // 创建绘图数据源
    drawSource.value = new VectorSource()

    // 创建绘图图层（应用性能优化配置）
    drawLayer.value = new VectorLayer({
      properties: {
        name: '绘图图层',
        type: 'draw',
      },
      source: drawSource.value,
      style: new Style({
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.2)',
        }),
        stroke: new Stroke({
          color: '#ffcc33',
          width: 3,
        }),
        image: new Circle({
          radius: 7,
          fill: new Fill({
            color: '#ffcc33',
          }),
        }),
      }),
      zIndex: 1200,

      // 性能优化关键配置（来自 DRAW_OPTIMIZATION.md）
      updateWhileAnimating: true, // 地图平移/旋转动画时也更新
      updateWhileInteracting: true, // 用户交互（拖拽、缩放）时也更新
      renderBuffer: 250, // 增加渲染缓冲区，提前渲染屏幕外的要素
      renderOrder: null, // 设置渲染顺序
    })

    // 添加到地图
    if (mapStore.mapInstance) {
      mapStore.mapInstance.addLayer(drawLayer.value)

      // 添加到图层管理数组
      const layerInfo = {
        name: '绘图图层',
        layer: drawLayer.value,
        index: layers.value.length + 1,
        visible: true,
      }

      layers.value.unshift(layerInfo)
      checkedLayers.value.push('绘图图层')

      console.log('绘图图层初始化完成（已应用性能优化）')
    }
  }

  function addLayer(name, layer) {
    const mapStore = useMapStore()

    if (mapStore.mapInstance) {
      // 添加到地图
      mapStore.mapInstance.addLayer(layer)

      // 添加到图层列表
      const layerInfo = {
        name,
        layer,
        index: layers.value.length + 1,
        visible: true,
      }

      layers.value.push(layerInfo)
      checkedLayers.value.push(name)

      console.log(`图层添加成功: ${name}`)
    }
  }

  function removeLayer(name) {
    const mapStore = useMapStore()
    const layerInfo = layers.value.find((l) => l.name === name)

    if (layerInfo && mapStore.mapInstance) {
      // 从地图移除
      mapStore.mapInstance.removeLayer(layerInfo.layer)

      // 从列表移除
      layers.value = layers.value.filter((l) => l.name !== name)
      checkedLayers.value = checkedLayers.value.filter((n) => n !== name)

      console.log(`图层移除成功: ${name}`)
    }
  }

  function toggleLayerVisibility(name, isVisible = null) {
    const layerInfo = layers.value.find((l) => l.name === name)

    if (layerInfo) {
      // 如果未提供 isVisible 参数，则从 checkedLayers 中获取
      const visible = isVisible !== null ? isVisible : checkedLayers.value.includes(name)
      layerInfo.layer.setVisible(visible)
      layerInfo.visible = visible

      console.log(`图层可见性切换: ${name} = ${visible}`)
    }
  }

  function updateLayerOrder() {
    // 根据数组顺序更新 z-index
    // 数组顶部的图层显示在最上面
    layers.value.forEach((layerInfo, index) => {
      const zIndex = 1000 - index // 越靠前的图层 z-index 越高
      layerInfo.layer.setZIndex(zIndex)
      layerInfo.index = index + 1
    })

    console.log('图层顺序已更新')
  }

  function clearDrawLayer() {
    if (drawSource.value) {
      drawSource.value.clear()
      console.log('绘图图层已清空')
    }
  }

  function getLayerByName(name) {
    const layerInfo = layers.value.find((l) => l.name === name)
    return layerInfo?.layer || null
  }

  function getAllLayers() {
    return layers.value.map((l) => l.layer)
  }

  return {
    // State
    layers,
    checkedLayers,
    drawLayer,
    drawSource,

    // Actions
    initDrawLayer,
    addLayer,
    removeLayer,
    toggleLayerVisibility,
    updateLayerOrder,
    clearDrawLayer,
    getLayerByName,
    getAllLayers,
  }
})
