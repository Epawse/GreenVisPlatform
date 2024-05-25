import { OSM, XYZ } from "ol/source";
import { BingMaps } from "ol/source";
import { Vector as VectorSource } from "ol/source";
import { GeoJSON } from "ol/format";

function newBaseSource(name) {
  let source;
  let bingKey =
    "AvehefmVM_surC2UyDjyO2T_EvSgRUA9Te3_9D_sj88ZYEBNNWxaufCSPGzecf-B";
  switch (name) {
    case "OSM":
      source = new OSM();
      break;
    case "Satellite":
      source = new XYZ({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        maxZoom: 19,
      });
      break;

    case "Tian":
      source = new XYZ({
        url: "http://t{0-7}.tianditu.gov.cn/vec_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=719a5d3d8f259e8c5554d3fbb491fbdb",
        maxZoom: 18,
        projection: "EPSG:4326",
      });
      break;
    case "Gaode":
      source = new XYZ({
        url: "http://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
        maxZoom: 18,
      });
      break;
    case "Bing":
      bingKey =
        "AvehefmVM_surC2UyDjyO2T_EvSgRUA9Te3_9D_sj88ZYEBNNWxaufCSPGzecf-B";
      source = new BingMaps({
        key: bingKey,
        imagerySet: "RoadOnDemand",
      });
      break;
    case "GeoJSON":
      source = new VectorSource({
        url: "../data/line.geojson",
        format: new GeoJSON({
          dataProjection: "EPSG:4326",
          featureProjection: "EPSG:3857",
        }),
      });
      break;

    default:
      source = new OSM();
  }
  return source;
}

export default newBaseSource;
