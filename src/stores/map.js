import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Map, View } from 'ol'
import { Zoom, ZoomSlider, ScaleLine, MousePosition } from 'ol/control'
import { createStringXY } from 'ol/coordinate'
import { transform } from 'ol/proj'

export const useMapStore = defineStore('map', () => {
  // State
  const mapInstance = ref(null)
  const view = ref(null)
  const zoom = ref(17.5)
  const center = ref([12758612.973162018, 3562849.0216611675]) // 深圳
  const rotation = ref(0)

  // Initial values for restore
  const initialZoom = 17.5
  const initialCenter = [12758612.973162018, 3562849.0216611675]
  const initialRotation = 0

  // Getters
  const currentZoom = computed(() => view.value?.getZoom() || zoom.value)
  const currentCenter = computed(() => view.value?.getCenter() || center.value)
  const currentRotation = computed(() => view.value?.getRotation() || rotation.value)

  // Actions
  function initMap(targetId) {
    // 创建视图
    view.value = new View({
      projection: 'EPSG:3857',
      center: center.value,
      zoom: zoom.value,
      minZoom: 2,
      maxZoom: 20,
      smoothResolutionConstraint: true, // 平滑缩放
    })

    // 创建地图
    mapInstance.value = new Map({
      target: targetId,
      view: view.value,
      // 性能优化配置
      pixelRatio: 1, // 使用物理像素比1，提高性能
    })

    // 创建控件
    const zoomControl = new Zoom()
    const zoomSliderControl = new ZoomSlider()
    const scaleLineControl = new ScaleLine({ units: 'metric' })
    const mousePositionControl = new MousePosition({
      coordinateFormat: createStringXY(4),
      projection: 'EPSG:4326',
      className: 'custom-mouse-position',
      target: document.getElementById('mouse-position'),
      undefinedHTML: '&nbsp;',
    })

    // 添加控件
    mapInstance.value.addControl(zoomControl)
    mapInstance.value.addControl(zoomSliderControl)
    mapInstance.value.addControl(scaleLineControl)
    mapInstance.value.addControl(mousePositionControl)

    // 监听视图变化
    view.value.on('change:zoom', () => {
      zoom.value = view.value.getZoom()
    })

    view.value.on('change:center', () => {
      center.value = view.value.getCenter()
    })

    view.value.on('change:rotation', () => {
      rotation.value = view.value.getRotation()
    })

    console.log('地图初始化完成')
  }

  function zoomIn() {
    if (view.value) {
      view.value.animate({
        zoom: view.value.getZoom() + 1,
        duration: 250,
      })
    }
  }

  function zoomOut() {
    if (view.value) {
      view.value.animate({
        zoom: view.value.getZoom() - 1,
        duration: 250,
      })
    }
  }

  function restore() {
    if (view.value) {
      view.value.animate({
        center: initialCenter,
        zoom: initialZoom,
        rotation: initialRotation,
        duration: 500,
      })
    }
  }

  function moveToShenzhen() {
    if (view.value) {
      // 武汉坐标 (114.305, 30.593)
      const whCenter = transform([114.305, 30.593], 'EPSG:4326', 'EPSG:3857')
      view.value.animate({
        center: whCenter,
        zoom: 10,
        duration: 1000,
      })
    }
  }

  function setZoom(newZoom) {
    if (view.value) {
      view.value.setZoom(newZoom)
    }
  }

  function setCenter(newCenter) {
    if (view.value) {
      view.value.setCenter(newCenter)
    }
  }

  function fitExtent(extent, options = {}) {
    if (view.value && extent) {
      const defaultOptions = {
        padding: [50, 50, 50, 50],
        duration: 1000,
        ...options,
      }
      view.value.fit(extent, defaultOptions)
    }
  }

  function setMapInstance(map) {
    mapInstance.value = map
    view.value = map.getView()

    // 绑定视图事件监听
    if (view.value) {
      view.value.on('change:zoom', () => {
        zoom.value = view.value.getZoom()
      })
      view.value.on('change:center', () => {
        center.value = view.value.getCenter()
      })
      view.value.on('change:rotation', () => {
        rotation.value = view.value.getRotation()
      })
    }

    console.log('Map instance set in store')
  }

  return {
    // State
    mapInstance,
    view,
    zoom,
    center,
    rotation,

    // Getters
    currentZoom,
    currentCenter,
    currentRotation,

    // Actions
    initMap,
    zoomIn,
    zoomOut,
    restore,
    moveToShenzhen,
    setZoom,
    setCenter,
    fitExtent,
    setMapInstance,
  }
})

