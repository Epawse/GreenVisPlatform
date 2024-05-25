import { OSM, XYZ } from "ol/source";
import { BingMaps } from "ol/source";
import { Vector as VectorSource } from "ol/source";
import { GeoJSON } from "ol/format";
import TileLayer from "ol/layer/Tile.js";
import {
  addCoordinateTransforms,
  addProjection,
  Projection,
  transform,
} from "ol/proj";
import { TileGrid } from "ol/tilegrid";
import { TileImage } from "ol/source";
import Tile from "ol/layer/Tile"; // 瓦片渲染方法
import { lngLatToMercator, mercatorToLngLat } from "@/utils/bd09";

import { get as getProj } from "ol/proj";
import { getWidth } from "ol/extent";
import WMTS from "ol/source/WMTS.js";
import WMTSTileGrid from "ol/tilegrid/WMTS.js";

let tianKey = "719a5d3d8f259e8c5554d3fbb491fbdb";
let bingKey =
  "AvehefmVM_surC2UyDjyO2T_EvSgRUA9Te3_9D_sj88ZYEBNNWxaufCSPGzecf-B";

function createLyrBd() {
  let projBD09 = new Projection({
    code: "BD:09",
    extent: [-20037726.37, -11708041.66, 20037726.37, 12474104.17],
    units: "m",
    axisOrientation: "neu",
    global: false,
  });

  addProjection(projBD09);
  addCoordinateTransforms(
    "EPSG:4326",
    projBD09,
    function (coordinate) {
      // eslint-disable-next-line no-undef
      return lngLatToMercator(coordinate);
    },
    function (coordinate) {
      // eslint-disable-next-line no-undef
      return mercatorToLngLat(coordinate);
    }
  );
  /*定义百度地图分辨率与瓦片网格*/
  let resolutions = [];
  for (let i = 0; i <= 18; i++) {
    resolutions[i] = Math.pow(2, 18 - i);
  }

  let tilegrid = new TileGrid({
    origin: [0, 0],
    resolutions: resolutions,
  });

  /*加载百度地图离线瓦片不能用ol.source.XYZ，ol.source.XYZ针对谷歌地图（注意：是谷歌地图）而设计，
      而百度地图与谷歌地图使用了不同的投影、分辨率和瓦片网格。因此这里使用ol.source.TileImage来自行指定
      投影、分辨率、瓦片网格。*/
  let baidu_source = new TileImage({
    projection: projBD09, //投影类型
    tileGrid: tilegrid,
    tileUrlFunction: function (tileCoord) {
      if (!tileCoord) return "";
      let z = tileCoord[0];
      let x = tileCoord[1];
      let y = tileCoord[2];
      // 对编号xy处理
      let baiduX;
      baiduX = x < 0 ? x : "M" + -x;
      let baiduY;
      baiduY = -y;
      console.log("BD-09: ", x, y);
      console.log("WGS84: ", baiduX, baiduY);

      return (
        "http://online3.map.bdimg.com/onlinelabel/?qt=tile&x=" +
        baiduX +
        "&y=" +
        baiduY +
        "&z=" +
        z +
        "&styles=pl&udt=20151021&scaler=1&p=1"
      );
    },
  });

  let baidu_layer = new Tile({
    source: baidu_source,
  });

  return baidu_layer;
}

function createLyrWMTS() {
  // 1-构造分辨率序列
  const size = getWidth(getProj("EPSG:4326").getExtent()) / 256;
  const resolutions = [];
  const matrixIds = [];
  for (let i = 0; i < 19; i++) {
    resolutions.push(size / Math.pow(2, i));
    matrixIds.push(i);
  }

  // 2-创建切片规则对象
  const tileGrid = new WMTSTileGrid({
    origin: [-180, 90],
    resolutions: resolutions,
    matrixIds: matrixIds,
  });

  // 3-创建瓦片图层和wmts数据源
  return new TileLayer({
    properties: {
      name: "wmts",
      title: "WMTS服务",
    },
    source: new WMTS({
      url: `http://t{0-7}.tianditu.gov.cn/vec_c/wmts?tk=${tianKey}`,
      projection: "EPSG:4326",
      tileGrid: tileGrid,
      crossOrigin: "*",
      format: "image/png",
      layer: "vec",
      matrixSet: "c",
      style: "default",
    }),
  });
}

function newLayer(name) {
  // let source;
  let layer;

  switch (name) {
    case "OSM":
      // source = new OSM();
      layer = new TileLayer({
        properties: {
          name: "osm",
          title: "OpenStreetMap地图",
        },
        source: new OSM(),
      });

      break;
    case "ArcGIS":
      layer = new TileLayer({
        properties: {
          name: "arc",
          title: "Arcgis地图",
        },
        source: new XYZ({
          url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          maxZoom: 19,
        }),
      });
      break;

    case "Tian":
      layer = new TileLayer({
        properties: {
          name: "tian",
          title: "天地图",
        },
        source: new XYZ({
          projection: "EPSG:4326",
          url: `http://t{0-7}.tianditu.gov.cn/vec_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${tianKey}`,
        }),
      });
      break;
    case "Gaode":
      layer = new TileLayer({
        properties: {
          name: "gaode",
          title: "高德地图",
        },
        source: new XYZ({
          url: "http://webrd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scl=1&style=8&lstyle=7&x={x}&y={y}&z={z}",
        }),
      });
      break;
    case "Google":
      layer = new TileLayer({
        properties: {
          name: "google",
          title: "谷歌地图",
        },
        source: new XYZ({
          url: "http://mt{0-3}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
          projection: "EPSG:3857",
        }),
      });
      break;

    case "Bing":
      layer = new TileLayer({
        properties: {
          name: "bing",
          title: "Bing地图",
        },
        source: new BingMaps({
          key: bingKey,
          imagerySet: "RoadOnDemand",
        }),
      });
      break;
    case "Baidu":
      layer = createLyrBd();
      break;
    case "WMTS":
      layer = createLyrWMTS();
      break;

    default:
      layer = new TileLayer({
        properties: {
          name: "osm",
          title: "OpenStreetMap地图",
        },
        source: new OSM(),
      });
  }
  return layer;
}

export default newLayer;
