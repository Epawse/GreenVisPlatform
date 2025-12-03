<template>
  <!-- 头部导航 -->
  <HeaderBar />

  <div class="container">
    <div class="map-wrapper">
      <!-- 地图相关内容 -->
      <div id="mapDom" class="map"></div>
      
      <!-- 弹出框 -->
      <div id="popup" class="ol-popup glass-panel" v-show="uiStore.isShowingPopup">
        <a href="#" id="popup-closer" class="ol-popup-closer">X</a>
        <div id="popup-content"></div>
      </div>

      <!-- 图表面板 -->
      <div class="chart-panel glass-panel" v-show="uiStore.chartVisible">
        <div class="chart-header">
          <span>{{ chartTitle }}</span>
          <i class="el-icon-close" @click="uiStore.closeChart()"></i>
        </div>
        <!-- 可达性表 -->
        <div class="chart-body-1" v-show="uiStore.chartVisible && dataStore.selectedDataType[0] === 'greenAccessibility'">
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
        <!-- 公平性表 -->
        <div class="chart-body-2" v-show="uiStore.chartVisible && dataStore.selectedDataType[0] === 'greenEquity'">
          <div v-for="(image, index) in images" :key="image" class="block">
            <span class="demonstration">{{ demonstrations[index] }}</span>
            <el-image style="width: 200px; height: 130px" :src="image" :fit="'fill'"></el-image>
          </div>
        </div>
      </div>

      <!-- 建议面板 -->
      <div class="suggestion-panel glass-panel" v-show="uiStore.suggestionVisible">
        <div v-html="suggestionContent"></div>
      </div>

      <!-- 组件：图层管理 -->
      <LayerManager />

      <!-- 组件：工具栏 -->
      <MapTools :activeTool="activeTool" @command="handleCommand" />

      <!-- 组件：底图选择 -->
      <BasemapSelector 
        v-model:visible="uiStore.basemapVisible" 
        @basemap-change="setBasemap" 
      />

      <!-- 图例 -->
      <div class="legend glass-panel" v-show="isLegend">
        <img :src="legendSrc" alt="Legend" v-if="legendSrc" />
      </div>
    </div>

    <!-- GeoJSON 查看区域 -->
    <div class="geojson-viewer glass-panel" v-if="uiStore.geoJSONViewerVisible">
      <el-card class="box-card" style="border: none; background: transparent; box-shadow: none;">
        <div class="clearfix">
          <span>GeoJSON 查看</span>
          <el-button @click="uiStore.hideGeoJSONViewer()" type="text" class="close-button">X</el-button>
        </div>
        <div>
          <vue-json-pretty
            :data="parsedGeoJSON"
            :deep="3"
            selectableType="single"
            :highlightMouseoverNode="true"
            path="res"
          ></vue-json-pretty>
        </div>
      </el-card>
    </div>
  </div>

  <!-- 属性面板 -->
  <div class="attribute-panel glass-panel" v-show="features.length > 0">
    <el-table :data="features" style="width: 100%; background: transparent;" max-height="250" :fit="true">
      <el-table-column prop="id" label="ID" min-width="100"></el-table-column>
      <el-table-column prop="type" label="类型" min-width="100"></el-table-column>
      <el-table-column prop="area" label="面积(m²)" min-width="100">
        <template #default="scope">
          {{ Math.round(scope.row.area * 100) / 100 }}
        </template>
      </el-table-column>
      <el-table-column prop="selected" label="选中" min-width="80">
        <template #default="scope">
          <el-checkbox
            v-model="scope.row.selected"
            @change="onFeatureSelectChange(scope.row)"
          ></el-checkbox>
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="280">
        <template #default="scope">
          <el-button size="small" link type="primary" @click="locateFeature(scope.row)">定位</el-button>
          <el-button size="small" link type="danger" @click="deleteFeature(scope.row)">删除</el-button>
          <el-button size="small" link @click="viewFeatureGeoJSON(scope.row)">JSON</el-button>
          <el-button size="small" link @click="exportFeatureGeoJSON(scope.row)">导出</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
// OpenLayers 样式
import "ol/ol.css";

// OpenLayers Core
import Map from "ol/Map";
import View from "ol/View";
import { Vector as VectorLayer } from "ol/layer";
import TileLayer from "ol/layer/Tile.js";
import { OSM, Vector as VectorSource, TileWMS } from "ol/source";
import { Fill, Stroke, Style, Circle, Circle as CircleStyle } from "ol/style";
import { Point, LineString } from "ol/geom";
import { Draw, Select, Translate, Modify } from "ol/interaction";
import { Collection } from "ol";
import { getCenter, getHeight, getWidth } from "ol/extent";
import { platformModifierKeyOnly, primaryAction, singleClick, never } from "ol/events/condition.js";
import { getLength } from "ol/sphere";
import { toStringHDMS } from "ol/coordinate.js";
import { toLonLat } from "ol/proj";
import Overlay from "ol/Overlay";
import GeoJSON from "ol/format/GeoJSON";
import Zoom from "ol/control/Zoom.js";
import ZoomSlider from "ol/control/ZoomSlider.js";
import ZoomToExtent from "ol/control/ZoomToExtent.js";
import ScaleLine from "ol/control/ScaleLine.js";
import MousePosition from "ol/control/MousePosition.js";
import { OverviewMap } from "ol/control.js";
import { createStringXY } from "ol/coordinate.js";

// External Libs
import VueJsonPretty from "vue-json-pretty/lib/vue-json-pretty.js";
import "vue-json-pretty/lib/styles.css";
import shp from "shpjs";
import * as d3 from "d3";
import { ElMessage } from "element-plus";
import { mapWritableState, mapStores } from 'pinia';

// Stores
import { useDataStore, useUIStore, useLayersStore, useMapStore } from '@/stores';

// Components
import HeaderBar from "@/components/map/HeaderBar.vue";
import LayerManager from "@/components/map/LayerManager.vue";
import MapTools from "@/components/map/MapTools.vue";
import BasemapSelector from "@/components/basemap/BasemapSelector.vue";

// Utils
import newLayer from "../utils/newLayer.js";

export default {
  components: {
    VueJsonPretty,
    HeaderBar,
    LayerManager,
    MapTools,
    BasemapSelector,
  },
  provide() {
    return {
      loadShp: this.loadShp
    }
  },
  data() {
    return {
      // Map Core
      map: {},
      view: null,
      zoom: null,
      center: null,
      rotation: null,

      // Drawing
      drawSource: null, // Will get from store
      drawVector: null, // Will get from store
      draw: {},
      features: [],
      idList: [],
      undoStack: [],

      // Interactions
      select: null,
      activeTool: null,
      measureInteraction: null,
      modify: null,
      translate: null,
      transform: null,

      // GeoJSON
      selectedFeatureGeoJSON: null,
      parsedGeoJSON: null,

      // Chart Data
      chartData: [],
      images: [],
      demonstrations: [],
      tableData: [],
      tableHeaders: [],

      // Legend
      legendSrc: null,
      isLegend: false,

      // Suggestion
      suggestionContent: "",

      // Styles
      myStyle: new Style({
        fill: new Fill({
          color: "rgba(245, 243, 240, 0.6)",
        }),
        stroke: new Stroke({
          color: "#ffcc33",
          width: 2,
        }),
        image: new Circle({
          radius: 7,
          fill: new Fill({
            color: "#ffcc33",
          }),
        }),
      }),
    };
  },
  computed: {
    ...mapWritableState(useDataStore, ['selectedDataType', 'selectedYear', 'selectedPolicy', 'isPredict']),
    ...mapStores(useUIStore, useLayersStore, useMapStore, useDataStore),
    
    chartTitle() {
        if (this.selectedDataType[0] === 'greenEquity') return "绿地公平性指标";
        return `${this.selectedYear} 年绿地可达性指标`;
    }
  },
  watch: {
    // Watch for Data Store changes to trigger logic
    'dataStore.selectedDataType': {
        handler() {
             // Logic moved to Store watcher or handled by loadShp
        }
    },
    // Watch for UI store changes that might need map interaction
    'uiStore.chartVisible': {
        handler(val) {
            if (val) this.showChart();
        }
    },
    'uiStore.suggestionVisible': {
        handler(val) {
            if (val) this.showSeggestion();
        }
    }
  },
  mounted() {
    this.initMap();
    this.initDrawLayer(); // Use Store
    this.resetStatus();
  },
  methods: {
    // Command Handler from MapTools
    handleCommand(cmd, ...args) {
        if (typeof this[cmd] === 'function') {
            this[cmd](...args);
        } else {
            console.warn(`Command ${cmd} not found`);
        }
    },

    // Initialize Map
    initMap() {
      this.map = new Map({
        target: "mapDom",
        view: new View({
          projection: "EPSG:3857",
          center: [12758612.973162018, 3562849.0216611675],
          zoom: 17.5,
          minZoom: 2,
          maxZoom: 20,
          smoothResolutionConstraint: true,
        }),
        pixelRatio: 1,
      });

      // Set Map Instance in Store
      this.mapStore.setMapInstance(this.map);

      // Default Basemap
      this.setBasemap("Gaode");

      this.view = this.map.getView();
      this.zoom = this.view.getZoom();
      this.center = this.view.getCenter();
      this.rotation = this.view.getRotation();

      // Controls
      this.map.addControl(new Zoom());
      this.map.addControl(new ZoomSlider());
      this.map.addControl(new ZoomToExtent());
      
      const baseLayer = this.map.getLayers().item(0);
      const miniMap = new OverviewMap({
        className: "ol-overviewmap ol-custom-overviewmap",
        collapsed: false,
        layers: [new TileLayer({ source: baseLayer.getSource() })],
      });
      this.map.addControl(miniMap);

      const mousePos = new MousePosition({
        coordinateFormat: createStringXY(4),
        projection: "EPSG:4326",
      });
      this.map.addControl(mousePos);

      this.scale = new ScaleLine();
      this.map.addControl(this.scale);

      // Select Interaction
      this.select = new Select({
        condition: singleClick,
        toggleCondition: platformModifierKeyOnly,
        style: new Style({
          fill: new Fill({ color: "rgba(255, 255, 0, 0.7)" }),
          stroke: new Stroke({ color: "rgba(0, 0, 0, 0.7)", width: 2 }),
          image: new Circle({
            radius: 7,
            fill: new Fill({ color: "rgba(0, 0, 0, 0.7)" }),
          }),
        }),
      });
      this.map.addInteraction(this.select);
    },

    initDrawLayer() {
        // Initialize via Store
        this.layersStore.initDrawLayer();
        // Link local references to Store
        this.drawSource = this.layersStore.drawSource;
        this.drawVector = this.layersStore.drawLayer;
    },

    resetStatus() {
      this.activeTool = null;
      this.map.removeInteraction(this.draw);
      this.map.removeInteraction(this.modify);
      this.map.removeInteraction(this.translate);
      this.map.removeInteraction(this.transform);
      this.map.removeInteraction(this.measureInteraction);
      this.select.getFeatures().clear();
      this.select.setActive(false);
      this.features.forEach((row) => { row.selected = false; });
      this.uiStore.hidePopup();
    },

    loadShp() {
      if (this.selectedDataType.length === 0 || !this.selectedYear) {
        ElMessage.error("请选择政策类型和数据年份");
        return;
      } 

      let url;
      let workspace;
      let layerName;
      switch (this.selectedDataType[0]) {
        case "landuse":
          workspace = "Landuse";
          layerName = "土地利用";
          break;
        case "greenAccessibility":
          workspace = "GreenAccessibility";
          layerName = "绿地可达性";
          break;
        case "greenEquity":
          workspace = "GreenEquity";
          break;
        case "others":
          workspace = "Others";
          break;
      }
      url = `http://35.234.26.196:8080/geoserver/${workspace}/wms`;
      const params = {
        LAYERS: `${workspace}:${this.selectedDataType[0]}_${this.selectedDataType[1]}_${this.selectedPolicy}_${this.selectedYear}`,
        TILED: true,
        STYLES: `${this.selectedDataType[0]}_${this.selectedDataType[1]}_style`,
      };

      const shpLayer = new TileLayer({
        properties: {
          name: layerName + `_${this.selectedDataType[1]}_${this.selectedPolicy}_${this.selectedYear}`,
        },
        source: new TileWMS({
          url,
          params,
          serverType: "geoserver",
          transition: 0,
          projection: "EPSG:4326",
        }),
      });

      // Use Store to Add Layer
      this.layersStore.addLayer(shpLayer.getProperties().name, shpLayer);

      // Load GeoJSON for overlay
      let geojsonFilePath;
      if (this.selectedDataType[0] === "landuse") {
        geojsonFilePath = "/geojson/greenAccessibility_2030.geojson";
      } else {
        geojsonFilePath = `/geojson/${this.selectedDataType[0]}_${this.selectedYear}.geojson`;
      }

      fetch(geojsonFilePath)
        .then((response) => response.json())
        .then((data) => {
          const features = new GeoJSON().readFeatures(data);
          const source = new VectorSource();
          source.addFeatures(features);
          
           // Overlay Layer (transparent)
           const layer = new VectorLayer({
              source: source,
              style: new Style({
                  fill: new Fill({ color: "rgba(0, 0, 0, 0)" }),
                  stroke: new Stroke({ color: "rgba(0,0,0,0)", width: 0.5 }),
              }),
              zIndex: 1000
            });
            
            this.map.addLayer(layer); // Add directly to map, maybe track later
            this.map.getView().fit(source.getExtent());
        })
        .catch((error) => {
          console.error("获取GeoJSON数据失败:", error);
        });

      // Legend Logic
      if (this.selectedDataType[0] === "landuse") {
          this.legendSrc = "/images/legend_landuse.png";
          this.isLegend = true;
        } else if (this.selectedDataType[0] === "greenAccessibility") {
          this.isLegend = true;
          if (this.selectedDataType[1] === "walk") {
            this.legendSrc = "/images/legend_walk.png";
          } else if (this.selectedDataType[1] === "near") {
            this.legendSrc = "/images/legend_near.png";
          } else if (this.selectedDataType[1] === "car") {
            this.legendSrc = "/images/legend_car.png";
          } else if (this.selectedDataType[1] === "sum") {
            this.legendSrc = "/images/legend_sum.png";
          }
        } else {
          this.isLegend = false;
        }
    },

    showChart() {
        // Simplified chart logic using store data
       if (this.selectedDataType[0] === "greenEquity") {
        this.images = ["/images/步行公平性.png", "/images/驾车公平性.png", "/images/近邻公平性.png", "/images/总体公平性.png"];
        this.demonstrations = ["步行公平性", "驾车公平性", "近邻公平性", "总体公平性"];
      } else if (this.selectedDataType[0] === "greenAccessibility") {
        const tableUrl = `/tables/分区统计Aij_${this.selectedYear}.csv`;
        d3.csv(tableUrl).then((data) => {
            this.tableHeaders = Object.keys(data[0]);
            this.tableData = data;
        }).catch(() => {
            ElMessage.error("加载表格数据失败");
        });
      }
    },

    showSeggestion() {
      const suggestionUrl = `/suggestions/suggestion_${this.selectedYear}.txt`;
      fetch(suggestionUrl)
        .then((response) => response.text())
        .then((text) => {
          this.suggestionContent = text.replace(/\n/g, "<br>");
        })
        .catch(() => {
          ElMessage.error("加载建议内容失败");
        });
    },

    setBasemap(name) {
      const layers = this.map.getLayers();
      // Remove existing tile layers (simplified)
      layers.getArray().slice().forEach((layer) => {
        if (layer instanceof TileLayer && layer !== this.layersStore.drawLayer) { // Preserve draw layer if it was tile? No, draw is Vector.
            // Check if it's one of our base layers
           this.map.removeLayer(layer);
        }
      });

      if (name === "None") return;
      const layer = newLayer(name);
      this.map.getLayers().insertAt(0, layer);
    },

    // Draw Feature
    drawFeature(featureType) {
      this.resetStatus();
      this.activeTool = featureType;

      this.draw = new Draw({
        source: this.drawSource,
        type: featureType,
        freehand: false,
        snapTolerance: 12,
        stopClick: true,
        style: new Style({
          fill: new Fill({ color: "rgba(255, 255, 255, 0.8)" }),
          stroke: new Stroke({ color: "#ffcc33", width: 2 }),
          image: new Circle({ radius: 7, fill: new Fill({ color: "#ffcc33" }) }),
        }),
      });
      this.map.addInteraction(this.draw);

      this.draw.on("drawend", (event) => {
        const feature = event.feature;
        const type = feature.getGeometry().getType();
        let id = this.randomId();
        feature.setId(id);
        feature.setStyle(this.myStyle);
        let area = 0;
        if (type === "Polygon") area = feature.getGeometry().getArea();

        this.features.unshift({
          id: feature.getId(),
          type: type,
          area: area,
          selected: false,
        });
        this.undoStack.push(this.drawSource.getFeatures());
      });
    },
    
    randomId() {
      const id = Math.floor(Math.random() * 10000);
      if (this.idList.includes(id)) return this.randomId();
      this.idList.push(id);
      return id;
    },
    
    undo() {
      if (this.undoStack.length >= 1) {
        let lastStep = this.undoStack[this.undoStack.length - 1];
        this.undoStack.pop();
        this.drawSource.clear();
        this.drawSource.addFeatures(lastStep);
        this.features = lastStep;
      }
    },

    clearDrawLayer() {
        this.layersStore.clearDrawLayer();
        this.features = [];
        this.undoStack = [];
        this.map.getOverlays().clear();
        this.resetStatus();
    },

    measureDistance() {
        this.resetStatus();
        this.activeTool = "measureDistance";
        this.measureInteraction = new Draw({
            source: this.drawSource,
            type: "LineString",
            style: new Style({
                stroke: new Stroke({ color: "rgba(0, 0, 255, 0.5)", lineDash: [10, 10], width: 2 }),
            }),
        });
        this.map.addInteraction(this.measureInteraction);
        
        this.measureInteraction.on("drawstart", (event) => {
            this.createMeasureTooltip(event.feature);
        });
        this.measureInteraction.on("drawend", (event) => {
             const feature = event.feature;
             feature.setStyle(new Style({
                 stroke: new Stroke({ color: "rgba(0, 0, 255, 0.5)", lineDash: [10, 10], width: 3 }),
             }));
             this.createFinalTooltip(feature);
        });
    },

    createMeasureTooltip(feature) {
      let tooltipElement = document.createElement("div");
      tooltipElement.className = "ol-tooltip ol-tooltip-measure";
      tooltipElement.innerHTML = "起点";
      const tooltip = new Overlay({
        element: tooltipElement,
        offset: [0, -15],
        positioning: "bottom-center",
      });
      this.map.addOverlay(tooltip);
      feature.getGeometry().on("change", (evt) => {
        const geom = evt.target;
        const coordinates = geom.getCoordinates();
        const totalLength = this.formatLength(geom);
        tooltipElement.innerHTML = `总长: ${totalLength}`;
        tooltip.setPosition(coordinates[coordinates.length - 1]);
      });
    },

    createFinalTooltip(feature) {
        const geom = feature.getGeometry();
        const coordinates = geom.getCoordinates();
        coordinates.forEach((coordinate, index) => {
            if (index === 0) return;
            const segmentLength = this.formatLength(new LineString([coordinates[index - 1], coordinate]));
            let tooltipElement = document.createElement("div");
            tooltipElement.className = "ol-tooltip ol-tooltip-measure";
            tooltipElement.innerHTML = `段长: ${segmentLength}`;
            const tooltip = new Overlay({
                element: tooltipElement,
                offset: [0, 15],
                positioning: "bottom-center",
            });
            this.map.addOverlay(tooltip);
            tooltip.setPosition(coordinate);
        });
    },
    
    formatLength(line) {
        const length = getLength(line);
        if (length > 100) return Math.round((length / 1000) * 100) / 100 + " km";
        return Math.round(length * 100) / 100 + " m";
    },

    selectFeature() {
        this.resetStatus();
        this.activeTool = 'selectFeature';
        this.select.setActive(true);
        
        // Sync with local features list
        // Note: this.select is already added to map in initMap
        this.select.on("select", (event) => {
             const selected = event.selected;
             const deselected = event.deselected;
             selected.forEach((feature) => {
                 const row = this.features.find(r => r.id === feature.getId());
                 if (row) row.selected = true;
             });
             deselected.forEach((feature) => {
                 const row = this.features.find(r => r.id === feature.getId());
                 if (row) row.selected = false;
             });
        });
    },
    
    checkArea() {
        this.resetStatus();
        this.activeTool = 'checkArea';
        this.uiStore.showPopup();
        this.select.setActive(true);
        
        const container = document.getElementById("popup");
        const content = document.getElementById("popup-content");
        const closer = document.getElementById("popup-closer");
        
        const overlay = new Overlay({ element: container });
        closer.onclick = () => {
            overlay.setPosition(undefined);
            closer.blur();
            return false;
        };
        this.map.addOverlay(overlay);
        
        this.select.on("select", (e) => {
             e.target.getFeatures().getArray().forEach((item) => {
                 const props = item.getProperties();
                 let html = `<p>地块名称: ${props.SQNAME || '未知'}</p>`;
                 if (props.near_Aij_n) html += `<p>near_Aij_n: ${props.near_Aij_n}</p>`;
                 // ... Add other props
                 content.innerHTML = html;
                 overlay.setPosition(item.getGeometry().getCoordinates());
             });
        });
        
        this.map.on("singleclick", (evt) => {
             overlay.setPosition(evt.coordinate);
        });
    },
    
    translateFeature() {
        this.resetStatus();
        this.activeTool = "translateFeature";
        this.translate = new Translate({ features: this.select.getFeatures() });
        this.map.addInteraction(this.translate);
        // Enable select to choose what to translate
        this.select.setActive(true);
    },
    
    editVertices() {
        this.resetStatus();
        this.activeTool = "editVertices";
        this.modify = new Modify({ source: this.drawSource });
        this.map.addInteraction(this.modify);
    },
    
    rotateFeature() {
      this.resetStatus();
      this.activeTool = "rotateFeature";

      // 对每个要素启用旋转
      this.features.forEach((row) => {
        const feature = this.drawSource.getFeatureById(row.id);
        if (feature) {
          this.enableFeatureRotate(feature);
        }
      });

      // 初始化默认样式
      this.defaultStyle = new Modify({ source: this.drawSource })
        .getOverlay()
        .getStyleFunction();
    },

    enableFeatureRotate(feature) {
      // 旋转交互
      this.transform = new Modify({
        source: this.drawSource,
        features: new Collection([feature]),
        condition: (event) => {
          return primaryAction(event) && !platformModifierKeyOnly(event);
        },
        deleteCondition: never,
        insertVertexCondition: never,
        // 旋转样式
        style: (feature) => {
          feature.get("features").forEach((modifyFeature) => {
            const modifyGeometry = modifyFeature.get("modifyGeometry");
            // 如果有旋转要素，则进行旋转
            if (modifyGeometry) {
              const point = feature.getGeometry().getCoordinates();
              let modifyPoint = modifyGeometry.point;
              // 如果没有旋转点，则设置旋转点
              if (!modifyPoint) {
                modifyPoint = point;
                modifyGeometry.point = modifyPoint;
                modifyGeometry.geometry0 = modifyGeometry.geometry;
                const result = this.calculateCenter(modifyGeometry.geometry0);
                modifyGeometry.center = result.center;
                modifyGeometry.minRadius = result.minRadius;
              }
              // 计算旋转中心，最小半径，坐标
              const center = modifyGeometry.center;
              const minRadius = modifyGeometry.minRadius;
              const coordinates = modifyGeometry.geometry.getCoordinates();
              let dx, dy;
              dx = modifyPoint[0] - center[0];
              dy = modifyPoint[1] - center[1];
              const initialRadius = Math.sqrt(dx * dx + dy * dy);
              if (initialRadius > minRadius) {
                const initialAngle = Math.atan2(dy, dx);
                dx = point[0] - center[0];
                dy = point[1] - center[1];
                const currentRadius = Math.sqrt(dx * dx + dy * dy);
                if (currentRadius > 0) {
                  const currentAngle = Math.atan2(dy, dx);
                  const geometry = modifyGeometry.geometry0.clone();
                  geometry.scale(currentRadius / initialRadius, undefined, center);
                  geometry.rotate(currentAngle - initialAngle, center);
                  modifyGeometry.geometry = geometry;
                }
              }
            }
          });
          return this.defaultStyle(feature);
        },
      });

      // 添加旋转交互
      this.map.addInteraction(this.transform);
      this.transform.on("modifystart", (event) => {
        // 保存旋转前的要素
        event.features.forEach((feature) => {
          feature.set("modifyGeometry", { geometry: feature.getGeometry().clone() }, true);
        });
      });

      // 旋转结束
      this.transform.on("modifyend", (event) => {
        event.features.forEach((feature) => {
          // 旋转结束后，删除旋转前的要素
          const modifyGeometry = feature.get("modifyGeometry");
          if (modifyGeometry) {
            feature.setGeometry(modifyGeometry.geometry);
            feature.unset("modifyGeometry", true);
          }
        });
      });
    },

    calculateCenter(geometry) {
      let center, coordinates, minRadius;
      const type = geometry.getType();
      if (type === "Polygon") {
        let x = 0;
        let y = 0;
        let i = 0;
        coordinates = geometry.getCoordinates()[0].slice(1);
        coordinates.forEach((coordinate) => {
          x += coordinate[0];
          y += coordinate[1];
          i++;
        });
        center = [x / i, y / i];
      } else if (type === "LineString") {
        center = geometry.getCoordinateAt(0.5);
        coordinates = geometry.getCoordinates();
      } else {
        center = getCenter(geometry.getExtent());
      }
      let sqDistances;
      if (coordinates) {
        sqDistances = coordinates.map((coordinate) => {
          const dx = coordinate[0] - center[0];
          const dy = coordinate[1] - center[1];
          return dx * dx + dy * dy;
        });
        minRadius = Math.sqrt(Math.max.apply(Math, sqDistances)) / 3;
      } else {
        minRadius = Math.max(getWidth(geometry.getExtent()), getHeight(geometry.getExtent())) / 3;
      }
      return {
        center: center,
        coordinates: coordinates,
        minRadius: minRadius,
        sqDistances: sqDistances,
      };
    },

    // View Actions
    onMoveWh() {
        this.view.animate({
            center: [12709423.397, 2591463.4625],
            zoom: 11,
            duration: 1000
        });
    },
    onRestore() {
         this.view.animate({
             zoom: 17.5,
             center: [12758612.973162018, 3562849.0216611675],
             duration: 1000
         });
    },

    // Feature Actions
    onFeatureSelectChange(row) {
        const feature = this.drawSource.getFeatureById(row.id);
        if (row.selected) this.select.getFeatures().push(feature);
        else this.select.getFeatures().remove(feature);
    },
    locateFeature(row) {
         const feature = this.drawSource.getFeatureById(row.id);
         if (feature) this.view.fit(feature.getGeometry().getExtent(), { duration: 1000 });
    },
    deleteFeature(row) {
         const feature = this.drawSource.getFeatureById(row.id);
         if (feature) {
             this.drawSource.removeFeature(feature);
             this.features = this.features.filter(f => f.id !== row.id);
         }
    },
    viewFeatureGeoJSON(row) {
         const feature = this.drawSource.getFeatureById(row.id);
         if (feature) {
             this.parsedGeoJSON = new GeoJSON().writeFeatureObject(feature);
             this.uiStore.showGeoJSONViewer();
         }
    },
    exportFeatureGeoJSON(row) {
         const feature = this.drawSource.getFeatureById(row.id);
         if (feature) {
            const geojson = new GeoJSON().writeFeature(feature);
            const blob = new Blob([geojson], { type: "application/json" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `feature-${row.id}.geojson`;
            link.click();
         }
    }
  }
};
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.map-wrapper {
  position: relative;
  flex: 1;
  width: 100%;
  height: 100%;
}

.map {
  width: 100%;
  height: 100%;
}

.chart-panel {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 300px;
  z-index: 500;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.chart-header {
  padding: 12px 20px;
  border-bottom: 1px solid var(--glass-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.suggestion-panel {
  position: absolute;
  top: 110px;
  right: 300px; /* Next to Layer Manager */
  width: 300px;
  padding: 20px;
  z-index: 500;
}

.attribute-panel {
  position: absolute;
  bottom: 20px;
  left: 20px;
  width: 700px;
  max-height: 300px;
  z-index: 400;
  padding: 10px;
}

.legend {
  position: absolute;
  bottom: 20px;
  right: 20px;
  padding: 8px;
  z-index: 400;
}

.legend img {
  max-width: 200px;
  display: block;
}

.ol-popup {
  position: absolute;
  bottom: 12px;
  left: -50px;
  min-width: 280px;
  padding: 15px;
}

.ol-popup-closer {
  text-decoration: none;
  position: absolute;
  top: 2px;
  right: 8px;
  color: var(--text-secondary);
}

.geojson-viewer {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 500px;
    height: 400px;
    z-index: 2000;
    overflow: hidden;
}

/* Table Override for Glass */
:deep(.el-table), :deep(.el-table__expanded-cell) {
    background-color: transparent;
}
:deep(.el-table tr), :deep(.el-table th.el-table__cell) {
    background-color: transparent;
}
:deep(.el-table td.el-table__cell), :deep(.el-table th.el-table__cell.is-leaf) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}
</style>