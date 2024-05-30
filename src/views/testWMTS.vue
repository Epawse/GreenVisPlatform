<template>
  <div>
    <h1>测试WMTS</h1>
  </div>
  <div>
    <button @click="returnToMain">返回</button>
  </div>
  <div id="map" class="map"></div>
</template>

<script>
import Map from "ol/Map.js";
import View from "ol/View.js";
import { defaults as defaultControls } from "ol/control.js";
import { getWidth, getTopLeft } from "ol/extent.js";
import TileLayer from "ol/layer/Tile.js";
import { get as getProjection } from "ol/proj.js";
import OSM from "ol/source/OSM.js";
import WMTS from "ol/source/WMTS.js";
import WMTSTileGrid from "ol/tilegrid/WMTS.js";
import { Projection } from "ol/proj.js";
export default {
  methods: {
    init() {
      var gridsetName = "EPSG:4326";
      var gridNames = [
        "EPSG:4326:0",
        "EPSG:4326:1",
        "EPSG:4326:2",
        "EPSG:4326:3",
        "EPSG:4326:4",
        "EPSG:4326:5",
        "EPSG:4326:6",
        "EPSG:4326:7",
        "EPSG:4326:8",
        "EPSG:4326:9",
        "EPSG:4326:10",
        "EPSG:4326:11",
        "EPSG:4326:12",
        "EPSG:4326:13",
        "EPSG:4326:14",
        "EPSG:4326:15",
        "EPSG:4326:16",
        "EPSG:4326:17",
        "EPSG:4326:18",
        "EPSG:4326:19",
        "EPSG:4326:20",
        "EPSG:4326:21",
      ];
      var baseUrl = "http://localhost:8080/geoserver/gwc/service/wmts";
      var style = "";
      var format = "image/png";
      var infoFormat = "text/html";
      var layerName = "Landuse:landuse_predict_noFactor_2030";
      var projection = new Projection({
        code: "EPSG:4326",
        units: "degrees",
        axisOrientation: "neu",
      });
      var resolutions = [
        0.703125, 0.3515625, 0.17578125, 0.087890625, 0.0439453125,
        0.02197265625, 0.010986328125, 0.0054931640625, 0.00274658203125,
        0.001373291015625, 6.866455078125e-4, 3.4332275390625e-4,
        1.71661376953125e-4, 8.58306884765625e-5, 4.291534423828125e-5,
        2.1457672119140625e-5, 1.0728836059570312e-5, 5.364418029785156e-6,
        2.682209014892578e-6, 1.341104507446289e-6, 6.705522537231445e-7,
        3.3527612686157227e-7,
      ];
      var baseParams = [
        "VERSION",
        "LAYER",
        "STYLE",
        "TILEMATRIX",
        "TILEMATRIXSET",
        "SERVICE",
        "FORMAT",
      ];

      var params = {
        VERSION: "1.0.0",
        LAYER: layerName,
        STYLE: style,
        TILEMATRIX: gridNames,
        TILEMATRIXSET: gridsetName,
        SERVICE: "WMTS",
        FORMAT: format,
      };

      var url = baseUrl + "?";
      for (var i = 0; i < baseParams.length; i++) {
        var p = baseParams[i];
        url += p + "=" + params[p] + "&";
      }
      console.log(url);

      const map = new Map({
        layers: [
          new TileLayer({
            source: new OSM(),
            opacity: 0.7,
          }),
          new TileLayer({
            opacity: 0.7,
            source: new WMTS({
              attributions: "...",
              url: url,
              layer: "Landuse:landuse_predict_noFactor_2030",
              matrixSet: "EPSG:4326",
              format: "image/png",
              projection: projection,
              tileGrid: new WMTSTileGrid({
                tileSize: [256, 256],
                extent: [-180.0, -90.0, 180.0, 90.0],
                origin: [-180.0, 90.0],
                resolutions: resolutions,
                matrixIds: params["TILEMATRIX"],
              }),
              style: "Landuse:landuse_predict_style",
            }),
          }),
        ],
        target: "map",
        controls: defaultControls({
          attributionOptions: {
            collapsible: false,
          },
        }),
        view: new View({
          center: [0, 0],
          zoom: 2,
          resolutions: resolutions,
          projection: projection,
          extent: [-180.0, -90.0, 180.0, 90.0],
        }),
      });
      map
        .getView()
        .fit(
          [
            113.73282477419558, 22.39343905200582, 114.62931714067045,
            22.873719164378816,
          ],
          map.getSize()
        );
    },
    returnToMain() {
      this.$router.push("/map");
    },
  },
  mounted() {
    this.init();
  },
};
</script>

<style scoped>
.map {
  width: 100%;
  height: 800px;
}
</style>
