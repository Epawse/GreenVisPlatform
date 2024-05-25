<!-- <template>
  <div>
    <div ref="mapContainer" class="map-container"></div>
    <div class="map-buttons">
      <button @click="setMapSource('baidu')">百度地图</button>
      <button @click="setMapSource('gaode')">高德地图</button>
      <button @click="setMapSource('tianditu')">天地图</button>
    </div>
  </div>
</template>

<script>
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';

export default {
  name: 'MapComponent',
  data() {
    return {
      map: null,
      layers: {
        baidu: new TileLayer({
          source: new XYZ({
            url: 'http://online{s}.map.bdimg.com/onlinelabel/?qt=tile&x={x}&y={y}&z={z}&styles=pl&scaler=1&s=1', // URL 需要根据实际情况调整
            projection: 'EPSG:3857',
            tileGrid: /* tile grid settings */
          })
        }),
        gaode: new TileLayer({
          source: new XYZ({
            url: 'http://webst{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}', // URL 需要根据实际情况调整
            projection: 'EPSG:3857'
          })
        }),
        tianditu: new TileLayer({
          source: new XYZ({
            url: 'http://t{s}.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=你的天地图密钥', // URL 需要根据实际情况调整
            projection: 'EPSG:3857'
          })
        })
      }
    };
  },
  methods: {
    initMap() {
      this.map = new Map({
        target: this.$refs.mapContainer,
        layers: [this.layers.gaode],
        view: new View({
          center: [0, 0], // 初始中心点
          zoom: 4 // 初始缩放级别
        })
      });
    },
    setMapSource(source) {
      const layer = this.layers[source];
      if (layer) {
        this.map.setLayers([layer]);
      }
    }
  },
  mounted() {
    this.initMap();
  }
};
</script>

<style>
.map-container {
  width: 100%;
  height: 400px;
}
</style> -->
