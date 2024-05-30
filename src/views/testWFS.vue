<template>
  <div>
    <h1>测试WFS</h1>
  </div>
  <div>
    <button @click="returnToMain">返回</button>
  </div>
  <div id="map" class="map"></div>
</template>

<script>
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import { Vector as VectorLayer, Tile as TileLayer } from "ol/layer";
import { Vector as VectorSource, OSM } from "ol/source";
import { GeoJSON } from "ol/format";
import { bbox } from "ol/loadingstrategy";
import { Style, Stroke, Circle, Fill } from "ol/style";
import { Projection } from "ol/proj";

export default {
  methods: {
    init() {
      const url = "http://localhost:8080/geoserver/Landuse/ows";
      let wfsVectorLayer = new VectorLayer({
        properties: {
          name: "wfs",
          title: "WFS服务",
        },
        source: new VectorSource({
          format: new GeoJSON(),
          url: (extent) => {
            return (
              url +
              "?service=WFS&" +
              "version=1.0.0&request=GetFeature&typename=Landuse:landuse_predict_noFactor_2030&" +
              "outputFormat=application/json&srsname=EPSG:4326&" +
              "bbox=" +
              extent.join(",") +
              ",EPSG:4326"
            );
          },
          strategy: bbox,
        }),

        visible: true,
      });

      let map = new Map({
        layers: [
          new TileLayer({
            source: new OSM(), //这个会出现底图
          }),
          wfsVectorLayer,
        ],
        target: "map",
        view: new View({
          projection: "EPSG:4326",
          center: [114, 22],
          zoom: 12,
        }),
      });
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
