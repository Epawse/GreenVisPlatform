# GIS操作原理与属性设置完整指南

> **城市绿色空间展示平台** - 基于 OpenLayers 的 WebGIS 技术文档
>
> 最后更新：2025-12-03

---

## 📚 目录

1. [坐标系统与转换](#1-坐标系统与转换)
2. [底图图层配置](#2-底图图层配置)
3. [矢量图层与样式](#3-矢量图层与样式)
4. [颜色系统与视觉设计](#4-颜色系统与视觉设计)
5. [地图交互操作](#5-地图交互操作)
6. [数据加载与渲染](#6-数据加载与渲染)
7. [性能优化配置](#7-性能优化配置)

---

## 1. 坐标系统与转换

### 1.1 支持的坐标系统

| 坐标系 | 代码 | 用途 | 范围 |
|--------|------|------|------|
| **Web Mercator** | `EPSG:3857` | 主要地图投影 | 全球（不含极地） |
| **WGS84** | `EPSG:4326` | GPS坐标、天地图 | 全球 |
| **百度坐标系** | `BD:09` | 百度地图专用 | 中国 |

### 1.2 坐标转换原理

#### WGS84 ↔ 百度坐标系 (BD:09)

**转换算法位置：** `src/utils/bd09.js`

**核心函数：**

```javascript
// WGS84经纬度 → 百度墨卡托坐标
lngLatToMercator([lng, lat]) → [x, y]

// 百度墨卡托坐标 → WGS84经纬度
mercatorToLngLat([x, y]) → [lng, lat]
```

**转换原理：**

1. **分带转换**：使用6组转换参数矩阵（LLBAND、MCBAND）
2. **多项式拟合**：通过9次多项式进行高精度转换
3. **范围限制**：
   - 经度范围：-180° ~ 180°
   - 纬度范围：-74° ~ 74°

**关键参数矩阵：**

```javascript
// 纬度分带（度）
LLBAND = [75, 60, 45, 30, 15, 0]

// 墨卡托Y坐标分带（米）
MCBAND = [12890594.86, 8362377.87, 5591021, 3481989.83, 1678043.12, 0]

// 经纬度 → 墨卡托转换参数（6组）
LL2MC = [ [...], [...], ... ]

// 墨卡托 → 经纬度转换参数（6组）
MC2LL = [ [...], [...], ... ]
```

**转换公式：**
```
X = a0 + a1*|lng|
Y = a2 + a3*lat' + a4*lat'^2 + ... + a8*lat'^6
其中 lat' = |lat| / a9
```

### 1.3 投影转换实践

**OpenLayers 投影转换示例：**

```javascript
import { transform } from 'ol/proj';

// EPSG:4326 → EPSG:3857
const mercatorCoord = transform(
  [114.0579, 22.5431],  // 深圳 [lng, lat]
  'EPSG:4326',
  'EPSG:3857'
);

// EPSG:3857 → EPSG:4326
const wgs84Coord = transform(
  [12697377, 2563938],
  'EPSG:3857',
  'EPSG:4326'
);
```

---

## 2. 底图图层配置

### 2.1 瓦片图层架构

**文件位置：**
- `src/utils/createLayer.js` - 旧版图层创建
- `src/utils/newLayer.js` - 新版图层创建（推荐）

### 2.2 支持的底图类型

#### 2.2.1 天地图（Tianditu）

**技术规格：**
```javascript
{
  type: 'TileLayer',
  source: 'XYZ',
  projection: 'EPSG:4326',  // 经纬度投影
  url: 'http://t{0-7}.tianditu.gov.cn/vec_c/wmts?...',
  apiKey: '719a5d3d8f259e8c5554d3fbb491fbdb'
}
```

**URL模板参数：**
- `{z}` - 缩放级别（TILEMATRIX）
- `{x}` - 列号（TILECOL）
- `{y}` - 行号（TILEROW）
- `{0-7}` - 服务器负载均衡（8台服务器）

**优化配置：**
```javascript
preload: 0,                    // 不预加载
useInterimTilesOnError: false  // 错误时不使用临时瓦片
```

#### 2.2.2 高德地图（Amap/Gaode）

**技术规格：**
```javascript
{
  type: 'TileLayer',
  source: 'XYZ',
  projection: 'EPSG:3857',  // Web Mercator
  url: 'http://webrd0{1-4}.is.autonavi.com/appmaptile?...'
}
```

**URL参数说明：**
- `lang=zh_cn` - 中文标注
- `size=1` - 瓦片大小
- `scl=1` - 缩放比例
- `style=8` - 地图样式
- `lstyle=7` - 标注样式

#### 2.2.3 百度地图（Baidu）

**坐标系统：** BD:09（百度专用坐标系）

**特殊配置：**
```javascript
{
  projection: new Projection({
    code: 'BD:09',
    extent: [-20037726.37, -11708041.66, 20037726.37, 12474104.17],
    units: 'm',
    axisOrientation: 'neu'
  })
}
```

**瓦片网格：**
```javascript
resolutions: [
  262144, 131072, 65536, 32768, 16384,
  8192, 4096, 2048, 1024, 512,
  256, 128, 64, 32, 16, 8, 4, 2, 1
]
// 计算公式: 2^(18-z)
```

**瓦片URL处理：**
```javascript
tileUrlFunction: function(tileCoord) {
  let x = tileCoord[1] < 0 ? `M${-tileCoord[1]}` : tileCoord[1];
  let y = -(tileCoord[2] + 1);  // Y轴反向
  let z = tileCoord[0];

  return `http://online{0-3}.map.bdimg.com/onlinelabel/
    ?qt=tile&x=${x}&y=${y}&z=${z}&...`;
}
```

#### 2.2.4 OSM (OpenStreetMap)

**最简配置：**
```javascript
{
  type: 'TileLayer',
  source: new OSM(),  // OpenLayers内置
  projection: 'EPSG:3857'
}
```

#### 2.2.5 ArcGIS 卫星影像

**技术规格：**
```javascript
{
  type: 'TileLayer',
  source: 'XYZ',
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/
        World_Imagery/MapServer/tile/{z}/{y}/{x}',
  maxZoom: 19
}
```

#### 2.2.6 Bing 地图

**API密钥配置：**
```javascript
{
  type: 'TileLayer',
  source: new BingMaps({
    key: 'AvehefmVM_surC2UyDjyO2T_EvSgRUA9Te3_9D_sj88ZYEBNNWxaufCSPGzecf-B',
    imagerySet: 'RoadOnDemand'  // 道路图
  })
}
```

**可用影像集：**
- `Road` - 道路图
- `RoadOnDemand` - 按需道路图
- `Aerial` - 卫星影像
- `AerialWithLabelsOnDemand` - 带标注的卫星影像

#### 2.2.7 Google 地图

**技术规格：**
```javascript
{
  url: 'http://mt{0-3}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
  projection: 'EPSG:3857'
}
```

**地图类型参数（lyrs）：**
- `m` - 道路图
- `s` - 卫星图
- `p` - 地形图
- `h` - 道路 + 地形

### 2.3 性能优化参数

**通用瓦片图层优化配置：**

```javascript
const tileLayerConfig = {
  // 渲染优化
  preload: 0,                      // 预加载层数（0=不预加载）
  useInterimTilesOnError: false,   // 错误时不使用临时瓦片

  // 可见性
  visible: true,                   // 初始可见性
  opacity: 1.0,                    // 不透明度 (0-1)

  // 层级控制
  zIndex: 0,                       // Z轴顺序（底图通常为0）
  minZoom: 0,                      // 最小缩放级别
  maxZoom: 20,                     // 最大缩放级别

  // 属性
  properties: {
    name: 'basemap_name',
    title: '底图标题',
    type: 'basemap'
  }
};
```

---

## 3. 矢量图层与样式

### 3.1 矢量图层类型

#### 3.1.1 绘制图层（Draw Layer）

**用途：** 用户交互绘制的临时图形

**配置：** `Map.vue` - `addDrawLayer()`

```javascript
{
  type: 'VectorLayer',
  source: VectorSource,
  zIndex: 1200,  // 高优先级，确保在顶层

  // 性能关键配置
  updateWhileAnimating: true,      // 动画时也更新
  updateWhileInteracting: true,    // 交互时也更新
  renderBuffer: 250,               // 渲染缓冲区（像素）

  // 样式
  style: {
    fill: { color: 'rgba(255, 255, 255, 0.2)' },
    stroke: { color: '#ffcc33', width: 3 },
    image: Circle { radius: 7, fill: '#ffcc33' }
  }
}
```

#### 3.1.2 选择图层（Select Layer）

**用途：** 高亮显示选中的要素

```javascript
{
  style: {
    fill: { color: 'rgba(255, 255, 0, 0.7)' },   // 黄色半透明
    stroke: { color: 'rgba(0, 0, 0, 0.7)', width: 2 },
    image: Circle {
      radius: 7,
      fill: 'rgba(0, 0, 0, 0.7)'
    }
  }
}
```

#### 3.1.3 WMS/WFS 图层

**WMS（Web Map Service）：**
```javascript
{
  type: 'TileLayer',
  source: new TileWMS({
    url: 'http://localhost:8080/geoserver/wms',
    params: {
      'LAYERS': 'workspace:layer_name',
      'TILED': true,
      'FORMAT': 'image/png',
      'TRANSPARENT': true
    },
    serverType: 'geoserver'
  })
}
```

**WFS（Web Feature Service）：**
```javascript
{
  type: 'VectorLayer',
  source: new VectorSource({
    format: new GeoJSON(),
    url: function(extent) {
      return 'http://localhost:8080/geoserver/wfs?' +
        'service=WFS&version=1.1.0&request=GetFeature' +
        '&typename=workspace:layer_name' +
        '&outputFormat=application/json' +
        '&srsname=EPSG:3857' +
        `&bbox=${extent.join(',')},EPSG:3857`;
    },
    strategy: bboxStrategy  // 按视窗范围加载
  })
}
```

### 3.2 数据格式支持

| 格式 | 类型 | 用途 | 解析器 |
|------|------|------|--------|
| **GeoJSON** | 矢量 | 通用空间数据 | `ol/format/GeoJSON` |
| **Shapefile** | 矢量 | 通过shpjs转GeoJSON | `shpjs` |
| **KML** | 矢量 | Google Earth | `ol/format/KML` |
| **GPX** | 矢量 | GPS轨迹 | `ol/format/GPX` |
| **MVT** | 矢量瓦片 | 大数据量 | `ol/format/MVT` |
| **WMS** | 栅格 | 地图服务 | `ol/source/TileWMS` |
| **WMTS** | 栅格 | 瓦片服务 | `ol/source/WMTS` |

---

## 4. 颜色系统与视觉设计

### 4.1 项目配色方案

#### 4.1.1 主题色

**黄色系（绘制/高亮）：**
```css
主色: #ffcc33      /* 黄金色 */
深色: #e6b800      /* 深黄 */
浅色: rgba(255, 204, 51, 0.2)  /* 半透明黄 */
```

**用途：**
- 绘制工具的边框和点
- 选中要素的高亮
- 活动按钮的强调色

#### 4.1.2 语义色

**成功/绿色：**
```css
绿色: #67C23A     /* Element Plus 成功色 */
用途: 确认操作、正常状态
```

**警告/橙色：**
```css
橙色: #E6A23C     /* Element Plus 警告色 */
用途: 警告提示、需注意项
```

**错误/红色：**
```css
红色: #F56C6C     /* Element Plus 错误色 */
用途: 错误提示、删除操作
```

**信息/蓝色：**
```css
蓝色: #409EFF     /* Element Plus 主色 */
用途: 信息提示、链接
```

### 4.2 图层样式配置

#### 4.2.1 点要素样式

**标准点样式：**
```javascript
new Style({
  image: new Circle({
    radius: 7,              // 半径（像素）
    fill: new Fill({
      color: '#ffcc33'      // 填充色
    }),
    stroke: new Stroke({
      color: '#ffffff',     // 边框色
      width: 2              // 边框宽度
    })
  })
})
```

**聚合点样式：**
```javascript
new Style({
  image: new Circle({
    radius: 10 + size * 2,  // 根据聚合数量动态调整
    fill: new Fill({
      color: `rgba(255, 204, 51, ${0.3 + size * 0.1})`
    })
  }),
  text: new Text({
    text: size.toString(),
    fill: new Fill({ color: '#000' }),
    font: 'bold 14px sans-serif'
  })
})
```

#### 4.2.2 线要素样式

**标准线样式：**
```javascript
new Style({
  stroke: new Stroke({
    color: '#ffcc33',       // 线条颜色
    width: 3,               // 线宽（像素）
    lineDash: [5, 10],      // 虚线样式 [实线, 间隔]（可选）
    lineCap: 'round',       // 端点样式: 'butt' | 'round' | 'square'
    lineJoin: 'round'       // 转角样式: 'bevel' | 'round' | 'miter'
  })
})
```

**箭头线样式：**
```javascript
new Style({
  stroke: new Stroke({
    color: '#ffcc33',
    width: 2
  }),
  // 箭头（使用图标）
  image: new Icon({
    src: 'arrow.png',
    anchor: [0.5, 0.5],
    rotateWithView: true    // 随视图旋转
  })
})
```

#### 4.2.3 面要素样式

**标准面样式：**
```javascript
new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.2)'  // 半透明填充
  }),
  stroke: new Stroke({
    color: '#ffcc33',
    width: 3
  })
})
```

**带图案填充：**
```javascript
// 创建画布图案
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
canvas.width = 8;
canvas.height = 8;
context.fillStyle = '#ffcc33';
context.fillRect(0, 0, 4, 4);
context.fillRect(4, 4, 4, 4);

// 应用图案
new Style({
  fill: new Fill({
    color: context.createPattern(canvas, 'repeat')
  })
})
```

### 4.3 文本标注样式

**基础文本样式：**
```javascript
new Style({
  text: new Text({
    text: feature.get('name'),           // 文本内容
    font: 'bold 14px "Microsoft YaHei"', // 字体
    textAlign: 'center',                 // 对齐: 'left' | 'center' | 'right'
    textBaseline: 'middle',              // 基线: 'top' | 'middle' | 'bottom'
    offsetX: 0,                          // X偏移（像素）
    offsetY: -15,                        // Y偏移（像素）
    fill: new Fill({
      color: '#000000'                   // 文字颜色
    }),
    stroke: new Stroke({
      color: '#ffffff',                  // 描边颜色（提高可读性）
      width: 3
    }),
    backgroundFill: new Fill({
      color: 'rgba(255, 255, 255, 0.8)' // 背景填充
    }),
    padding: [2, 4, 2, 4]               // 内边距 [上, 右, 下, 左]
  })
})
```

### 4.4 动态样式（Style Function）

**根据属性动态设置样式：**
```javascript
style: function(feature) {
  const value = feature.get('population');

  // 颜色梯度
  let color;
  if (value > 100000) {
    color = 'rgba(255, 0, 0, 0.7)';      // 红色（高密度）
  } else if (value > 50000) {
    color = 'rgba(255, 165, 0, 0.7)';    // 橙色（中密度）
  } else {
    color = 'rgba(0, 128, 0, 0.7)';      // 绿色（低密度）
  }

  return new Style({
    fill: new Fill({ color: color }),
    stroke: new Stroke({ color: '#000', width: 1 })
  });
}
```

### 4.5 透明度与混合模式

**透明度（Alpha）：**
```javascript
// RGBA格式
color: 'rgba(255, 204, 51, 0.5)'  // 50%透明度

// 十六进制格式（CSS4）
color: '#ffcc3380'  // 最后两位为透明度（80 = 50%）
```

**透明度值对照表：**
| 透明度 | 十进制 | 十六进制 | RGBA Alpha |
|--------|--------|----------|------------|
| 100% | 255 | FF | 1.0 |
| 90% | 230 | E6 | 0.9 |
| 80% | 204 | CC | 0.8 |
| 70% | 179 | B3 | 0.7 |
| 50% | 128 | 80 | 0.5 |
| 30% | 77 | 4D | 0.3 |
| 20% | 51 | 33 | 0.2 |
| 10% | 26 | 1A | 0.1 |
| 0% | 0 | 00 | 0.0 |

---

## 5. 地图交互操作

### 5.1 绘制交互（Draw Interaction）

**文件位置：** `Map.vue` - `drawFeature()`

#### 5.1.1 支持的几何类型

| 类型 | OpenLayers类型 | 说明 |
|------|---------------|------|
| 点 | `Point` | 单个点标记 |
| 线 | `LineString` | 折线 |
| 多边形 | `Polygon` | 封闭多边形 |
| 圆 | `Circle` | 圆形（半径） |
| 矩形 | `Box` | 矩形（需特殊处理） |

#### 5.1.2 绘制配置

**完整配置示例：**
```javascript
new Draw({
  source: drawSource,                // 目标数据源
  type: 'Polygon',                   // 几何类型

  // 性能优化
  freehand: false,                   // 禁用自由绘制（拖拽模式）
  stopClick: true,                   // 停止点击事件传播
  snapTolerance: 12,                 // 捕捉容差（像素）

  // 完成条件
  finishCondition: never,            // 自定义完成条件（函数）

  // 样式配置
  style: new Style({
    fill: new Fill({
      color: 'rgba(255, 255, 255, 0.8)'
    }),
    stroke: new Stroke({
      color: '#ffcc33',
      width: 2
    }),
    image: new Circle({
      radius: 7,
      fill: new Fill({ color: '#ffcc33' })
    })
  })
})
```

#### 5.1.3 绘制事件

```javascript
draw.on('drawstart', function(event) {
  const sketch = event.feature;  // 正在绘制的要素
  console.log('开始绘制');
});

draw.on('drawend', function(event) {
  const feature = event.feature;
  const geometry = feature.getGeometry();
  const type = geometry.getType();

  // 计算几何属性
  if (type === 'Polygon') {
    const area = geometry.getArea();  // 面积（平方米）
    feature.set('area', area);
  } else if (type === 'LineString') {
    const length = geometry.getLength();  // 长度（米）
    feature.set('length', length);
  }

  console.log('绘制完成', feature);
});

draw.on('drawabort', function(event) {
  console.log('绘制取消');
});
```

### 5.2 选择交互（Select Interaction）

**配置示例：**
```javascript
new Select({
  // 过滤条件
  filter: function(feature, layer) {
    return layer.get('selectable') === true;
  },

  // 选择条件
  condition: click,              // 点击选择
  // condition: pointerMove,     // 鼠标悬停选择
  // condition: doubleClick,     // 双击选择

  // 多选
  multi: true,                   // 允许多选
  toggleCondition: shiftKeyOnly, // Shift键切换选择

  // 样式
  style: new Style({
    fill: new Fill({ color: 'rgba(255, 255, 0, 0.7)' }),
    stroke: new Stroke({ color: 'rgba(0, 0, 0, 0.7)', width: 2 })
  }),

  // 限制图层
  layers: [vectorLayer],         // 只在特定图层中选择

  // 命中容差
  hitTolerance: 5                // 点击容差（像素）
})
```

### 5.3 平移交互（Translate Interaction）

**移动要素：**
```javascript
new Translate({
  features: selectedFeatures,    // 要移动的要素集合

  // 限制图层
  layers: [editableLayer],

  // 事件监听
  translatestart: function(event) {
    console.log('开始移动');
  },
  translating: function(event) {
    const coordinate = event.coordinate;
    console.log('移动中', coordinate);
  },
  translateend: function(event) {
    const features = event.features.getArray();
    console.log('移动完成', features);
  }
})
```

### 5.4 修改交互（Modify Interaction）

**编辑要素几何：**
```javascript
new Modify({
  source: vectorSource,          // 或 features: collection

  // 删除条件
  deleteCondition: function(event) {
    return shiftKeyOnly(event) && singleClick(event);
  },

  // 插入条件
  insertVertexCondition: never,  // 禁止插入顶点

  // 捕捉容差
  pixelTolerance: 10,

  // 样式
  style: new Style({
    image: new Circle({
      radius: 5,
      fill: new Fill({ color: 'orange' })
    })
  })
})
```

### 5.5 测量工具

#### 5.5.1 距离测量

**原理：** 使用 `LineString` 几何的 `getLength()` 方法

```javascript
function measureLength() {
  const draw = new Draw({
    source: measureSource,
    type: 'LineString',
    style: measureStyle
  });

  draw.on('drawend', function(event) {
    const geometry = event.feature.getGeometry();
    const length = geometry.getLength();  // 米

    // 转换单位
    let output;
    if (length > 1000) {
      output = (length / 1000).toFixed(2) + ' km';
    } else {
      output = length.toFixed(2) + ' m';
    }

    console.log('距离:', output);
  });

  map.addInteraction(draw);
}
```

#### 5.5.2 面积测量

**原理：** 使用 `Polygon` 几何的 `getArea()` 方法

```javascript
function measureArea() {
  const draw = new Draw({
    source: measureSource,
    type: 'Polygon',
    style: measureStyle
  });

  draw.on('drawend', function(event) {
    const geometry = event.feature.getGeometry();
    const area = geometry.getArea();  // 平方米

    // 转换单位
    let output;
    if (area > 10000) {
      output = (area / 10000).toFixed(2) + ' ha';  // 公顷
    } else {
      output = area.toFixed(2) + ' m²';
    }

    console.log('面积:', output);
  });

  map.addInteraction(draw);
}
```

#### 5.5.3 实时测量显示

**动态显示测量结果：**
```javascript
let sketch;
let measureTooltipElement;

draw.on('drawstart', function(event) {
  sketch = event.feature;

  // 监听几何变化
  sketch.getGeometry().on('change', function(evt) {
    const geometry = evt.target;
    let output;

    if (geometry instanceof LineString) {
      output = formatLength(geometry);
    } else if (geometry instanceof Polygon) {
      output = formatArea(geometry);
    }

    // 更新提示框
    measureTooltipElement.innerHTML = output;

    // 定位提示框
    const tooltipCoord = geometry.getLastCoordinate();
    measureTooltip.setPosition(tooltipCoord);
  });
});
```

### 5.6 捕捉（Snap）交互

**自动捕捉到现有要素：**
```javascript
new Snap({
  source: vectorSource,         // 捕捉目标数据源
  pixelTolerance: 10,          // 捕捉容差（像素）
  edge: true,                  // 捕捉到边
  vertex: true                 // 捕捉到顶点
})
```

---

## 6. 数据加载与渲染

### 6.1 数据类型层次结构

**项目数据分类：** `Map.vue` - `typeOptions`

```javascript
typeOptions = [
  {
    value: 'landuse',
    label: '土地利用',
    children: [
      { value: 'green', label: '绿地' },
      { value: 'residential', label: '居住用地' },
      { value: 'commercial', label: '商业用地' }
    ]
  },
  {
    value: 'green',
    label: '绿地',
    children: [
      { value: 'park', label: '公园绿地' },
      { value: 'protected', label: '防护绿地' },
      { value: 'production', label: '生产绿地' }
    ]
  },
  {
    value: 'accessibility',
    label: '可达性',
    children: [
      { value: 'walk', label: '步行可达性' },
      { value: 'near', label: '近邻可达性' },
      { value: 'car', label: '驾车可达性' },
      { value: 'sum', label: '总体可达性' }
    ]
  },
  {
    value: 'equity',
    label: '公平性',
    children: [
      { value: 'population', label: '人口公平性' },
      { value: 'area', label: '面积公平性' }
    ]
  }
]
```

### 6.2 时间序列数据

**年份选项：** `Map.vue` - `yearOptions`

```javascript
yearOptions = ['2014', '2030', '2040', '2050']

// 年份禁用逻辑
isYearDisabled(year) {
  // 土地利用数据只有2014年
  if (this.selectedDataType[0] === 'landuse') {
    return year !== '2014';
  }
  // 绿地数据只有2014年
  if (this.selectedDataType[0] === 'green') {
    return year !== '2014';
  }
  return false;
}
```

### 6.3 政策情景

**政策选项：** `Map.vue` - `policyOptions`

```javascript
policyOptions = [
  { value: 'noFactor', label: '无政策' },
  { value: 'withFactor', label: '有政策' }
]

// 政策禁用逻辑
isPolicyDisabled = computed(() => {
  // 只有可达性和公平性数据支持政策对比
  return !['accessibility', 'equity'].includes(this.selectedDataType[0]);
})
```

### 6.4 Shapefile 加载流程

**完整加载流程：** `Map.vue` - `loadShp()`

```javascript
async function loadShp() {
  // 1. 构造数据路径
  const dataType = this.selectedDataType.join('_');
  const year = this.selectedYear;
  const policy = this.selectedPolicy;

  const shpPath = `/geojson/${dataType}/${year}/${policy}.shp`;
  const dbfPath = `/geojson/${dataType}/${year}/${policy}.dbf`;

  // 2. 使用shpjs加载
  const geojson = await shp.combine([
    shp.parseShp(await fetch(shpPath).then(r => r.arrayBuffer())),
    shp.parseDbf(await fetch(dbfPath).then(r => r.arrayBuffer()))
  ]);

  // 3. 创建矢量源
  const vectorSource = new VectorSource({
    features: new GeoJSON().readFeatures(geojson, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    })
  });

  // 4. 创建矢量图层
  const vectorLayer = new VectorLayer({
    source: vectorSource,
    style: featureStyleFunction
  });

  // 5. 添加到地图
  map.addLayer(vectorLayer);

  // 6. 缩放到数据范围
  map.getView().fit(vectorSource.getExtent(), {
    padding: [50, 50, 50, 50],
    duration: 1000
  });
}
```

### 6.5 WMS 图层加载

**GeoServer WMS 加载：**

```javascript
function loadWMS() {
  const wmsLayer = new TileLayer({
    source: new TileWMS({
      url: '/geoserver/wms',  // 通过代理访问
      params: {
        'LAYERS': `${workspace}:${layerName}`,
        'TILED': true,
        'STYLES': `${dataType}_${subType}_style`,  // 自定义样式
        'FORMAT': 'image/png',
        'TRANSPARENT': true,
        'VERSION': '1.1.1'
      },
      serverType: 'geoserver',
      transition: 0  // 禁用淡入淡出（提高性能）
    })
  });

  map.addLayer(wmsLayer);
}
```

**SLD样式参数：**
```javascript
params: {
  'STYLES': 'green_park_style',  // GeoServer中定义的SLD样式名
  'SLD_BODY': '<StyledLayerDescriptor>...</StyledLayerDescriptor>'  // 内联SLD
}
```

### 6.6 图例加载

**动态图例获取：**

```javascript
function loadLegend() {
  const legendUrl = '/geoserver/wms?' +
    'REQUEST=GetLegendGraphic' +
    '&VERSION=1.0.0' +
    '&FORMAT=image/png' +
    `&LAYER=${workspace}:${layerName}` +
    `&STYLE=${styleName}` +
    '&WIDTH=20' +
    '&HEIGHT=20' +
    '&LEGEND_OPTIONS=fontName:Microsoft%20YaHei;fontSize:12';

  this.legendSrc = legendUrl;
  this.isLegend = true;
}
```

---

## 7. 性能优化配置

### 7.1 地图初始化优化

```javascript
new Map({
  target: 'mapDom',

  // 视图配置
  view: new View({
    projection: 'EPSG:3857',
    center: [12758612.97, 3562849.02],  // 深圳坐标
    zoom: 17.5,
    minZoom: 2,                         // 限制缩放范围
    maxZoom: 20,
    smoothResolutionConstraint: true    // 平滑缩放
  }),

  // 渲染配置
  pixelRatio: 1,                        // 像素比（降低提高性能）

  // 控件
  controls: [
    new Zoom(),
    new ZoomSlider(),
    new ScaleLine({ units: 'metric' })
  ]
})
```

### 7.2 图层渲染优化

**矢量图层优化：**
```javascript
new VectorLayer({
  source: vectorSource,

  // 关键性能参数
  updateWhileAnimating: true,      // 动画时更新
  updateWhileInteracting: true,    // 交互时更新
  renderBuffer: 250,               // 渲染缓冲区
  renderOrder: null,               // 渲染顺序函数

  // 简化配置
  declutter: true,                 // 避免标注重叠

  // 可见性优化
  minZoom: 10,                     // 最小可见缩放级别
  maxZoom: 20,                     // 最大可见缩放级别
  opacity: 1.0                     // 不透明度
})
```

**瓦片图层优化：**
```javascript
new TileLayer({
  source: tileSource,

  // 预加载配置
  preload: 0,                      // 不预加载（减少内存）
  useInterimTilesOnError: false,   // 错误时不使用临时瓦片

  // 缓存配置
  cacheSize: 2048,                 // 缓存大小（默认2048）

  // 过渡效果
  transition: 0                    // 禁用淡入淡出（提高性能）
})
```

### 7.3 样式优化

**避免复杂样式函数：**

❌ **低效：**
```javascript
style: function(feature) {
  // 每次渲染都创建新样式对象
  return new Style({
    fill: new Fill({ color: getColor(feature) }),
    stroke: new Stroke({ color: '#000', width: 1 })
  });
}
```

✅ **高效：**
```javascript
// 预定义样式缓存
const styleCache = {};

style: function(feature) {
  const type = feature.get('type');

  // 使用缓存的样式
  if (!styleCache[type]) {
    styleCache[type] = new Style({
      fill: new Fill({ color: getColor(type) }),
      stroke: new Stroke({ color: '#000', width: 1 })
    });
  }

  return styleCache[type];
}
```

### 7.4 数据加载优化

**分块加载大数据：**
```javascript
// 使用BBOX策略按视窗加载
source: new VectorSource({
  format: new GeoJSON(),
  url: function(extent) {
    return `api/features?bbox=${extent.join(',')}`;
  },
  strategy: bboxStrategy  // 只加载可见范围
})
```

**要素简化：**
```javascript
import { simplify } from 'ol/geom/Polygon';

// 简化复杂几何（减少顶点数）
const simplified = geometry.simplify(tolerance);
```

### 7.5 内存管理

**清理不用的图层：**
```javascript
// 移除图层
map.removeLayer(oldLayer);

// 清空数据源
vectorSource.clear();

// 释放交互
map.removeInteraction(draw);
```

**监控性能：**
```javascript
// 监听渲染完成
map.on('rendercomplete', function() {
  console.log('渲染完成', performance.now());
});

// 监听地图移动
map.on('moveend', function() {
  const view = map.getView();
  console.log('中心点:', view.getCenter());
  console.log('缩放级别:', view.getZoom());
});
```

---

## 📌 附录

### A. 常用颜色参考

**数据可视化配色（ColorBrewer）：**

**Sequential（序列）：**
```javascript
// 绿色系（适合绿地数据）
['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476',
 '#41ab5d', '#238b45', '#006d2c', '#00441b']

// 蓝色系（适合水体数据）
['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6',
 '#4292c6', '#2171b5', '#08519c', '#08306b']
```

**Diverging（发散）：**
```javascript
// 红-黄-绿（适合评价数据）
['#d73027', '#f46d43', '#fdae61', '#fee08b', '#ffffbf',
 '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850']
```

### B. 性能基准参考

| 场景 | 要素数量 | 推荐配置 |
|------|---------|---------|
| 轻量级 | < 1,000 | 标准配置 |
| 中等 | 1,000 - 10,000 | 样式缓存 + 渲染优化 |
| 大规模 | 10,000 - 100,000 | 矢量瓦片(MVT) + 聚合 |
| 超大规模 | > 100,000 | 服务端渲染(WMS) |

### C. 浏览器兼容性

| 浏览器 | 最低版本 | 推荐版本 |
|--------|---------|---------|
| Chrome | 91+ | 最新版 |
| Firefox | 90+ | 最新版 |
| Safari | 14+ | 最新版 |
| Edge | 91+ | 最新版 |

---

## 🔗 参考资源

- **OpenLayers 官方文档**: https://openlayers.org/
- **GeoServer 文档**: https://docs.geoserver.org/
- **天地图API**: https://lbs.tianditu.gov.cn/
- **Element Plus**: https://element-plus.org/
- **ColorBrewer**: https://colorbrewer2.org/

---

**文档版本：** v1.0
**最后更新：** 2025-12-03
**维护者：** GreenVisPlatform Team
