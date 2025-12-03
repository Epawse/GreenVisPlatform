import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useFeaturesStore = defineStore('features', () => {
  // State
  const features = ref([])
  const selectedFeatures = ref([])
  const activeTool = ref(null)
  const undoStack = ref([])

  // Interaction instances (managed by Map.vue)
  const drawInteraction = ref(null)
  const selectInteraction = ref(null)
  const modifyInteraction = ref(null)
  const translateInteraction = ref(null)
  const measureInteraction = ref(null)
  const transformInteraction = ref(null)

  // GeoJSON Viewer state
  const selectedFeatureGeoJSON = ref(null)

  // Actions
  function addFeature(feature) {
    const id = feature.getId()
    const geometry = feature.getGeometry()
    const type = geometry.getType()
    let area = 0

    if (type === 'Polygon') {
      area = geometry.getArea()
    }

    const featureData = {
      id,
      type,
      area: area.toFixed(2),
      selected: false,
      feature, // 保存原始feature引用
    }

    features.value.push(featureData)
    undoStack.value.push(feature)

    console.log(`要素添加成功: ${id} (${type})`)
  }

  function removeFeature(id) {
    const index = features.value.findIndex((f) => f.id === id)

    if (index !== -1) {
      const feature = features.value[index]
      features.value.splice(index, 1)

      // 从选中列表中移除
      const selectedIndex = selectedFeatures.value.findIndex((f) => f.id === id)
      if (selectedIndex !== -1) {
        selectedFeatures.value.splice(selectedIndex, 1)
      }

      console.log(`要素删除成功: ${id}`)
      return feature
    }

    return null
  }

  function selectFeature(id) {
    const feature = features.value.find((f) => f.id === id)

    if (feature && !feature.selected) {
      feature.selected = true
      selectedFeatures.value.push(feature)
      console.log(`要素选中: ${id}`)
    }
  }

  function deselectFeature(id) {
    const feature = features.value.find((f) => f.id === id)

    if (feature && feature.selected) {
      feature.selected = false
      const index = selectedFeatures.value.findIndex((f) => f.id === id)
      if (index !== -1) {
        selectedFeatures.value.splice(index, 1)
      }
      console.log(`要素取消选中: ${id}`)
    }
  }

  function clearSelection() {
    selectedFeatures.value.forEach((feature) => {
      feature.selected = false
    })
    selectedFeatures.value = []
    console.log('清空选中')
  }

  function toggleFeatureSelection(id) {
    const feature = features.value.find((f) => f.id === id)

    if (feature) {
      if (feature.selected) {
        deselectFeature(id)
      } else {
        selectFeature(id)
      }
    }
  }

  function undo() {
    if (undoStack.value.length > 0) {
      const lastFeature = undoStack.value.pop()
      const lastId = lastFeature.getId()

      removeFeature(lastId)

      console.log(`撤销操作: 移除要素 ${lastId}`)
      return lastFeature
    }

    return null
  }

  function clearAll() {
    features.value = []
    selectedFeatures.value = []
    undoStack.value = []
    console.log('清空所有要素')
  }

  function setActiveTool(tool) {
    activeTool.value = tool
    console.log(`激活工具: ${tool}`)
  }

  function resetActiveTool() {
    activeTool.value = null
    console.log('重置工具')
  }

  function setGeoJSONViewer(featureGeoJSON) {
    selectedFeatureGeoJSON.value = featureGeoJSON
  }

  function getFeatureById(id) {
    return features.value.find((f) => f.id === id)
  }

  function updateFeature(id, updates) {
    const feature = features.value.find((f) => f.id === id)

    if (feature) {
      Object.assign(feature, updates)
      console.log(`要素更新成功: ${id}`)
    }
  }

  return {
    // State
    features,
    selectedFeatures,
    activeTool,
    undoStack,

    // Interaction refs
    drawInteraction,
    selectInteraction,
    modifyInteraction,
    translateInteraction,
    measureInteraction,
    transformInteraction,

    // GeoJSON Viewer
    selectedFeatureGeoJSON,

    // Actions
    addFeature,
    removeFeature,
    selectFeature,
    deselectFeature,
    clearSelection,
    toggleFeatureSelection,
    undo,
    clearAll,
    setActiveTool,
    resetActiveTool,
    setGeoJSONViewer,
    getFeatureById,
    updateFeature,
  }
})
