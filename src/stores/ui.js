import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  // State - Panel visibility
  const chartVisible = ref(false)
  const suggestionVisible = ref(false)
  const basemapVisible = ref(false)
  const layerManagerVisible = ref(false)
  const geoJSONViewerVisible = ref(false)
  const isShowingPopup = ref(false)
  const legendVisible = ref(false)

  // Actions
  function toggleChart() {
    chartVisible.value = !chartVisible.value
    console.log(`图表面板: ${chartVisible.value ? '显示' : '隐藏'}`)
  }

  function closeChart() {
    chartVisible.value = false
    console.log('图表面板: 关闭')
  }

  function toggleSuggestion() {
    suggestionVisible.value = !suggestionVisible.value
    console.log(`建议面板: ${suggestionVisible.value ? '显示' : '隐藏'}`)
  }

  function toggleBasemap() {
    basemapVisible.value = !basemapVisible.value
    console.log(`底图选择器: ${basemapVisible.value ? '显示' : '隐藏'}`)
  }

  function toggleLayerManager() {
    layerManagerVisible.value = !layerManagerVisible.value
    console.log(`图层管理器: ${layerManagerVisible.value ? '显示' : '隐藏'}`)
  }

  function showGeoJSONViewer() {
    geoJSONViewerVisible.value = true
    console.log('GeoJSON查看器: 显示')
  }

  function hideGeoJSONViewer() {
    geoJSONViewerVisible.value = false
    console.log('GeoJSON查看器: 隐藏')
  }

  function showPopup() {
    isShowingPopup.value = true
  }

  function hidePopup() {
    isShowingPopup.value = false
  }

  function showLegend() {
    legendVisible.value = true
  }

  function hideLegend() {
    legendVisible.value = false
  }

  function closeAllPanels() {
    chartVisible.value = false
    suggestionVisible.value = false
    basemapVisible.value = false
    layerManagerVisible.value = false
    geoJSONViewerVisible.value = false
    isShowingPopup.value = false
    console.log('所有面板已关闭')
  }

  return {
    // State
    chartVisible,
    suggestionVisible,
    basemapVisible,
    layerManagerVisible,
    geoJSONViewerVisible,
    isShowingPopup,
    legendVisible,

    // Actions
    toggleChart,
    closeChart,
    toggleSuggestion,
    toggleBasemap,
    toggleLayerManager,
    showGeoJSONViewer,
    hideGeoJSONViewer,
    showPopup,
    hidePopup,
    showLegend,
    hideLegend,
    closeAllPanels,
  }
})
