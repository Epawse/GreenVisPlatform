<template>
  <!-- Header Component -->
  <HeaderBar />

  <div class="container">
    <div class="map-wrapper">
      <!-- Map Container -->
      <div id="mapDom" class="map"></div>

      <!-- Popup -->
      <div id="popup" class="ol-popup" v-show="uiStore.isShowingPopup">
        <a href="#" id="popup-closer" class="ol-popup-closer" @click.prevent="uiStore.hidePopup">X</a>
        <div id="popup-content"></div>
      </div>

      <!-- Integrated Components -->
      <ChartPanel />
      <SuggestionPanel />
      <LayerManager />
      <MapLegend />
      <GeoJSONViewer />
      <BasemapSelector v-model:visible="uiStore.basemapVisible" @basemap-change="setBasemap" />

      <!-- Toolbar (Preserved) -->
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
          <el-button @click="$refs.fileInput.click()">上传</el-button>
        </div>
      </div>

      <!-- Attribute Panel (Preserved) -->
      <div class="attribute-panel">
        <el-table :data="features" style="width: 100%" max-height="100%" :fit="true">
          <el-table-column prop="id" label="ID" min-width="100"></el-table-column>
          <el-table-column prop="type" label="类型" min-width="100"></el-table-column>
          <el-table-column prop="area" label="面积(m²)" min-width="100"></el-table-column>
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

