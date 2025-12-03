<template>
  <HeaderBar />

  <div class="container">
    <div class="map-wrapper">
      <div id="mapDom" class="map"></div>

      <div id="popup" class="ol-popup" v-show="uiStore.isShowingPopup">
        <a href="#" id="popup-closer" class="ol-popup-closer" @click.prevent="uiStore.hidePopup">X</a>
        <div id="popup-content"></div>
      </div>

      <ChartPanel />
      <SuggestionPanel />
      <LayerManager />
      <MapLegend />
      <GeoJSONViewer />
      <BasemapSelector v-model:visible="uiStore.basemapVisible" @basemap-change="setBasemap" />

      <div class="toolbar">
        <div class="tool-section">
          <span class="section-title">绘制工具</span>
          <el-button :class="{ active: activeTool === 'Point' }" @click="drawFeature('Point')">点</el-button>
          <el-button :class="{ active: activeTool === 'LineString' }" @click="drawFeature('LineString')">线</el-button>
          <el-button :class="{ active: activeTool === 'Polygon' }" @click="drawFeature('Polygon')">多边形</el-button>
        </div>

        <div class="tool-section">
          <span class="section-title">编辑工具</span>
          <el-button @click="selectFeature()">选择</el-button>
          <el-button @click="translateFeature()">移动</el-button>
          <el-button @click="modifyFeature()">修改</el-button>
          <el-button @click="resetStatus()">取消</el-button>
        </div>

        <div class="tool-section">
          <span class="section-title">其他工具</span>
          <el-button @click="clearDrawLayer()">清空</el-button>
          <el-button @click="undo()">撤销</el-button>
          <input type="file" ref="fileInput" accept=".zip,.geojson,.json" style="display: none" @change="handleFileUpload" />
          <el-button @click="fileInput.click()">上传</el-button>
        </div>
      </div>

      <div class="attribute-panel">
        <el-table :data="features" style="width: 100%" max-height="100%" :fit="true">
          <el-table-column prop="id" label="ID" min-width="100"></el-table-column>
          <el-table-column prop="type" label="类型" min-width="100"></el-table-column>
          <el-table-column label="操作" min-width="200">
            <template v-slot="scope">
              <el-button size="small" @click="locateFeature(scope.row)">定位</el-button>
              <el-button size="small" type="danger" @click="deleteFeature(scope.row)">删除</el-button>
              <el-button size="small" @click="viewFeatureGeoJSON(scope.row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import 'ol/ol.css'
import Map from 'ol/Map'
import View from 'ol/View'
import Overlay from 'ol/Overlay'
import { Draw, Select, Translate, Modify } from 'ol/interaction'
import { Vector as VectorLayer } from 'ol/layer'
import ImageLayer from 'ol/layer/Image'
import { Vector as VectorSource } from 'ol/source'
import ImageWMS from 'ol/source/ImageWMS'
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style'
import GeoJSON from 'ol/format/GeoJSON'
import { ref, onMounted, provide } from 'vue'
import { ElMessage } from 'element-plus'

import HeaderBar from '@/components/map/HeaderBar.vue'
import ChartPanel from '@/components/map/ChartPanel.vue'
import LayerManager from '@/components/map/LayerManager.vue'
import MapLegend from '@/components/map/MapLegend.vue'
import GeoJSONViewer from '@/components/map/GeoJSONViewer.vue'
import SuggestionPanel from '@/components/map/SuggestionPanel.vue'
import BasemapSelector from '@/components/basemap/BasemapSelector.vue'

import { useMapStore, useLayersStore, useFeaturesStore, useUIStore, useDataStore } from '@/stores'
import newLayer from '@/utils/newLayer.js'
import shp from 'shpjs'

const mapStore = useMapStore()
const layersStore = useLayersStore()
const featuresStore = useFeaturesStore()
const uiStore = useUIStore()
const dataStore = useDataStore()

const map = ref(null)
const activeTool = ref(null)
const features = ref([])
const fileInput = ref(null)

const draw = ref(null)
const select = ref(null)
const translate = ref(null)
const modify = ref(null)
const popup = ref(null)

provide('map', () => map.value)
provide('loadShp', loadShp)

function initMap() {
  map.value = new Map({
    target: 'mapDom',
    view: new View({
      projection: 'EPSG:3857',
      center: [12758612.973162018, 3562849.0216611675],
      zoom: 17.5,
      minZoom: 2,
      maxZoom: 20,
      smoothResolutionConstraint: true,
    }),
    pixelRatio: 1,
  })

  setBasemap('Gaode')

  popup.value = new Overlay({
    element: document.getElementById('popup'),
    autoPan: true,
  })
  map.value.addOverlay(popup.value)

  mapStore.mapInstance = map.value
}

function setBasemap(name) {
  const layers = map.value.getLayers().getArray()
  layers.forEach((layer) => {
    if (layer.get('type') === 'basemap') {
      map.value.removeLayer(layer)
    }
  })

  const basemapLayer = newLayer(name)
  if (basemapLayer) {
    basemapLayer.set('type', 'basemap')
    basemapLayer.setZIndex(0)
    map.value.addLayer(basemapLayer)
  }
}

function loadShp() {
  if (dataStore.selectedDataType.length === 0 || !dataStore.selectedYear) {
    ElMessage.error('请选择数据类型和数据年份')
    return
  }

  const workspace = 'water_twin'
  let layerName = ''

  const [type1, type2] = dataStore.selectedDataType
  const year = dataStore.selectedYear

  if (type1 === 'landUse' && type2 === 'greenSpace') {
    layerName = `绿地_${year}`
  } else if (type1 === 'greenAccessibility') {
    const accessMap = { walkAccess: '步行可达性', nearAccess: '近邻可达性', driveAccess: '驾车可达性', sumAccess: '总体可达性' }
    layerName = `${accessMap[type2]}_${year}`
  }

  if (!layerName) {
    ElMessage.error('无效的数据类型')
    return
  }

  const existingLayers = map.value.getLayers().getArray()
  existingLayers.forEach((layer) => {
    if (layer.get('type') === 'wms') {
      map.value.removeLayer(layer)
    }
  })

  const wmsLayer = new ImageLayer({
    source: new ImageWMS({
      url: 'http://localhost:8080/geoserver/wms',
      params: { LAYERS: `${workspace}:${layerName}`, TILED: true },
      serverType: 'geoserver',
    }),
  })

  wmsLayer.set('type', 'wms')
  wmsLayer.set('name', layerName)
  wmsLayer.setZIndex(100)

  map.value.addLayer(wmsLayer)
  layersStore.addLayer(layerName, wmsLayer)
  ElMessage.success(`已加载图层: ${layerName}`)
}

function drawFeature(featureType) {
  resetStatus()
  activeTool.value = featureType

  draw.value = new Draw({
    source: layersStore.drawSource,
    type: featureType,
    freehand: false,
    snapTolerance: 12,
    stopClick: true,
    style: new Style({
      fill: new Fill({ color: 'rgba(255, 204, 51, 0.2)' }),
      stroke: new Stroke({ color: '#ffcc33', width: 3 }),
      image: new CircleStyle({ radius: 7, fill: new Fill({ color: '#ffcc33' }) }),
    }),
  })

  draw.value.on('drawend', (event) => {
    const feature = event.feature
    feature.setId(Date.now())
    const geojson = new GeoJSON().writeFeatureObject(feature)
    features.value.push({ id: feature.getId(), type: featureType, feature: feature, geojson: geojson })
    ElMessage.success('绘制完成')
  })

  map.value.addInteraction(draw.value)
}

function selectFeature() {
  resetStatus()
  activeTool.value = 'Select'
  select.value = new Select({ style: new Style({ fill: new Fill({ color: 'rgba(64, 158, 255, 0.3)' }), stroke: new Stroke({ color: '#409eff', width: 3 }) }) })
  map.value.addInteraction(select.value)
}

function translateFeature() {
  resetStatus()
  activeTool.value = 'Translate'
  select.value = new Select()
  translate.value = new Translate({ features: select.value.getFeatures() })
  map.value.addInteraction(select.value)
  map.value.addInteraction(translate.value)
}

function modifyFeature() {
  resetStatus()
  activeTool.value = 'Modify'
  select.value = new Select()
  modify.value = new Modify({ features: select.value.getFeatures() })
  map.value.addInteraction(select.value)
  map.value.addInteraction(modify.value)
}

function resetStatus() {
  activeTool.value = null
  if (draw.value) { map.value.removeInteraction(draw.value); draw.value = null }
  if (select.value) { map.value.removeInteraction(select.value); select.value = null }
  if (translate.value) { map.value.removeInteraction(translate.value); translate.value = null }
  if (modify.value) { map.value.removeInteraction(modify.value); modify.value = null }
}

function clearDrawLayer() {
  if (layersStore.drawSource) {
    layersStore.drawSource.clear()
    features.value = []
    ElMessage.success('已清空绘制图层')
  }
}

function undo() {
  if (layersStore.drawSource) {
    const feats = layersStore.drawSource.getFeatures()
    if (feats.length > 0) {
      layersStore.drawSource.removeFeature(feats[feats.length - 1])
      ElMessage.success('已撤销')
    }
  }
}

function handleFileUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  if (file.name.endsWith('.geojson') || file.name.endsWith('.json')) {
    reader.onload = (e) => {
      try {
        const geojson = JSON.parse(e.target.result)
        const feats = new GeoJSON().readFeatures(geojson, { featureProjection: 'EPSG:3857' })
        layersStore.drawSource.addFeatures(feats)
        ElMessage.success('GeoJSON加载成功')
      } catch (error) {
        ElMessage.error('GeoJSON格式错误')
      }
    }
    reader.readAsText(file)
  } else if (file.name.endsWith('.zip')) {
    reader.onload = (e) => {
      shp(e.target.result).then((geojson) => {
        const feats = new GeoJSON().readFeatures(geojson, { featureProjection: 'EPSG:3857' })
        layersStore.drawSource.addFeatures(feats)
        ElMessage.success('Shapefile加载成功')
      }).catch(() => {
        ElMessage.error('Shapefile加载失败')
      })
    }
    reader.readAsArrayBuffer(file)
  }
}

function locateFeature(row) {
  if (row.feature) {
    const extent = row.feature.getGeometry().getExtent()
    map.value.getView().fit(extent, { padding: [50, 50, 50, 50] })
  }
}

function deleteFeature(row) {
  if (row.feature) {
    layersStore.drawSource.removeFeature(row.feature)
    features.value = features.value.filter((f) => f.id !== row.id)
    ElMessage.success('已删除')
  }
}

function viewFeatureGeoJSON(row) {
  featuresStore.currentFeatureGeoJSON = JSON.stringify(row.geojson, null, 2)
  uiStore.showGeoJSONViewer()
}

onMounted(() => {
  initMap()
  layersStore.initDrawLayer()
  resetStatus()
})
</script>

<style scoped>
.container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

.map-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.map {
  width: 100%;
  height: 100%;
}

.ol-popup {
  position: absolute;
  background-color: white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  padding: 15px;
  border-radius: 10px;
  border: 1px solid #cccccc;
  bottom: 12px;
  left: -50px;
  min-width: 280px;
}

.ol-popup-closer {
  text-decoration: none;
  position: absolute;
  top: 2px;
  right: 8px;
  color: #409eff;
}

.toolbar {
  position: absolute;
  top: 110px;
  left: 20px;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  z-index: 10;
}

.tool-section {
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.tool-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section-title {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
  font-weight: bold;
}

.el-button {
  margin-right: 5px;
  margin-bottom: 5px;
}

.el-button.active {
  background-color: #ffcc33;
  border-color: #ffcc33;
  color: #333;
}

.attribute-panel {
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
  height: 200px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 10;
}
</style>
