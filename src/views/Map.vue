<template>
  <div class="header">
    <!-- 头部内容 -->
    <div class="logo">
      <img src="/icon.png" alt="Logo Icon" class="logo-icon" />
      <span>城市绿色空间展示平台</span>
    </div>
    <div class="nav">
      <el-cascader
        v-model="selectedDataType"
        placeholder="请选择数据类型"
        :options="typeOptions"
        :props="{ expandTrigger: 'hover' }"
        size="large"
        style="width: 180px"
      >
      </el-cascader>

      <el-select
        v-model="selectedYear"
        placeholder="请选择数据年份"
        size="large"
        style="width: 180px"
      >
        <el-option
          v-for="year in yearOptions"
          :key="year"
          :label="year"
          :value="year"
          :disabled="isYearDisabled(year)"
        ></el-option>
      </el-select>

      <el-select
        v-model="selectedPolicy"
        placeholder="请选择政策"
        size="large"
        style="width: 180px"
        :disabled="isPolicyDisabled"
      >
        <el-option
          v-for="policy in policyOptions"
          :key="policy.value"
          :label="policy.label"
          :value="policy.value"
        ></el-option>
      </el-select>

      <el-button @click="loadShp()" size="large">确定</el-button>
      <el-button
        @click="toggleChart()"
        size="large"
        :class="{ active: chartVisible }"
        >查看图表</el-button
      >
      <el-button
        @click="toggleSeggestion()"
        size="large"
        :class="{ active: suggestionVisible }"
        >查看建议</el-button
      >

      <el-button @click="toggleBasemap()" size="large">底图</el-button>
    </div>
  </div>

  <div class="container">
    <div class="map-wrapper">
      <!-- 地图相关内容 -->
      <div id="mapDom" class="map"></div>
      <!-- 弹出框 -->
      <div id="popup" class="ol-popup" v-show="isShowingPopup">
        <a href="#" id="popup-closer" class="ol-popup-closer">X</a>
        <div id="popup-content"></div>
      </div>
      <!-- 图表面板 -->
      <div class="chart-panel" v-show="chartVisible">
        <div class="chart-header" v-show="chartVisible">
          <span>{{ selectedYear }} 年绿地可达性与公平性指标</span>
          <i class="el-icon-close" @click="chartVisible = false"></i>
        </div>
        <!-- 可达性表 -->
        <div class="chart-body-1" v-show="chart_1_visible">
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
        <div class="chart-body-2" v-show="chart_2_visible">
          <div v-for="(image, index) in images" :key="image" class="block">
            <span class="demonstration">{{ demonstrations[index] }}</span>
            <el-image
              style="width: 200px; height: 130px"
              :src="image"
              :fit="fill"
            ></el-image>
          </div>
        </div>
      </div>
      <!-- 建议面板 -->
      <div class="suggestion-panel" v-show="suggestionVisible">
        <div v-html="suggestionContent"></div>
      </div>
      <!-- 底图选择 -->
      <div v-if="basemapVisible" class="basemap-container">
        <div
          v-for="basemap in basemaps"
          :key="basemap.name"
          class="basemap-item"
          @click="setBasemap(basemap.name)"
        >
          <img :src="basemap.thumbnail" :alt="basemap.name" />
          <span>{{ basemap.name }}</span>
        </div>
      </div>
      <!-- 工具栏 -->
      <div class="toolbar">
        <!-- 第一组按钮 -->
        <el-button-group class="button-group" vertical>
          <el-button
            :class="{ active: activeTool === 'Point' }"
            @click="drawFeature('Point')"
            >画点</el-button
          >
          <el-button
            :class="{ active: activeTool === 'LineString' }"
            @click="drawFeature('LineString')"
            >画线</el-button
          >
          <el-button
            :class="{ active: activeTool === 'Polygon' }"
            @click="drawFeature('Polygon')"
            >画面</el-button
          >
        </el-button-group>

        <!-- 第二组按钮 -->
        <el-button-group class="button-group" vertical>
          <el-button @click="undo()">撤回</el-button>
          <el-button @click="resetStatus()">取消</el-button>
          <el-button @click="clearDrawLayer()">清除</el-button>
          <el-button
            :class="{ active: activeTool === 'measureDistance' }"
            @click="measureDistance()"
            >测距</el-button
          >
        </el-button-group>

        <!-- 第三组按钮 -->
        <el-button-group class="button-group" vertical>
          <el-button
            :class="{ active: activeTool === 'selectFeature' }"
            @click="selectFeature()"
            >选择</el-button
          >
          <el-button
            :class="{ active: activeTool === 'translateFeature' }"
            @click="translateFeature()"
            >平移</el-button
          >
          <el-button
            :class="{ active: activeTool === 'editVertices' }"
            @click="editVertices()"
            >编辑</el-button
          >
          <el-button
            :class="{ active: activeTool === 'rotateFeature' }"
            @click="rotateFeature()"
            >旋转</el-button
          >
        </el-button-group>
      </div>
      <!-- 地图控件 -->
      <div class="map-controls">
        <el-button-group class="button-group" vertical>
          <el-button @click="onZoom(true)">放大一级</el-button>
          <el-button @click="onZoom(false)">缩小一级</el-button>
          <el-button @click="onMoveWh()">移动到深圳</el-button>
        </el-button-group>
        <el-button-group class="button-group" vertical>
          <el-button @click="onRestore()">复位</el-button>
          <el-button @click="onScaleChange('line')">比例尺线</el-button>
          <el-button @click="onScaleChange('bar')">比例尺条</el-button>
          <el-button @click="openFileUpload()">上传</el-button>
          <input
            type="file"
            ref="fileInput"
            accept=".json,.geojson,.zip"
            @change="onFileUpload"
            style="display: none"
          />
        </el-button-group>
        <el-button-group class="button-group" vertical>
          <el-button @click="testWMTS()">测试WMTS</el-button>
          <el-button @click="testWFS()">测试WFS</el-button>
          <el-button
            :class="{ active: activeTool === 'checkArea' }"
            @click="checkArea()"
            >查看地块</el-button
          >
        </el-button-group>
      </div>

      <!-- 图层管理 -->
      <div class="layer-manager-container">
        <el-button
          @click="toggleLayerManager"
          type="primary"
          class="toggle-button"
        >
          {{ layerManagerVisible ? "-->" : "<--" }}
        </el-button>
        <transition name="slide-fade">
          <div v-show="layerManagerVisible" class="layer-manager">
            <el-card class="layer-card">
              <div class="header">
                <span>图层管理</span>
              </div>
              <el-checkbox-group v-model="checks" class="layer-checkbox-group">
                <VueDraggable
                  ref="el"
                  v-model="layers"
                  :animation="150"
                  ghostClass="ghost"
                  class="flex flex-col gap-2 p-4 w-300px h-300px m-auto bg-gray-500/5 rounded"
                  @update="onLayersUpdate"
                >
                  <el-checkbox
                    v-for="layer in layers"
                    :key="layer.name"
                    :label="layer.name"
                    @change="toggleLayer(layer)"
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

      <!-- 图例 -->
      <div class="legend">
        <img :src="legendSrc" alt="Legend" style="" v-show="isLegend" />
      </div>
    </div>

    <!-- GeoJSON 查看区域 -->
    <div class="geojson-viewer" v-if="geoJSONViewerVisible">
      <el-card>
        <div class="clearfix">
          <span>GeoJSON 查看</span>
          <el-button
            @click="closeGeoJSONViewer"
            type="text"
            class="close-button"
            >X</el-button
          >
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
  <div class="attribute-panel">
    <el-table
      :data="features"
      style="width: 100%"
      max-height="100%"
      :fit="true"
    >
      <el-table-column prop="id" label="ID" min-width="100"></el-table-column>
      <el-table-column
        prop="type"
        label="类型"
        min-width="100"
      ></el-table-column>
      <el-table-column
        prop="area"
        label="面积(m²)"
        min-width="100"
      ></el-table-column>
      <el-table-column prop="selected" label="选中" min-width="100">
        <template v-slot="scope">
          <el-checkbox
            v-model="scope.row.selected"
            @change="onFeatureSelectChange(scope.row)"
          ></el-checkbox>
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="200">
        <template v-slot="scope">
          <el-button size="small" @click="locateFeature(scope.row)"
            >定位</el-button
          >
          <el-button
            size="small"
            type="danger"
            @click="deleteFeature(scope.row)"
            >删除</el-button
          >
          <el-button size="small" @click="viewFeatureGeoJSON(scope.row)"
            >查看</el-button
          >
          <el-button size="small" @click="exportFeatureGeoJSON(scope.row)"
            >导出</el-button
          >
          <el-button
            size="small"
            v-if="scope.row.type === 'shp'"
            @click="viewAttributeTable(scope.row)"
            >查看属性表</el-button
          >
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
// OpenLayers 样式
import "ol/ol.css";

// OpenLayers 地图和视图
import Map from "ol/Map";
import View from "ol/View";

// OpenLayers 交互
import { Draw } from "ol/interaction.js";
import { Select, Translate, Modify, Transform } from "ol/interaction";
import {
  DragRotateAndZoom,
  defaults as defaultInteractions,
} from "ol/interaction.js";

import { LineString } from "ol/geom";

// OpenLayers 图层
import { Vector as VectorLayer } from "ol/layer";
import TileLayer from "ol/layer/Tile.js";

// OpenLayers 数据源
import { OSM, Vector as VectorSource } from "ol/source";
import { TileWMS, WMTS } from "ol/source";
import XYZ from "ol/source/XYZ";

// OpenLayers 样式
import { Fill, Stroke, Style, Text, Circle } from "ol/style";
import { Circle as CircleStyle } from "ol/style";

// OpenLayers 几何对象
import { Point } from "ol/geom";

// OpenLayers 工具
import { Collection } from "ol";
import {
  getCenter,
  getHeight,
  getWidth,
  getTopLeft,
  getExtent,
} from "ol/extent";
import {
  always,
  click,
  never,
  platformModifierKeyOnly,
  primaryAction,
  singleClick,
} from "ol/events/condition.js";
import { getLength } from "ol/sphere";
import { unByKey } from "ol/Observable";
import { create } from "ol/transform";
import { createStringXY, toStringHDMS } from "ol/coordinate.js";
import { bbox as bboxStrategy } from "ol/loadingstrategy";

// OpenLayers 投影
import { register } from "ol/proj/proj4";
import { fromLonLat, toLonLat, get as getProj } from "ol/proj";
import Projection from "ol/proj/Projection";
import WMTSTileGrid from "ol/tilegrid/WMTS.js";

// OpenLayers 覆盖层
import Overlay from "ol/Overlay";

// OpenLayers 格式
import GeoJSON from "ol/format/GeoJSON";

// OpenLayers 控件
import Zoom from "ol/control/Zoom.js";
import ZoomSlider from "ol/control/ZoomSlider.js";
import ZoomToExtent from "ol/control/ZoomToExtent.js";
import ScaleLine from "ol/control/ScaleLine.js";
import MousePosition from "ol/control/MousePosition.js";
import { OverviewMap, defaults as defaultControls } from "ol/control.js";

// vue-json-pretty
import VueJsonPretty from "vue-json-pretty/lib/vue-json-pretty.js";
import "vue-json-pretty/lib/styles.css";

// shpjs
import shp from "shpjs";

// proj4
import proj4 from "proj4";

// 自定义工具
import newLayer from "../utils/newLayer.js";

// Vue
import { Transition } from "vue";

// d3
import * as d3 from "d3";

// element-plus
import { ElMessage } from "element-plus";

// vue-draggable-plus
import { ref } from "vue";
import { UseDraggableReturn, VueDraggable } from "vue-draggable-plus";

// 定义 el 变量
const el = (ref < UseDraggableReturn) | (null > null);

export default {
  components: {
    VueJsonPretty,
    VueDraggable,
  },
  data() {
    return {
      // 地图相关
      map: {},
      view: null,
      zoom: null,
      center: null,
      rotation: null,

      // 绘图相关
      drawSource: new VectorSource(),
      drawVector: {},
      draw: {},
      features: [],
      idList: [],
      undoStack: [],

      // 图层相关
      checks: [],
      // layers: [],
      layers: new ref([]),
      layerManagerVisible: false, // 控制图层管理界面的显示/隐藏
      shpLayer: null,

      // 选择相关
      select: null,
      selectedFeatures: [],
      isShowingPopup: false,

      // GeoJSON 相关
      geoJSONViewerVisible: false,
      selectedFeatureGeoJSON: null,
      parsedGeoJSON: null,

      // 数据类型、年份和政策选项
      selectedDataType: [],
      isPolicyDisabled: false,
      selectedYear: "",
      selectedPolicy: "noFactor",
      typeOptions: [
        {
          value: "landuse",
          label: "土地利用",
          children: [
            {
              value: "train",
              label: "训练数据",
            },
            {
              value: "predict",
              label: "预测数据",
            },
          ],
        },
        {
          value: "greenAccessibility",
          label: "绿地可达性",
          children: [
            {
              value: "walk",
              label: "步行绿地可达性",
            },
            {
              value: "near",
              label: "近邻绿地可达性",
            },
            {
              value: "car",
              label: "驾车绿地可达性",
            },
            {
              value: "sum",
              label: "总体绿地可达性",
            },
          ],
        },
        {
          value: "greenEquity",
          label: "绿地公平性",
        },
        {
          value: "others",
          label: "其他数据",
          children: [
            {
              value: "parkPoi",
              label: "公园",
            },
            {
              value: "population",
              label: "人口密度",
            },
          ],
        },
      ],
      policyOptions: [
        {
          value: "noFactor",
          label: "无政策",
        },
        {
          value: "withFactor",
          label: "有政策",
        },
      ],
      yearOptions: ["2014", "2030", "2040", "2050"],

      // 图表相关
      chartVisible: false,
      chart_1_visible: true,
      chart_2_visible: false,
      chartData: [],
      images: [],
      demonstrations: [],
      tableData: [],
      tableHeaders: [],

      // 工具栏相关
      activeTool: null,
      measureInteraction: null,
      modify: null,
      translate: null,
      transform: null,

      // 图例相关
      legendSrc: null,
      isLegend: false,

      // 建议相关
      suggestionVisible: false,
      suggestionContent: "",

      // 底图相关
      basemapVisible: false,
      basemaps: [
        {
          name: "OSM",
          thumbnail: require("../assets/images/osm-thumbnail.png"),
        },
        {
          name: "ArcGIS",
          thumbnail: require("../assets/images/satellite-thumbnail.png"),
        },
        {
          name: "Tian",
          thumbnail: require("../assets/images/tian-thumbnail.png"),
        },
        {
          name: "Gaode",
          thumbnail: require("../assets/images/gaode-thumbnail.png"),
        },
        {
          name: "Baidu",
          thumbnail: require("../assets/images/baidu-thumbnail.png"),
        },
        {
          name: "Bing",
          thumbnail: require("../assets/images/bing-thumbnail.png"),
        },
        {
          name: "Google",
          thumbnail: require("../assets/images/google-thumbnail.png"),
        },
        {
          name: "WMTS",
          thumbnail: require("../assets/images/wmts-thumbnail.png"),
        },
        {
          name: "None",
          thumbnail: require("../assets/images/none-thumbnail.png"),
        },
      ],

      // 其他
      isPredict: true,
      attributeTableVisible: false,
      attributeData: [],
      attributeColumns: [],
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
  watch: {
    // 监听选择的数据类型变化
    selectedDataType(newValue) {
      const lastSelectedType = newValue[newValue.length - 1];
      const firstSelectedType = newValue[0];
      console.log(firstSelectedType, lastSelectedType);

      // 只有在土地类型/训练数据时，isPredict 才为 false
      if (firstSelectedType === "landuse" && lastSelectedType === "train") {
        this.isPredict = false;
        this.isPolicyDisabled = true;
      } else {
        this.isPredict = true;
        this.isPolicyDisabled = false;
      }

      this.resetSelectedYear(); // 重置年份选择
    },
  },
  mounted() {
    this.initMap();
    this.addDrawLayer();
    this.resetStatus();
  },
  methods: {
    // 响应图层更新
    onLayersUpdate() {
      console.log("update");
      console.log(this.layers);
      // 改变图层顺序
      this.layers.forEach((layer, index) => {
        layer.layer.setZIndex(1000 - index);
      });
    },

    // 初始化地图
    initMap() {
      // 创建地图
      this.map = new Map({
        target: "mapDom",
        view: new View({
          projection: "EPSG:3857",
          center: [12758612.973162018, 3562849.0216611675],
          zoom: 17.5,
        }),
      });

      // 设置底图
      this.setBasemap("Gaode");

      // 获取视图
      this.view = this.map.getView();
      this.zoom = this.view.getZoom();
      this.center = this.view.getCenter();
      this.rotation = this.view.getRotation();

      // 创建缩放控件
      const zoom = new Zoom();

      // 创建缩放滑块控件
      const zoomSlider = new ZoomSlider();

      // 创建缩放到范围，默认使用view的投影范围
      const zoomToExtent = new ZoomToExtent();

      // 缩放控件添加到地图
      this.map.addControl(zoom);
      this.map.addControl(zoomSlider);
      this.map.addControl(zoomToExtent);

      // 获取主地图
      const baseLayer = this.map.getLayers().item(0);
      console.log(baseLayer);

      // 创建鹰眼控件
      const miniMap = new OverviewMap({
        className: "ol-overviewmap ol-custom-overviewmap",
        collapsed: false,
        layers: [new TileLayer({ source: baseLayer.getSource() })],
      });

      // 控件添加到地图
      this.map.addControl(miniMap);

      // 创建鼠标位置控件
      const mousePos = new MousePosition({
        coordinateFormat: createStringXY(4),
        projection: "EPSG:4326",
        // className: "mousePos",
        // target: document.getElementById("mouse-position"),
      });

      // 比例尺
      // this.olmap = this.map;
      // 创建默认比例尺
      this.scale = new ScaleLine();
      this.map.addControl(this.scale);

      // 控件添加到地图
      this.map.addControl(mousePos);

      this.select = new Select({
        condition: singleClick,
        // toggleCondition: always,
        toggleCondition: platformModifierKeyOnly,
        style: new Style({
          fill: new Fill({
            color: "rgba(255, 255, 0, 0.7)",
          }),
          stroke: new Stroke({
            color: "rgba(0, 0, 0, 0.7)",
            width: 2,
          }),
          image: new Circle({
            radius: 7,
            fill: new Fill({
              color: "rgba(0, 0, 0, 0.7)",
            }),
          }),
        }),
      });

      this.map.addInteraction(this.select);
    },

    // 添加绘图图层
    addDrawLayer() {
      this.drawVector = new VectorLayer({
        properties: {
          name: "绘图图层",
        },
        source: this.drawSource,
        //绘制好后，在地图上呈现的样式
        style: new Style({
          fill: new Fill({
            color: "rgba(255, 255, 255, 0.2)",
          }),
          stroke: new Stroke({
            //边界样式
            color: "#ffcc33",
            width: 3,
          }),
          //点样式继承image
          image: new Circle({
            radius: 7,
            fill: new Fill({
              color: "#ffcc33",
            }),
          }),
        }),
        zIndex: 1200,
      });
      this.map.addLayer(this.drawVector);

      // 添加到图层管理动态数组
      let length = this.layers.length + 1;
      this.layers.unshift({
        name: "绘图图层",
        layer: this.drawVector,
        index: length,
      });
      // 更新选中的图层
      this.checks.push(this.drawVector.getProperties().name);
      this.onLayersUpdate();
    },

    // 重置状态
    resetStatus() {
      this.activeTool = null;
      this.map.removeInteraction(this.draw);
      this.map.removeInteraction(this.modify);
      this.map.removeInteraction(this.translate);
      this.map.removeInteraction(this.transform);
      this.map.removeInteraction(this.measureInteraction);

      this.select.getFeatures().clear();

      // 禁用select交互
      this.select.setActive(false);

      this.selectedFeatures = [];

      // 若有选中的要素，取消选中
      this.features.forEach((row) => {
        if (row.selected) {
          row.selected = false;
        }
      });

      this.isShowingPopup = false;
    },
    // 切换图层管理界面的显示/隐藏状态
    toggleLayerManager() {
      this.layerManagerVisible = !this.layerManagerVisible;
    },
    // 切换图层的显示/隐藏状态
    toggleLayer(layer) {
      const layerName = layer.name;
      const layerVisible = this.checks.includes(layerName);
      layer.layer.setVisible(layerVisible);
    },

    // 加载 Geoserver Shapefile
    loadShp() {
      if (this.selectedDataType.length === 0 || !this.selectedYear) {
        this.$message.error("请选择政策类型和数据年份");
      } else if (!this.selectedPolicy && this.isPredict) {
        this.$message.error("请选择政策类型");
      } else {
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
        console.log(params);

        this.shpLayer = new TileLayer({
          properties: {
            name:
              layerName +
              `_${this.selectedDataType[1]}_${this.selectedPolicy}_${this.selectedYear}`,
          },
          source: new TileWMS({
            url,
            params,
            serverType: "geoserver",
            transition: 0,
            projection: "EPSG:4326",
          }),
        });

        this.map.addLayer(this.shpLayer);
        // 添加到图层管理动态数组
        let length = this.layers.length + 1;
        this.layers.unshift({
          name: this.shpLayer.getProperties().name,
          layer: this.shpLayer,
          index: length,
        });
        // 更新选中的图层
        this.checks.push(this.shpLayer.getProperties().name);
        console.log(this.shpLayer.getProperties().name);
        this.onLayersUpdate();

        let geojsonFilePath;
        if (this.selectedDataType[0] === "landuse") {
          geojsonFilePath = "/geojson/greenAccessibility_2030.geojson";
        } else {
          geojsonFilePath = `/geojson/${this.selectedDataType[0]}_${this.selectedYear}.geojson`;
        }

        let drawSource;
        let drawLayer;

        fetch(geojsonFilePath)
          .then((response) => response.json())
          .then((data) => {
            const features = new GeoJSON().readFeatures(data);

            drawSource = new VectorSource();
            drawSource.addFeatures(features);

            // 设置样式,完全透明
            let vectorStyle;
            vectorStyle = new Style({
              fill: new Fill({
                color: "rgba(0, 0, 0, 0)", // 完全透明
              }),
              stroke: new Stroke({
                color: "rgba(0,0,0,0)",
                width: 0.5,
              }),
            });

            drawLayer = new VectorLayer({
              source: drawSource,
              style: vectorStyle,
              // visible: false,
            });
            drawLayer.setZIndex(1000);

            this.map.addLayer(drawLayer);
            this.map.getView().fit(drawSource.getExtent());
          })
          .catch((error) => {
            console.error("获取GeoJSON数据失败:", error);
          });

        // 加载图例
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
      }
    },

    // 切换图表显示
    toggleChart() {
      if (this.chartVisible) {
        this.chartVisible = false;
      } else {
        this.showChart();
      }
    },

    // 显示图表
    showChart() {
      if (!this.selectedYear || this.selectedDataType.length === 0) {
        this.$message.error("请选择数据类型和数据年份");
        this.chartVisible = false;
        return;
      } else if (this.selectedDataType[0] === "greenEquity") {
        this.chartVisible = true;
        this.chart_1_visible = false;
        this.chart_2_visible = true;
        const header = document.querySelector(".chart-header");
        // 更改图表标题
        header.innerHTML = "绿地公平性指标";
        let walkImage = "/images/步行公平性.png";
        let driveImage = "/images/驾车公平性.png";
        let nearImage = "/images/近邻公平性.png";
        let sumImage = "/images/总体公平性.png";
        this.images = [walkImage, driveImage, nearImage, sumImage];
        this.demonstrations = [
          "步行公平性",
          "驾车公平性",
          "近邻公平性",
          "总体公平性",
        ];
      } else if (this.selectedDataType[0] === "greenAccessibility") {
        this.chartVisible = true;
        this.chart_1_visible = true;
        this.chart_2_visible = false;
        const header = document.querySelector(".chart-header");
        // 更改图表标题
        header.innerHTML = `${this.selectedYear} 年绿地可达性指标`;
        // 加载表格
        const tableUrl = `/tables/分区统计Aij_${this.selectedYear}.csv`;
        d3.csv(tableUrl)
          .then((data) => {
            this.loadTable(data);
          })
          .catch((error) => {
            ElMessage.error("加载表格数据失败");
            console.error("Error loading table data:", error);
          });
      } else {
        this.chartVisible = false;
        this.chart_1_visible = false;
        this.chart_2_visible = false;
        this.$message.error("暂无数据");
        return;
      }
    },
    loadTable(data) {
      if (data.length > 0) {
        this.tableHeaders = Object.keys(data[0]);
        this.tableData = data;
      } else {
        ElMessage.error("表格数据为空");
      }
    },

    // 切换建议显示
    toggleSeggestion() {
      const legend = document.querySelector(".legend");
      const container = document.querySelector(".layer-manager-container");
      if (this.suggestionVisible) {
        this.suggestionVisible = false;
        legend.style.right = "45px";
        container.style.right = "45px";
      } else {
        this.showSeggestion();
        legend.style.right = "25%";
        container.style.right = "25%";
      }
    },

    // 显示建议
    showSeggestion() {
      // 显示suggestion-panel
      this.suggestionVisible = true;

      // 加载建议内容
      const suggestionUrl = `/suggestions/suggestion_${this.selectedYear}.txt`;
      fetch(suggestionUrl)
        .then((response) => response.text())
        .then((text) => {
          this.suggestionContent = text;
          // 换行符替换为<br>
          this.suggestionContent = this.suggestionContent.replace(
            /\n/g,
            "<br>"
          );
        })
        .catch((error) => {
          ElMessage.error("加载建议内容失败");
          console.error("Error loading suggestion content:", error);
        });
    },

    // 切换底图显示
    toggleBasemap() {
      this.basemapVisible = !this.basemapVisible;
      // console.log(this.map.getView());
    },

    // 设置底图
    setBasemap(name) {
      const layers = this.map.getLayers();

      // 移除所有底图图层
      layers.forEach((layer) => {
        if (layer instanceof TileLayer) {
          this.map.removeLayer(layer);
        }
      });

      if (name === "None") {
        this.basemapVisible = false;
        return;
      }

      let layer;

      layer = newLayer(name);

      // 添加到最底层
      this.map.getLayers().insertAt(0, layer);

      this.basemapVisible = false;
    },

    // 判断年份是否禁用
    isYearDisabled(year) {
      if (!this.isPredict) {
        return year !== "2014";
      } else {
        return year !== "2030" && year !== "2040" && year !== "2050";
      }
    },

    // 重置选中的年份
    resetSelectedYear() {
      if (this.isYearDisabled(this.selectedYear)) {
        if (!this.isPredict) {
          this.selectedYear = "2014"; // 将年份重置为2009
          this.selectedPolicy = "noFactor"; // 将政策重置为无政策
        } else {
          this.selectedYear = "2030"; // 将年份重置为2030
        }
      }
    },

    // 绘制要素
    drawFeature(featureType = "") {
      this.resetStatus();
      this.activeTool = featureType;

      this.draw = new Draw({
        source: this.drawSource,
        type: featureType,
        //绘制时，在地图上呈现的样式
        style: new Style({
          fill: new Fill({
            color: "rgba(255, 255, 255, 0.8)",
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
        // style: this.myStyle,
      });
      // 添加绘制交互
      this.map.addInteraction(this.draw);

      // 绘制结束事件
      this.draw.on("drawend", (event) => {
        const feature = event.feature;
        const type = feature.getGeometry().getType();
        let id = this.randomId();
        feature.setId(id);
        feature.setStyle(this.myStyle);
        let area = 0;
        if (type === "Polygon") {
          area = feature.getGeometry().getArea();
        }

        // 添加至features数组头部
        this.features.unshift({
          id: feature.getId(),
          type: type,
          area: area,
          selected: false,
        });

        // 将当前要素添加到undoStack
        this.undoStack.push(this.drawSource.getFeatures());
      });
    },
    randomId() {
      // 4位随机数
      const id = Math.floor(Math.random() * 10000);
      if (this.idList.includes(id)) {
        return this.randomId();
      }
      this.idList.push(id);
      return id;
    },

    // 撤销操作
    undo() {
      if (this.undoStack.length >= 1) {
        let lastStep = this.undoStack[this.undoStack.length - 1];
        this.undoStack.pop(); // 删除最后一步
        this.drawSource.clear(); // 清空绘图源
        this.drawSource.addFeatures(lastStep); // 添加上一步的要素
        this.features = lastStep; // 同步features数组
      }
    },

    // 清除绘图图层
    clearDrawLayer() {
      this.resetStatus();
      this.drawVector.getSource().clear();
      this.features = [];
      this.undoStack = [];

      this.map.getOverlays().clear();
    },

    // 测距
    measureDistance() {
      this.resetStatus();
      this.activeTool = "measureDistance";
      // 启用draw交互
      this.measureInteraction = new Draw({
        source: this.drawSource,
        type: "LineString",
        style: new Style({
          stroke: new Stroke({
            color: "rgba(0, 0, 255, 0.5)",
            lineDash: [10, 10],
            width: 2,
          }),
        }),
      });
      this.map.addInteraction(this.measureInteraction);

      // 测量开始事件
      this.measureInteraction.on("drawstart", (event) => {
        // 清除上一次的测量结果
        this.previousCoordinate = null;
        // 实时显示总长
        this.createMeasureTooltip(event.feature);
      });

      // 测量结束事件
      this.measureInteraction.on("drawend", (event) => {
        const feature = event.feature;
        // 设置样式
        feature.setStyle(
          new Style({
            stroke: new Stroke({
              color: "rgba(0, 0, 255, 0.5)",
              lineDash: [10, 10],
              width: 3,
            }),
          })
        );
        // 创建最终的tooltip
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

      // 对每一段长度进行计算
      coordinates.forEach((coordinate, index) => {
        if (index === 0) return; // 忽略第一个点

        // 计算每一段的长度
        const segmentLength = this.formatLength(
          new LineString([coordinates[index - 1], coordinate])
        );

        // 创建tooltip，在中间结点处显示
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

    // 格式化长度
    formatLength(line) {
      const length = getLength(line);
      let output;
      // 如果长度大于100米，转换为千米
      if (length > 100) {
        output = Math.round((length / 1000) * 100) / 100 + " km";
      } else {
        output = Math.round(length * 100) / 100 + " m";
      }
      return output;
    },

    // 选择要素
    selectFeature() {
      this.resetStatus();
      this.activeTool = "selectFeature";

      // 启用select交互
      this.select.setActive(true);

      this.select.on("select", (e) => {
        e.target
          .getFeatures()
          .getArray()
          .forEach((item) => {
            console.log(item.values_);
          });
      });

      this.select.on("select", (event) => {
        const selected = event.selected;
        const deselected = event.deselected;

        // 选中要素
        selected.forEach((feature) => {
          this.selectedFeatures.push(feature);
          this.features.forEach((row) => {
            if (row.id === feature.getId()) {
              row.selected = true;
            }
          });
        });

        // 取消选中要素
        deselected.forEach((feature) => {
          this.selectedFeatures = this.selectedFeatures.filter(
            (item) => item !== feature
          );
          this.features.forEach((row) => {
            if (row.id === feature.getId()) {
              row.selected = false;
            }
          });
        });
      });
    },

    // 查看地块详情
    checkArea() {
      this.resetStatus();
      this.activeTool = "checkArea";

      this.isShowingPopup = true;

      // 启用select交互
      this.select.setActive(true);

      const container = document.getElementById("popup");
      const content = document.getElementById("popup-content");
      const closer = document.getElementById("popup-closer");

      const overlay = new Overlay({
        element: container,
        // autoPan: {
        //   animation: {
        //     duration: 250,
        //   },
        // },
      });

      closer.onclick = function () {
        overlay.setPosition(undefined);
        closer.blur();
        return false;
      };

      this.map.addOverlay(overlay);

      // 选中要素事件
      // 存储选中的要素
      this.select.on("select", function (e) {
        e.target
          .getFeatures()
          .getArray()
          .forEach((item) => {
            console.log(item.values_);
            let name = item.values_.SQNAME;
            let drive_Aij_ = item.values_.drive_Aij_;
            let walk_Aij_w = item.values_.walk_Aij_w;
            let near_Aij_n = item.values_.near_Aij_n;
            let plus_Aij_s = item.values_.plus_Aij_s;
            content.innerHTML =
              "<p>地块名称:" +
              name +
              "</p><code>" +
              "<p>near_Aij_n:" +
              near_Aij_n +
              "</p>" +
              "<p>walk_Aij_w:" +
              walk_Aij_w +
              "</p>" +
              "<p>drive_Aij_:" +
              drive_Aij_ +
              "</p>" +
              "<p>plus_Aij_s:" +
              plus_Aij_s +
              "</p>";
            overlay.setPosition(item.getGeometry().getCoordinates());
          });
      });

      // 单击地图事件
      this.map.on("singleclick", function (evt) {
        const coordinate = evt.coordinate;
        const hdms = toStringHDMS(toLonLat(coordinate));

        overlay.setPosition(coordinate);
      });
    },

    // 平移要素
    translateFeature() {
      this.resetStatus();

      this.activeTool = "translateFeature";

      this.draw = new Select({
        wrapX: false,
      });

      this.map.addInteraction(this.draw);

      this.draw.on("select", (event) => {
        if (event.selected.length > 0) {
          const feature = event.selected[0];
          this.enableFeatureTranslate(feature);
        }
      });
    },
    enableFeatureTranslate(feature) {
      this.translate = new Translate({
        features: new Collection([feature]),
      });

      this.translate.on("translateend", (event) => {
        // this.map.removeInteraction(this.translate);
        // this.translate.setActive(false);
      });

      this.map.addInteraction(this.translate);
    },

    // 编辑节点
    editVertices() {
      this.resetStatus();
      this.activeTool = "editVertices";

      this.modify = new Modify({
        source: this.drawSource,
        style: new Style({
          image: new CircleStyle({
            radius: 5,
            stroke: new Stroke({
              color: "rgba(0, 0, 0, 0.7)",
            }),
            fill: new Fill({
              color: "rgba(255, 255, 255, 0.4)",
            }),
          }),
          stroke: new Stroke({
            color: "rgba(0, 0, 0, 0.7)",
            width: 2,
          }),
        }),
      });

      this.map.addInteraction(this.modify);
    },

    // 旋转要素
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
      this.defaultStyle = new Modify({ source: this.drawVector.getSource() })
        .getOverlay()
        .getStyleFunction();
    },
    // 旋转要素
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
                  geometry.scale(
                    currentRadius / initialRadius,
                    undefined,
                    center
                  );
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
          feature.set(
            "modifyGeometry",
            { geometry: feature.getGeometry().clone() },
            true
          );
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
        minRadius =
          Math.max(
            getWidth(geometry.getExtent()),
            getHeight(geometry.getExtent())
          ) / 3;
      }
      return {
        center: center,
        coordinates: coordinates,
        minRadius: minRadius,
        sqDistances: sqDistances,
      };
    },

    // 放大
    onZoom(isZoomIn) {
      if (!this.view) return;
      const curZoom = this.view.getZoom();
      this.view.setZoom(isZoomIn ? curZoom + 1 : curZoom - 1);
    },

    // 移动到深圳
    onMoveWh() {
      if (!this.view) return;
      console.log(this.view);
      this.view.setCenter([12709423.397, 2591463.4625]);
      this.view.setZoom(11);
    },

    // 打开文件上传
    openFileUpload() {
      this.$refs.fileInput.click();
    },

    // 还原
    onRestore() {
      if (!this.view) return;

      this.view.setZoom(this.zoom);
      this.view.setCenter(this.center);
      this.view.setRotation(this.rotation);
    },

    // 切换比例尺
    onScaleChange(type) {
      if (!this.olmap) return;

      // 移除旧比例尺
      this.scale && this.olmap.removeControl(this.scale);
      // 创建新比例尺
      this.scale = new ScaleLine({ bar: type === "bar" });
      // 添加到地图
      this.olmap.addControl(this.scale);
    },

    // 上传文件
    onFileUpload(event) {
      const file = event.target.files[0];
      if (file) {
        const file = event.target.files[0];
        const fileName = file.name.toLowerCase();

        if (fileName.endsWith(".json") || fileName.endsWith(".geojson")) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const content = e.target.result;
            this.loadJsonFile(content);
          };
          reader.readAsText(file);
        } else if (fileName.endsWith(".zip")) {
          this.loadShapefile(file);
        } else {
          console.error("Unsupported file format.");
        }
      }
    },
    // 加载 GeoJSON 文件
    loadJsonFile(content) {
      const format = new GeoJSON();
      const features = format.readFeatures(content);
      if (features.length > 0) {
        this.drawSource.addFeatures(features);
        features.forEach((feature) => {
          const type = feature.getGeometry().getType();
          let area = 0;
          if (type === "Polygon") {
            area = feature.getGeometry().getArea();
          }
          this.features.push({
            id: feature.getId() || this.randomId(),
            type: type,
            area: area,
            selected: false,
          });
        });
        this.map.getView().fit(this.drawSource.getExtent());
      } else {
        console.error("No features found in the uploaded file.");
      }
    },
    // 异步加载 Shapefile
    async loadShapefile(file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        // 读取文件
        const arrayBuffer = e.target.result;
        // 转换为 GeoJSON
        const geojsons = await this.convertShpToGeoJSON(arrayBuffer);
        this.displayGeojson(geojsons);
      };
      reader.readAsArrayBuffer(file);
    },
    // 异步转换 Shapefile 为 GeoJSON
    async convertShpToGeoJSON(arrayBuffer) {
      // 调用 shp.js
      const shpData = await shp(arrayBuffer);
      // 用于存储多个GeoJSON
      let geojsons = [];

      // 检查是否为数组，如果不是则转换为数组，统一添加到geojsons
      if (!Array.isArray(shpData)) {
        const geojson = new GeoJSON().readFeatures(shpData);
        geojsons.push(...geojson);
      } else {
        shpData.forEach((data) => {
          const geojson = new GeoJSON().readFeatures(data);
          geojsons.push(...geojson);
        });
      }

      // 转换投影
      geojsons = geojsons.map((geojson) => {
        geojson.getGeometry().transform("EPSG:4326", "EPSG:3857");
        return geojson;
      });

      return geojsons;
    },
    displayGeojson(geojsons) {
      console.log(geojsons);

      let bounds = null;

      // 定义样式
      const geojsonStyle = new Style({
        fill: new Fill({
          color: "rgba(245, 243, 240, 0.6)", // 灰色
        }),
        stroke: new Stroke({
          color: "rgba(102, 102, 115)",
          width: 2,
        }),
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({
            color: "rgba(255, 255, 255, 0.2)",
          }),
        }),
      });

      geojsons.forEach((geojson) => {
        // 添加阴影效果
        geojson.setStyle(geojsonStyle);

        // 添加到地图
        this.drawSource.addFeature(geojson);

        if (!geojson.getId()) {
          geojson.setId(this.randomId());
        }

        this.features.push({
          id: geojson.getId(),
          type: geojson.getGeometry().getType(),
          area: geojson.getGeometry().getArea(),
          selected: false,
        });

        // 计算边界
        const extent = geojson.getGeometry().getExtent();
        if (bounds) {
          bounds = [
            Math.min(bounds[0], extent[0]),
            Math.min(bounds[1], extent[1]),
            Math.max(bounds[2], extent[2]),
            Math.max(bounds[3], extent[3]),
          ];
        } else {
          bounds = extent;
        }
      });

      if (bounds) {
        this.map.getView().fit(bounds);
      }
    },

    // 测试 WMTS
    testWMTS() {
      // 跳转
      this.$router.push("/testWMTS");
    },

    // 测试 WFS
    testWFS() {
      // 跳转
      this.$router.push("/testWFS");
    },

    // 要素选中状态变化
    onFeatureSelectChange(row) {
      const feature = this.drawSource.getFeatureById(row.id);
      if (row.selected) {
        this.select.getFeatures().push(feature);
      } else {
        this.select.getFeatures().remove(feature);
      }
      this.selectedFeatures = this.select.getFeatures().getArray();
    },

    // 定位要素
    locateFeature(row) {
      const source = this.drawVector.getSource();
      const features = source.getFeatures();
      const feature = features.find((f) => f.getId() === row.id);
      console.log(features[0]);
      console.log(row.id);

      if (feature) {
        this.map.getView().fit(feature.getGeometry().getExtent());
      }
    },

    // 删除要素
    deleteFeature(row) {
      const source = this.drawVector.getSource();
      const features = source.getFeatures();
      const feature = features.find((f) => f.getId() === row.id);
      if (feature) {
        source.removeFeature(feature);
        this.features = this.features.filter((f) => f.id !== row.id);
      }
    },

    // 查看要素的 GeoJSON
    viewFeatureGeoJSON(row) {
      const feature = this.drawSource.getFeatureById(row.id);
      if (feature) {
        const geojson = new GeoJSON().writeFeatureObject(feature);
        this.parsedGeoJSON = geojson;
        this.geoJSONViewerVisible = true;
      }
      console.log(this.parsedGeoJSON);
    },

    // 导出要素的 GeoJSON
    exportFeatureGeoJSON(row) {
      const feature = this.drawSource.getFeatureById(row.id);
      if (feature) {
        const geojson = new GeoJSON().writeFeature(feature);
        const blob = new Blob([geojson], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `feature-${row.id}.geojson`;
        link.click();
        URL.revokeObjectURL(url);
      }
    },

    // 查看属性表
    viewAttributeTable(feature) {
      // ...
    },

    // 关闭 GeoJSON 查看器
    closeGeoJSONViewer() {
      this.geoJSONViewerVisible = false;
    },
  },
};
</script>

<style scoped>
.header {
  /* 头部样式 */
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* background-color: #f5f5f5; */
  /* padding: 10px 20px; */
  margin-left: 80px;
  margin-right: 80px;
  margin-top: 20px;
  border-radius: 8px; /* 圆角 */
}

.container {
  /* 容器样式 */
  display: flex;
  flex-direction: column;
  height: 80vh;
  /* padding: 10px;  */
  margin-left: 80px;
  margin-right: 80px;
  margin-top: 20px;
  box-sizing: border-box;
}

.map-wrapper {
  /* 地图容器样式 */
  position: relative;
  flex: 1;
  display: flex;
  height: calc(100% - 50px);
}

#mapDom {
  /* 地图样式 */
  flex: 1;
  height: 100%;
}

.ol-popup {
  /* 弹出框样式 */
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

.chart-panel {
  /* 图表面板样式 */
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 10px;
  /* right: 10px; */
  height: 45%;
  width: 50%;
  background: #fff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  /* transition: 0.3s ease; */
  z-index: 1000;
}

.chart-header {
  /* 图表头部样式 */
  padding: 10px;
  border-bottom: 1px solid #eee;

  text-align: center;

  font-size: 16px;
}

.chart-body-1 {
  /* 图表主体1样式 */
  padding: 5px;
}

.chart-body-2 {
  /* 图表主体2样式 */
  padding: 5px;
}
.chart-body-2 .block {
  padding: 5px 0;
  text-align: center;
  border-right: solid 1px var(--el-border-color);
  display: inline-block;
  width: 50%;
  box-sizing: border-box;
  vertical-align: top;
}
.chart-body-2 .block:last-child {
  border-right: none;
}
.chart-body-2 .demonstration {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 10px;
  margin-bottom: 3px;
}

.suggestion-panel {
  /* 建议面板样式 */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  margin: 20px 0;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #f9f9f9;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  width: 20%;
}

.basemap-container {
  /* 底图选择容器样式 */
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background-color: #fff;
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
}

.basemap-item {
  /* 底图选项样式 */
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 10px;
  cursor: pointer;
}
.basemap-item img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
}

.basemap-item span {
  margin-top: 5px;
  font-size: 12px;
}

.toolbar {
  /* 工具栏样式 */
  position: absolute;
  top: 290px;
  left: 10px;
  z-index: 1000;
  max-width: 5%;
  display: flex;
  flex-direction: column;
}

.button-group {
  /* 按钮组样式 */
  margin-bottom: 10px;
}
.button-group:last-child {
  margin-bottom: 0;
}

.map-controls {
  /* 地图控件样式 */
  position: absolute;
  top: 290px;
  left: 100px;
  z-index: 1000;
  max-width: 5%;
  display: flex;
  flex-direction: column;
}

.legend {
  /* 图例样式 */
  position: absolute;
  bottom: 10px;
  right: 45px;
  background-color: rgba(255, 255, 255, 0.8); /* 可选：设置背景颜色和透明度 */
  padding: 5px; /* 可选：设置内边距 */
  border-radius: 5px; /* 可选：设置圆角 */
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.3); /* 可选：设置阴影 */
}

.legend img {
  display: block;
  width: 300px; /* 设置图例图片的宽度 */
  height: 40px;
}

.geojson-viewer {
  /* GeoJSON查看器样式 */
  position: absolute;
  width: 300px;
  max-height: 90%;
  overflow-y: auto;
  z-index: 1000;
  background: white;
  border-radius: 8px; /* 圆角 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); /* 阴影效果 */
}

.close-button {
  /* 关闭按钮样式 */
  float: right;
  padding: 0;
  color: #f56c6c;
}

.attribute-panel {
  /* 属性面板样式 */
  flex: 1;
  padding: 10px;
  margin-top: 10px;
  overflow: auto;
  background: #fff;
  border: 1px solid #dcdcdc;
  margin-left: 80px;
  margin-right: 80px;
  border-radius: 8px;
}

.logo {
  /* logo样式 */
  font-size: 24px;
  font-weight: bold;
}

.logo-icon {
  /* logo图标样式 */
  width: 40px; /* 调整图标宽度 */
  height: 40px; /* 调整图标高度 */
  margin-right: 10px; /* 图标与文本之间的间距 */
  vertical-align: middle; /* 确保图标垂直居中对齐文本 */
}

.nav {
  /* 导航样式 */
  display: flex;
  gap: 10px;
}

.active {
  /* 激活状态样式 */
  background-color: #409eff;
  color: #fff;
}

.layer-manager-container {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
}

.toggle-button {
  position: absolute;
  top: 35px;
  right: 10px;
  z-index: 1100;
}

.layer-manager {
  position: absolute;
  top: 35px;
  right: 10px;
  width: 300px;
  z-index: 1000;
}

.layer-card {
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.layer-card .header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 10px 16px;
  font-weight: bold;
  font-size: 16px;
}

.layer-card .close-button {
  color: #ff4d4f;
}

.layer-checkbox-group {
  padding: 10px 16px;
}

.layer-checkbox {
  display: block;
  margin-bottom: 10px;
  font-size: 14px;
}

/* Transition for slide effect */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.5s ease;
}
.slide-fade-enter, .slide-fade-leave-to /* .slide-fade-leave-active in <2.1.8 */ {
  transform: translateY(-10px);
  opacity: 0;
}

.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}
</style>
