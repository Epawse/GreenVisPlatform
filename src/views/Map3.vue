<template>
  <div class="header">
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
        style="width: 240px"
      >
      </el-cascader>

      <el-select
        v-model="selectedYear"
        placeholder="请选择数据年份"
        size="large"
        style="width: 240px"
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
        style="width: 240px"
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
      <div id="mapDom" class="map"></div>
      <div id="popup" class="ol-popup" v-show="isSelecting">
        <a href="#" id="popup-closer" class="ol-popup-closer"></a>
        <div id="popup-content"></div>
      </div>

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

      <div class="suggestion-panel" v-show="suggestionVisible">
        <div v-html="suggestionContent"></div>
      </div>

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

      <div class="toolbar">
        <!-- 第一组按钮 -->
        <el-button-group class="button-group" vertical>
          <el-button @click="drawFeature('Point')">画点</el-button>
          <el-button @click="drawFeature('LineString')">画线</el-button>
          <el-button @click="drawFeature('Polygon')">画面</el-button>
        </el-button-group>

        <!-- 第二组按钮 -->
        <el-button-group class="button-group" vertical>
          <el-button @click="undo()">撤回</el-button>
          <el-button @click="resetStatus()">取消</el-button>
          <el-button @click="clearDrawLayer()">清除</el-button>
          <el-button @click="measureDistance()">测距</el-button>
        </el-button-group>

        <!-- 第三组按钮 -->
        <el-button-group class="button-group" vertical>
          <el-button @click="selectFeature()">选择</el-button>
          <el-button @click="translateFeature()">平移</el-button>
          <el-button @click="editVertices()">编辑</el-button>
          <el-button @click="rotateFeature()">旋转</el-button>
        </el-button-group>
      </div>

      <div class="map-controls">
        <el-button-group class="button-group" vertical>
          <el-button @click="onZoom(true)">放大一级</el-button>
          <el-button @click="onZoom(false)">缩小一级</el-button>
          <el-button @click="onMoveWh()">移动到武汉</el-button>
          <input
            type="file"
            ref="fileInput"
            accept=".json,.geojson,.zip"
            @change="onFileUpload"
            style="display: none"
          />
        </el-button-group>
        <el-button-group class="button-group" vertical>
          <el-button @click="onRestore()">复位</el-button>
          <el-button @click="onScaleChange('line')">比例尺线</el-button>
          <el-button @click="onScaleChange('bar')">比例尺条</el-button>
          <el-button @click="openFileUpload()">上传</el-button>
        </el-button-group>
        <el-button-group class="button-group" vertical>
          <el-button @click="testWMTS()">测试WMTS</el-button>
          <el-button @click="testWFS()">测试WFS</el-button>
        </el-button-group>
      </div>

      <div class="legend">
        <!-- <img src="/images/legend3.png" alt="Legend" style="" /> -->
        <img :src="legendSrc" alt="Legend" style="" v-show="isLegend" />
      </div>

      <!-- <el-card class="layers-control">
        <el-checkbox-group v-model="checks" @change="onCheckChange">
          <el-checkbox
            v-for="layer in layers"
            :key="layer.name"
            :label="layer.name"
            >{{ layer.title }}</el-checkbox
          >
        </el-checkbox-group>
      </el-card> -->
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
  <div class="attribute-panel">
    <el-table :data="features" style="width: 100%" max-height="100%">
      <el-table-column prop="id" label="ID" width="180"></el-table-column>
      <el-table-column prop="type" label="类型" width="120"></el-table-column>
      <el-table-column
        prop="area"
        label="面积(m²)"
        width="120"
      ></el-table-column>
      <el-table-column prop="selected" label="选中" width="80">
        <template v-slot="scope">
          <el-checkbox
            v-model="scope.row.selected"
            @change="onFeatureSelectChange(scope.row)"
          ></el-checkbox>
        </template>
      </el-table-column>
      <el-table-column label="操作">
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
import "ol/ol.css";
import Map from "ol/Map";
import { Draw } from "ol/interaction.js";
import View from "ol/View";
import { Vector as VectorLayer } from "ol/layer";
import { OSM, Vector as VectorSource } from "ol/source";
import { Fill, Stroke, Style, Text, Circle } from "ol/style";
import { Circle as CircleStyle } from "ol/style";
import { Point } from "ol/geom";
import { Select, Translate, Modify, Transform } from "ol/interaction";
import { Collection } from "ol";
import { getCenter, getHeight, getWidth, getTopLeft } from "ol/extent.js";
import {
  always,
  click,
  never,
  platformModifierKeyOnly,
  primaryAction,
} from "ol/events/condition.js";
import GeoJSON from "ol/format/GeoJSON";
import { getLength } from "ol/sphere";
import { unByKey } from "ol/Observable";
import Overlay from "ol/Overlay";

import VueJsonPretty from "vue-json-pretty/lib/vue-json-pretty.js";
import "vue-json-pretty/lib/styles.css";

import shp from "shpjs";

import proj4 from "proj4";
import { register } from "ol/proj/proj4";
import { fromLonLat } from "ol/proj";
import { TileWMS } from "ol/source";
import { WMTS } from "ol/source";
import { get as getProj } from "ol/proj";
import WMTSTileGrid from "ol/tilegrid/WMTS.js";
import { Projection } from "ol/proj";
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");
proj4.defs(
  "EPSG:3857",
  "+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs"
);
register(proj4);


// 地图控件
import Zoom from "ol/control/Zoom.js";
import ZoomSlider from "ol/control/ZoomSlider.js";
import ZoomToExtent from "ol/control/ZoomToExtent.js";
import ScaleLine from "ol/control/ScaleLine.js";
import TileLayer from "ol/layer/Tile.js";
import MousePosition from "ol/control/MousePosition.js";
import { create } from "ol/transform";
import { createStringXY } from "ol/coordinate.js";
import XYZ from "ol/source/XYZ";
import newBaseSource from "../utils/newBaseSource.js";
import {
  DragRotateAndZoom,
  defaults as defaultInteractions,
} from "ol/interaction.js";
import { OverviewMap, defaults as defaultControls } from "ol/control.js";
import newLayer from "../utils/newLayer.js";
import { getExtent } from "ol/extent"; // Import the getExtent function from the 'ol/extent' package
import { singleClick } from "ol/events/condition";
import { Transition } from "vue";
import { bbox as bboxStrategy } from "ol/loadingstrategy";
import { toLonLat } from "ol/proj.js";
import { toStringHDMS } from "ol/coordinate.js";
import * as d3 from "d3";
import { ElMessage } from "element-plus";

export default {
  components: {
    VueJsonPretty,
  },
  name: "",
  data() {
    return {
      map: {},
      drawSource: new VectorSource(),
      drawVector: {},
      draw: {},
      features: [],
      idList: [],
      checks: [], // 存储选中的图层名
      layers: [],
      undoStack: [],
      view: null,
      zoom: null,
      center: null,
      rotation: null,
      miniMap: null,
      measureInteraction: null,
      olmap: null,
      scale: null,
      modify: null,
      translate: null,
      transform: null,
      defaultStyle: null,
      legendSrc: null,
      isLegend: false,
      select: null,
      selectedFeatures: [],
      isSelecting: false,
      geoJSONViewerVisible: false, // 控制GeoJSON查看器的显示
      selectedFeatureGeoJSON: null,
      parsedGeoJSON: null, // 用于存储解析后的GeoJSON数据
      // selectedDataType: "",
      selectedDataType: [],
      isPolicyDisabled: false,
      selectedYear: "",
      selectedPolicy: "noFactor",
      // typeOptions: [
      //   { value: "landuse", label: "土地利用" },
      //   { value: "greenArea", label: "绿地可达性" },

      //   { value: "greenArea", label: "绿地范围" },
      // ],
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
      shpLayer: null,
      chartVisible: false,
      chart_1_visible: true,
      chart_2_visible: false,
      chartData: [],
      images: [],
      demonstrations: [],
      tableData: [],
      tableHeaders: [],
      suggestionVisible: false,
      suggestionContent: "",
      basemapVisible: false,
      basemaps: [
        {
          name: "OSM",
          thumbnail: require("../assets/images/osm-thumbnail.jpg"),
        },
        {
          name: "ArcGIS",
          thumbnail: require("../assets/images/satellite-thumbnail.jpg"),
        },
        {
          name: "Tian",
          // thumbnail: require("../assets/images/tian-thumbnail.jpg"),
        },
        {
          name: "Gaode",
          // thumbnail : require("../assets/images/gaode-thumbnail.jpg"),
        },
        {
          name: "Baidu",
        },
        {
          name: "Bing",
        },
        {
          name: "Google",
        },
        {
          name: "WMTS",
        },
        {
          name: "None",
        },
      ],
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
    isYearDisabled(year) {
      if (!this.isPredict) {
        return year !== "2014";
      } else {
        return year !== "2030" && year !== "2040" && year !== "2050";
      }
    },
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
    toggleBasemap() {
      this.basemapVisible = !this.basemapVisible;
      // console.log(this.map.getView());
    },

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

      // let source = newBaseSource(name);

      // console.log(source);
      let layer;

      // layer = new TileLayer({
      //   properties: {
      //     name: name,
      //   },
      //   source: source,
      // });

      layer = newLayer(name);

      // 添加到最底层
      this.map.getLayers().insertAt(0, layer);

      this.basemapVisible = false;
    },

    loadShp() {
      if (this.selectedDataType.length === 0 || !this.selectedYear) {
        this.$message.error("请选择政策类型和数据年份");
      } else if (!this.selectedPolicy && this.isPredict) {
        this.$message.error("请选择政策类型");
      } else {
        let url;
        let workspace;
        switch (this.selectedDataType[0]) {
          case "landuse":
            workspace = "Landuse";
            break;
          case "greenAccessibility":
            workspace = "GreenAccessibility";
            break;
          case "greenEquity":
            workspace = "GreenEquity";
            break;
          case "others":
            workspace = "Others";
            break;
        }
        url = `http://localhost:8080/geoserver/${workspace}/wms`;
        const params = {
          LAYERS: `${workspace}:${this.selectedDataType[0]}_${this.selectedDataType[1]}_${this.selectedPolicy}_${this.selectedYear}`,
          TILED: true,
          STYLES: `${this.selectedDataType[0]}_${this.selectedDataType[1]}_style`,
        };
        console.log(params);
        if (this.shpLayer) {
          this.map.removeLayer(this.shpLayer);
        }
        this.shpLayer = new TileLayer({
          properties: {
            name: `${this.selectedDataType[0]}_${this.selectedDataType[1]}_${this.selectedPolicy}_${this.selectedYear}`,
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
            });
            drawLayer.setZIndex(1000);
            this.map.addLayer(drawLayer);
            this.map.getView().fit(drawSource.getExtent());
          })
          .catch((error) => {
            console.error("获取GeoJSON数据失败:", error);
          });

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
    testWMTS() {
      // 跳转
      this.$router.push("/testWMTS");
    },
    testWFS() {
      // 跳转
      this.$router.push("/testWFS");
    },
    toggleChart() {
      if (this.chartVisible) {
        this.chartVisible = false;
      } else {
        this.showChart();
      }
    },
    toggleSeggestion() {
      const legend = document.querySelector(".legend");
      if (this.suggestionVisible) {
        this.suggestionVisible = false;
        legend.style.right = "45px";
      } else {
        this.showSeggestion();
        legend.style.right = "25%";
      }
    },
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
    resetStatus() {
      this.map.removeInteraction(this.draw);
      this.map.removeInteraction(this.modify);
      this.map.removeInteraction(this.translate);
      this.map.removeInteraction(this.transform);
      this.map.removeInteraction(this.measureInteraction);

      this.select.getFeatures().clear();

      // 禁用select交互
      this.select.setActive(false);
      this.isSelecting = false;

      this.selectedFeatures = [];

      // 若有选中的要素，取消选中
      this.features.forEach((row) => {
        if (row.selected) {
          row.selected = false;
        }
      });
    },
    onCheckChange() {
      if (!this.map) return;

      let lastLocate = null;
      this.layers.forEach((layer) => {
        // 设置图层可见性基于 checks 数组
        layer.layer.setVisible(this.checks.includes(layer.name));

        // 如果当前图层是最后一个选中的，更新 lastLocate
        if (layer.name === this.checks[this.checks.length - 1]) {
          lastLocate = layer.locate;
          console.log(lastLocate);
        }
      });

      // 如果有位置信息，更新地图视图
      if (lastLocate) {
        this.map.getView().setZoom(lastLocate[2]);
        this.map.getView().setCenter([lastLocate[0], lastLocate[1]]);
      }
    },

    //添加绘制点线面图层
    addDrawLayer() {
      this.drawVector = new VectorLayer({
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
      });
      this.map.addLayer(this.drawVector);
    },
    //清除绘制图层
    clearDrawLayer() {
      this.resetStatus();
      this.drawVector.getSource().clear();
      this.features = [];
      this.undoStack = [];
    },
    //绘制点线面
    drawFeature(featureType = "") {
      this.resetStatus();

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
    undo() {
      if (this.undoStack.length >= 1) {
        let lastStep = this.undoStack[this.undoStack.length - 1];
        this.undoStack.pop(); // 删除最后一步
        this.drawSource.clear(); // 清空绘图源
        this.drawSource.addFeatures(lastStep); // 添加上一步的要素
        this.features = lastStep; // 同步features数组
      }
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
    //定位
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
    //删除
    deleteFeature(row) {
      const source = this.drawVector.getSource();
      const features = source.getFeatures();
      const feature = features.find((f) => f.getId() === row.id);
      if (feature) {
        source.removeFeature(feature);
        this.features = this.features.filter((f) => f.id !== row.id);
      }
    },
    selectFeature() {
      this.resetStatus();
      this.isSelecting = true;

      // 启用select交互
      this.select.setActive(true);

      const container = document.getElementById("popup");
      const content = document.getElementById("popup-content");
      const closer = document.getElementById("popup-closer");

      const overlay = new Overlay({
        element: container,
        autoPan: {
          animation: {
            duration: 250,
          },
        },
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

      this.map.on("singleclick", function (evt) {
        const coordinate = evt.coordinate;
        const hdms = toStringHDMS(toLonLat(coordinate));

        overlay.setPosition(coordinate);
      });
    },
    translateFeature() {
      this.map.removeInteraction(this.draw);

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
        this.map.removeInteraction(this.translate);
      });

      this.map.addInteraction(this.translate);
    },
    editVertices() {
      this.map.removeInteraction(this.draw);
      this.map.removeInteraction(this.modify);

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

    rotateFeature() {
      this.resetStatus();

      // this.draw = new Select({
      //   wrapX: false,
      // });

      // this.map.addInteraction(this.draw);

      // this.draw.on("select", (event) => {
      //   if (event.selected.length > 0) {
      //     const feature = event.selected[0];
      //     this.enableFeatureRotate(feature);
      //   }
      // });

      this.features.forEach((row) => {
        const feature = this.drawSource.getFeatureById(row.id);
        if (feature) {
          this.enableFeatureRotate(feature);
        }
      });

      this.defaultStyle = new Modify({ source: this.drawVector.getSource() })
        .getOverlay()
        .getStyleFunction();
    },

    enableFeatureRotate(feature) {
      this.transform = new Modify({
        source: this.drawSource,
        features: new Collection([feature]),
        condition: (event) => {
          return primaryAction(event) && !platformModifierKeyOnly(event);
        },
        deleteCondition: never,
        insertVertexCondition: never,
        style: (feature) => {
          feature.get("features").forEach((modifyFeature) => {
            const modifyGeometry = modifyFeature.get("modifyGeometry");
            if (modifyGeometry) {
              const point = feature.getGeometry().getCoordinates();
              let modifyPoint = modifyGeometry.point;
              if (!modifyPoint) {
                modifyPoint = point;
                modifyGeometry.point = modifyPoint;
                modifyGeometry.geometry0 = modifyGeometry.geometry;
                const result = this.calculateCenter(modifyGeometry.geometry0);
                modifyGeometry.center = result.center;
                modifyGeometry.minRadius = result.minRadius;
              }

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

      this.map.addInteraction(this.transform);
      this.transform.on("modifystart", (event) => {
        event.features.forEach((feature) => {
          feature.set(
            "modifyGeometry",
            { geometry: feature.getGeometry().clone() },
            true
          );
        });
      });

      this.transform.on("modifyend", (event) => {
        event.features.forEach((feature) => {
          const modifyGeometry = feature.get("modifyGeometry");
          if (modifyGeometry) {
            feature.setGeometry(modifyGeometry.geometry);
            feature.unset("modifyGeometry", true);
          }
        });
      });

      // this.changeInteraction();
    },

    changeInteraction() {
      if (this.transform !== null) this.map.removeInteraction(this.transform);
      if (this.transform !== null) {
        this.transform.on("modifystart", (event) => {
          event.features.forEach((feature) => {
            feature.set(
              "modifyGeometry",
              { geometry: feature.getGeometry().clone() },
              true
            );
          });
        });

        this.transform.on("modifyend", (event) => {
          event.features.forEach((feature) => {
            const modifyGeometry = feature.get("modifyGeometry");
            if (modifyGeometry) {
              feature.setGeometry(modifyGeometry.geometry);
              feature.unset("modifyGeometry", true);
            }
          });
        });
      }
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
    measureDistance() {
      this.resetStatus();
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

      this.measureInteraction.on("drawstart", (event) => {
        const measureTooltipElement = document.createElement("div");
        measureTooltipElement.className = "ol-tooltip ol-tooltip-measure";
        this.createMeasureTooltip(event.feature, measureTooltipElement);
      });

      this.measureInteraction.on("drawend", (event) => {
        // this.measureInteraction.setActive(false);

        // 获取绘制的要素
        const feature = event.feature;

        // 设置要素的样式为虚线
        feature.setStyle(
          new Style({
            stroke: new Stroke({
              color: "rgba(0, 0, 255, 0.5)",
              lineDash: [10, 10],
              width: 3,
            }),
          })
        );
      });
    },

    createMeasureTooltip(feature, tooltipElement) {
      const tooltipCoord = feature.getGeometry().getLastCoordinate();
      tooltipElement.innerHTML = "起点";

      const tooltip = new Overlay({
        element: tooltipElement,
        offset: [0, -15],
        positioning: "bottom-center",
      });
      this.map.addOverlay(tooltip);

      let listener;
      feature.getGeometry().on("change", (evt) => {
        const geom = evt.target;
        const output = this.formatLength(geom);
        tooltipElement.innerHTML = output;
        tooltip.setPosition(geom.getLastCoordinate());
      });

      feature.on("change", () => {
        this.map.removeOverlay(tooltip);
        unByKey(listener);
      });
    },

    formatLength(line) {
      const length = getLength(line);
      let output;
      if (length > 100) {
        output = Math.round((length / 1000) * 100) / 100 + " km";
      } else {
        output = Math.round(length * 100) / 100 + " m";
      }
      return output;
    },

    onZoom(isZoomIn) {
      if (!this.view) return;
      const curZoom = this.view.getZoom();
      this.view.setZoom(isZoomIn ? curZoom + 1 : curZoom - 1);
    },
    onMoveWh() {
      if (!this.view) return;
      console.log(this.view);
      this.view.setCenter([12732996.6685, 3551713.9202]);
      this.view.setZoom(12);
    },
    // 复位
    onRestore() {
      if (!this.view) return;

      this.view.setZoom(this.zoom);
      this.view.setCenter(this.center);
      this.view.setRotation(this.rotation);
    },
    onScaleChange(type) {
      if (!this.olmap) return;

      // 移除旧比例尺
      this.scale && this.olmap.removeControl(this.scale);
      // 创建新比例尺
      this.scale = new ScaleLine({ bar: type === "bar" });
      // 添加到地图
      this.olmap.addControl(this.scale);
    },
    openFileUpload() {
      this.$refs.fileInput.click();
    },
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
    async loadShapefile(file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target.result;
        const geojsons = await this.convertShpToGeoJSON(arrayBuffer);
        this.displayGeojson(geojsons);
      };
      reader.readAsArrayBuffer(file);
    },
    async convertShpToGeoJSON(arrayBuffer) {
      const shpData = await shp(arrayBuffer);
      let geojsons = [];

      // 检查是否为数组
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
          area: 0,
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

    // 初始化地图
    initMap() {
      let source = newBaseSource("OSM");

      this.map = new Map({
        // controls: defaultControls().extend([overviewMapControl]),
        target: "mapDom",
        // layers: layers,
        view: new View({
          projection: "EPSG:3857",
          center: [12758612.973162018, 3562849.0216611675],
          zoom: 17.5,
        }),
      });

      this.setBasemap("Gaode");

      console.log(this.map);

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

      // // 增加鼠标悬停效果
      // this.map.on("pointermove", (event) => {
      //   let hoveredFeature = null;

      //   let selected = false;

      //   this.map.forEachFeatureAtPixel(event.pixel, (feature) => {
      //     hoveredFeature = feature;
      //   });

      //   // 恢复除悬停要素外的样式
      //   this.drawSource.getFeatures().forEach((feature) => {
      //     selected = this.selectedFeatures.includes(feature);

      //     if (feature !== hoveredFeature && !selected) {
      //       feature.setStyle(this.myStyle);
      //     }
      //   });

      //   // 设置悬停要素的样式
      //   if (hoveredFeature) {
      //     if (!selected) {
      //       hoveredFeature.setStyle(
      //         new Style({
      //           stroke: new Stroke({
      //             color: "yellow",
      //             width: 2,
      //           }),
      //           fill: new Fill({
      //             color: "rgba(255, 255, 0, 0.3)",
      //           }),
      //         })
      //       );
      //     }
      //   }
      // });

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
        }),
      });

      this.map.addInteraction(this.select);
    },
    // onFeatureSelectChange(row) {
    //   const feature = this.drawSource.getFeatureById(row.id);
    //   if (feature) {
    //     feature.set("selected", row.selected);
    //     if (row.selected) {
    //       this.selectedFeatures.push(feature);
    //     } else {
    //       const index = this.selectedFeatures.indexOf(feature);
    //       if (index > -1) {
    //         this.selectedFeatures.splice(index, 1);
    //       }
    //     }
    //     this.updateSelectInteraction();
    //   }
    // },
    onFeatureSelectChange(row) {
      const feature = this.drawSource.getFeatureById(row.id);
      if (row.selected) {
        this.select.getFeatures().push(feature);
      } else {
        this.select.getFeatures().remove(feature);
      }
      this.selectedFeatures = this.select.getFeatures().getArray();
    },
    updateSelectInteraction() {
      if (this.draw instanceof Select) {
        this.draw.getFeatures().clear();
        this.draw.getFeatures().extend(this.selectedFeatures);
      }
    },

    viewFeatureGeoJSON(row) {
      const feature = this.drawSource.getFeatureById(row.id);
      if (feature) {
        const geojson = new GeoJSON().writeFeatureObject(feature);
        this.parsedGeoJSON = geojson;
        this.geoJSONViewerVisible = true;
      }
      console.log(this.parsedGeoJSON);
    },
    closeGeoJSONViewer() {
      this.geoJSONViewerVisible = false;
    },
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
  },
};
</script>

<style scoped>
.logo {
  display: inline-flex; /* 或者使用 display: flex; 根据需要 */
  align-items: center; /* 垂直居中对齐 */
  font-size: 1.5em; /* 调整字体大小 */
  font-weight: bold; /* 调整字体粗细 */
  color: #333; /* 调整文本颜色 */
}

.logo-icon {
  width: 40px; /* 调整图标宽度 */
  height: 40px; /* 调整图标高度 */
  margin-right: 10px; /* 图标与文本之间的间距 */
  vertical-align: middle; /* 确保图标垂直居中对齐文本 */
}

.container {
  display: flex;
  flex-direction: column;
  height: 80vh;
  /* padding: 10px;  */
  margin-left: 80px;
  margin-right: 80px;
  margin-top: 20px;
  box-sizing: border-box;
}

.header {
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

.logo {
  font-size: 24px;
  font-weight: bold;
}

.nav {
  display: flex;
  gap: 10px;
}

.promotion {
  font-size: 14px;
  color: red;
}

.map-wrapper {
  position: relative;
  flex: 1;
  display: flex;
  height: calc(100% - 50px); /* Adjust height to consider the header */
}

.legend {
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

#mapDom {
  flex: 1;
  height: 100%;
}

.toolbar {
  position: absolute;
  top: 290px;
  left: 10px;
  z-index: 1000;
  max-width: 5%;
  display: flex;
  flex-direction: column;
}

.map-controls {
  position: absolute;
  top: 290px;
  left: 100px;
  z-index: 1000;
  max-width: 5%;
  display: flex;
  flex-direction: column;
}

.basemap-container {
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

.button-group {
  margin-bottom: 10px;
}

.button-group:last-child {
  margin-bottom: 0;
}

.layers-control {
  position: absolute;
  top: 40px;
  right: 10px;
  width: 200px;
  max-height: 400px;
  overflow-y: auto;
}

.attribute-panel {
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

.el-dialog__body {
  max-height: 70vh;
  overflow: auto;
}

.ol-tooltip {
  position: relative;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  color: white;
  padding: 4px 8px;
  opacity: 0.7;
  white-space: nowrap;
  font-size: 12px;
}
.ol-tooltip-measure {
  opacity: 1;
  font-weight: bold;
}
.ol-tooltip-measure::before {
  border-top: 6px solid rgba(0, 0, 0, 0.5);
  border-right: 6px solid transparent;
  border-left: 6px solid transparent;
  content: "";
  position: absolute;
  bottom: -6px;
  margin-left: -7px;
  left: 50%;
}
.geojson-viewer {
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
  float: right;
  padding: 0;
  color: #f56c6c;
}

.active {
  background-color: #409eff;
  color: #fff;
}

/* 鹰眼控件 */
.map .ol-custom-overviewmap,
.map .ol-custom-overviewmap.ol-uncollapsible {
  bottom: auto;
  left: auto;
  right: 0;
  top: 0;
}

.map .ol-custom-overviewmap:not(.ol-collapsed) {
  border: 1px solid black;
}

.map .ol-custom-overviewmap .ol-overviewmap-map {
  border: none;
  width: 300px;
}

.map .ol-custom-overviewmap .ol-overviewmap-box {
  border: 2px solid red;
}

.map .ol-custom-overviewmap:not(.ol-collapsed) button {
  bottom: auto;
  left: auto;
  right: 1px;
  top: 1px;
}

.chart-panel {
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
.collapse {
  transform: translateX(100%);
}
.chart-header {
  padding: 10px;
  border-bottom: 1px solid #eee;

  text-align: center;

  font-size: 16px;
}
.el-icon-close {
  float: right;
  cursor: pointer;
}
.chart-body-1 {
  padding: 5px;
}

.chart-body-2 {
  padding: 5px;
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
.ol-popup:after,
.ol-popup:before {
  top: 100%;
  border: solid transparent;
  content: " ";
  height: 0;
  width: 0;
  position: absolute;
  pointer-events: none;
}
.ol-popup:after {
  border-top-color: white;
  border-width: 10px;
  left: 48px;
  margin-left: -10px;
}
.ol-popup:before {
  border-top-color: #cccccc;
  border-width: 11px;
  left: 48px;
  margin-left: -11px;
}
.ol-popup-closer {
  text-decoration: none;
  position: absolute;
  top: 2px;
  right: 8px;
}
.ol-popup-closer:after {
  content: "✖";
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

.suggestion-panel p {
  margin: 0;
  font-size: 1em;
  color: #606266;
}
</style>
