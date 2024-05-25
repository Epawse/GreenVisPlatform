import XYZ from "ol/source/XYZ.js";
import BingMaps from "ol/source/BingMaps.js";
import TileImage from "ol/source/TileImage.js";
import TileGrid from "ol/tilegrid/TileGrid.js";
import TileLayer from "ol/layer/Tile.js";
import TileWMS from "ol/source/TileWMS.js";
import WMTS from "ol/source/WMTS.js";
import VectorTileLayer from "ol/layer/VectorTile.js";
import VectorTileSource from "ol/source/VectorTile.js";
import WMTSTileGrid from "ol/tilegrid/WMTS.js";
import { bbox as bboxStrategy } from "ol/loadingstrategy.js";
import GeoJSON from "ol/format/GeoJSON.js";
import KML from "ol/format/KML.js";
import GPX from "ol/format/GPX.js";
import MVT from "ol/format/MVT.js";
import { get as getProj } from "ol/proj";
import { getWidth } from "ol/extent";
import { Vector as VectorLayer } from "ol/layer";
import { OSM, Vector as VectorSource } from "ol/source";
import { Fill, Stroke, Style, Text, Circle } from "ol/style";
import { Circle as CircleStyle } from "ol/style";

// 1-创建天地图
const createLyrTian = () => {
  // 你的key
  const key = "719a5d3d8f259e8c5554d3fbb491fbdb";
  return new TileLayer({
    properties: {
      name: "tian",
      title: "天地图",
    },
    visible: true,
    source: new XYZ({
      projection: "EPSG:4326",
      url: `http://t{0-7}.tianditu.gov.cn/vec_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${key}`,
    }),
  });
};

// 2-创建百度地图
const createLyrBd = () => {
  let url =
    "http://online{0-3}.map.bdimg.com/onlinelabel/?qt=tile&x={x}&y={y}&z={z}&styles=pl&udt=20191119&scaler=1&p=1";

  // 构造分辨率序列
  const resolutions = [];
  for (let i = 0; i < 19; i++) resolutions.push(Math.pow(2, 18 - i));

  // 创建切片规则对象
  const tileGrid = new TileGrid({
    origin: [0, 0],
    resolutions,
  });

  return new TileLayer({
    properties: {
      name: "baidu",
      title: "百度地图",
    },
    visible: false,
    source: new TileImage({
      projection: "EPSG:3857",
      tileGrid: tileGrid,
      tileUrlFunction: function (tileCoord) {
        if (!tileCoord) return "";

        let tempUrl = url;
        tempUrl = tempUrl.replace(
          "{x}",
          tileCoord[1] < 0 ? `M${-tileCoord[1]}` : tileCoord[1]
        );
        tempUrl = tempUrl.replace(
          "{y}",
          tileCoord[2] < 0 ? `M${tileCoord[2] + 1}` : -(tileCoord[2] + 1)
        );
        tempUrl = tempUrl.replace("{z}", tileCoord[0]);

        // 范围替换
        var match = /\{(\d+)-(\d+)\}/.exec(tempUrl);
        if (match) {
          var delta = parseInt(match[2]) - parseInt(match[1]);
          var num = Math.round(Math.random() * delta + parseInt(match[1]));
          tempUrl = tempUrl.replace(match[0], num.toString());
        }
        return tempUrl;
      },
    }),
  });
};

// 3-创建高德地图
const createLyrGd = () => {
  return new TileLayer({
    properties: {
      name: "gaode",
      title: "高德地图",
    },
    visible: false,
    source: new XYZ({
      url: "http://webrd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scl=1&style=8&lstyle=7&x={x}&y={y}&z={z}",
    }),
  });
};

// 4-创建OpenStreetMap地图
const createLyrOSM = () => {
  return new TileLayer({
    properties: {
      name: "osm",
      title: "OpenStreetMap地图",
    },
    visible: false,
    source: new OSM(),
  });
};

// 5-创建Bing地图
const createLyrBing = () => {
  // 你的key, 如AvehefmVM_surC2UyDjyO2T_EvSgRUA9Te3_9D_xxxxxxx
  const key =
    "AvehefmVM_surC2UyDjyO2T_EvSgRUA9Te3_9D_sj88ZYEBNNWxaufCSPGzecf-B";
  return new TileLayer({
    properties: {
      name: "bing",
      title: "Bing地图",
    },
    visible: false,
    source: new BingMaps({
      key: key,
      imagerySet: "RoadOnDemand",
    }),
  });
};

// 6-创建Arcgis地图
const createLyrArc = () => {
  return new TileLayer({
    properties: {
      name: "arc",
      title: "Arcgis地图",
    },
    visible: false,
    source: new XYZ({
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      projection: "EPSG:3857",
    }),
  });
};

// 7-创建WMS图层
const createLyrWMS = () => {
  // 提示跨越时使用代理使用服务代理地址
  // const url = "/local/geoserver/nurc/wms";
  const url = "http://localhost:8080/geoserver/nurc/wms";
  return new TileLayer({
    properties: {
      name: "wms",
      title: "WMS服务",
      locate: [-11853698.36373101, 4522979.57274383, 4],
    },
    visible: false,
    source: new TileWMS({
      url: url,
      params: { LAYERS: "nurc:Img_Sample" },
      projection: "EPSG:4326",
      ratio: 1,
      serverType: "geoserver",
    }),
  });
};

// 8-创建WMTS图层
const createLyrWMTS = () => {
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
    visible: false,
    source: new WMTS({
      url: "http://t{0-7}.tianditu.gov.cn/vec_c/wmts?tk=${cxApp.tianKey}",
      projection: "EPSG:4326",
      tileGrid: tileGrid,
      crossOrigin: "*",
      format: "image/png",
      layer: "vec",
      matrixSet: "c",
      style: "default",
    }),
  });
};

// 9-创建WFS图层
const createLyrWFS = () => {
  // const url = "/local/geoserver/sf/ows";
  const url = "http://localhost:8080/geoserver/sf/ows";
  return new VectorLayer({
    properties: {
      name: "wfs",
      title: "WFS服务",
      locate: [-11534858.696299767, 5493787.393992992, 7],
    },
    visible: false,
    source: new VectorSource({
      format: new GeoJSON(),
      url: (extent) => {
        return (
          url +
          "?service=WFS&" +
          "version=1.0.0&request=GetFeature&typename=sf:roads&" +
          "outputFormat=application/json&srsname=EPSG:3857&" +
          "bbox=" +
          extent.join(",") +
          ",EPSG:3857"
        );
      },
      strategy: bboxStrategy,
    }),
    style: {
      "stroke-width": 2,
      "stroke-color": "red",
      "fill-color": "rgba(100,100,100,0.25)",
    },
  });
};

// 10-创建GeoJSON图层
const createLyrGeoJSON = () => {
  return new VectorLayer({
    properties: {
      name: "geojson",
      title: "GeoJSON数据",
      locate: [12758643.216901623, 3562584.420464834, 16],
    },
    visible: false,
    source: new VectorSource({
      url: "data/lines.json",
      format: new GeoJSON({
        dataProjection: "EPSG:4326",
        featureProjection: "EPSG:3857",
      }),
    }),
    style: new Style({
      stroke: new Stroke({
        color: "#3672af",
        width: 1,
      }),
    }),
  });
};

// 11-创建KML图层
const createLyrKML = () => {
  return new VectorLayer({
    properties: {
      name: "kml",
      title: "KML数据",
      locate: [864510.0253082548, 5862753.416073311, 10],
    },
    visible: false,
    source: new VectorSource({
      url: "data/lines.kml",
      format: new KML(),
    }),
  });
};

// 12-创建GPX图层
const createLyrGPX = () => {
  const style = {
    Point: new Style({
      image: new CircleStyle({
        fill: new Fill({
          color: "rgba(255,255,0,0.4)",
        }),
        radius: 5,
        stroke: new Stroke({
          color: "#ff0",
          width: 1,
        }),
      }),
    }),
    LineString: new Style({
      stroke: new Stroke({
        color: "#f00",
        width: 3,
      }),
    }),
    MultiLineString: new Style({
      stroke: new Stroke({
        color: "#0f0",
        width: 3,
      }),
    }),
  };

  return new VectorLayer({
    properties: {
      name: "gpx",
      title: "GPX数据",
      locate: [-7916212.305874971, 5228516.283875127, 14],
    },
    visible: false,
    source: new VectorSource({
      url: "data/fells_loop.gpx",
      format: new GPX(),
    }),
    style: function (feature) {
      return style[feature.getGeometry().getType()];
    },
  });
};

// 13-创建矢量瓦片图层
const createLyrVecTile = () => {
  return new VectorTileLayer({
    properties: {
      name: "vectortile",
      title: "矢量瓦片数据",
      locate: [864510.0253082548, 5862753.416073311, 10],
    },
    visible: false,
    source: new VectorTileSource({
      format: new MVT(),
      url: "https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer/tile/{z}/{y}/{x}.pbf",
    }),
  });
};

export {
  createLyrTian,
  createLyrBd,
  createLyrGd,
  createLyrOSM,
  createLyrBing,
  createLyrArc,
  createLyrWMS,
  createLyrWMTS,
  createLyrWFS,
  createLyrGeoJSON,
  createLyrKML,
  createLyrGPX,
  createLyrVecTile,
};
