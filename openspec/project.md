# Project Context

## Purpose
**城市绿色空间展示平台（GreenVisPlatform）** - 基于 WebGIS 的城市绿地可达性与公平性可视化分析系统

### 主要功能
- 绿地数据可视化（绿量、绿地可达性、公平性等）
- 多种底图支持（天地图、高德、百度、OSM、Bing、ArcGIS）
- 地图交互工具（缩放、测量、绘制）
- 数据分析图表展示
- 政策情景模拟（2014-2050年数据对比）
- 规划建议展示

## Tech Stack

### 前端框架
- **Vue 3.2.13** (Options API) - 核心框架
- **Vue Router 4.3.2** - 路由管理
- **Vuex 4.1.0** - 状态管理（目前未实际使用）
- **Element Plus 2.7.3** - UI 组件库

### 地图与可视化
- **OpenLayers 9.2.1** - WebGIS 核心库
- **Proj4 2.11.0** - 坐标系转换
- **D3.js 7.9.0** - 数据可视化
- **shpjs 5.0.1** - Shapefile 解析

### 构建工具
- **Vue CLI 5.0** - 项目脚手架
- **Webpack** (通过 Vue CLI) - 模块打包
- **Babel** - JavaScript 编译
- **ESLint 7.32.0** - 代码检查

### 其他工具
- **node-ssh 13.2.0** - 自动部署
- **vue-json-pretty 2.4.0** - JSON 数据展示
- **vue-draggable-plus 0.5.0** - 拖拽功能

## Project Conventions

### Code Style
- **语言**: 纯 JavaScript（无 TypeScript）
- **Vue 风格**: Options API（`export default { data, methods, ... }`）
- **命名约定**:
  - 组件文件：PascalCase (如 `MapComponent.vue`)
  - 工具函数：camelCase (如 `createLyrTian()`)
  - 常量：UPPER_SNAKE_CASE (如 `MCBAND`)
- **ESLint 规则**:
  - 关闭了多词组件名检查 (`vue/multi-word-component-names: off`)
  - 关闭了 `no-console`, `no-debugger`, `no-unused-vars`
- **格式化**: 无统一配置（缺少 Prettier）

### Architecture Patterns
- **单页应用 (SPA)**: 使用 Vue Router
- **组件结构**:
  - `src/views/` - 页面级组件（Map.vue 主页面 2239 行）
  - `src/components/` - 复用组件（目前较少）
  - `src/utils/` - 工具函数（图层创建、坐标转换等）
- **状态管理**:
  - Vuex store 存在但为空
  - 所有状态在组件内部管理（data）
- **数据加载**:
  - GeoJSON/Shapefile 从 `public/geojson/` 加载
  - 图表数据从 `public/tables/` 加载
  - 建议文本从 `public/suggestions/` 加载

### Testing Strategy
- **现状**: 无单元测试、无 E2E 测试
- **需求**: 待建立测试体系

### Git Workflow
- **主分支**: `main`
- **提交风格**: 简单描述（如 "1.2"）
- **部署**: 通过 `npm run build-and-deploy` 自动部署到服务器

## Domain Context

### 领域知识
- **绿地可达性**:
  - 步行可达性 (walk)
  - 近邻可达性 (near)
  - 驾车可达性 (car)
  - 总体可达性 (sum)
- **绿地公平性**: 基于人口分布的公平性分析
- **政策情景**:
  - 无政策 (noFactor)
  - 有政策 (withFactor)
  - 时间跨度: 2014, 2030, 2040, 2050

### 数据格式
- **矢量数据**: GeoJSON, Shapefile
- **栅格数据**: 通过 WMS/WMTS 服务
- **坐标系**:
  - EPSG:3857 (Web Mercator) - 主要使用
  - EPSG:4326 (WGS84) - 数据转换
  - BD:09 (百度坐标系) - 特殊支持

## Important Constraints

### 技术限制
- **浏览器兼容**: "> 1%, last 2 versions, not dead, not ie 11"
- **地图服务依赖**: 需要天地图 API Key (`719a5d3d8f259e8c5554d3fbb491fbdb`)
- **GeoServer 依赖**: WMS/WFS 服务需本地 GeoServer (localhost:8080)
- **代理配置**: 开发环境通过 `/geoserver` 代理避免跨域

### 性能约束
- **大文件加载**: 某些 GeoJSON 文件超过 100KB
- **地图渲染**: 复杂图层可能影响性能
- **组件复杂度**: Map.vue 过大（2239行）影响维护性

### 部署约束
- **服务器**: 通过 SSH 自动部署
- **公网访问**: http://www.greenviz.top/
- **静态托管**: 纯前端应用，无后端 API

## External Dependencies

### 地图服务
- **天地图**: `t{0-7}.tianditu.gov.cn` (需 API Key)
- **高德地图**: `webrd0{1-4}.is.autonavi.com`
- **百度地图**: `online{0-3}.map.bdimg.com`
- **Bing 地图**: BingMaps API (需 API Key)
- **ArcGIS**: `server.arcgisonline.com`
- **OSM**: OpenStreetMap 公共服务

### 数据服务
- **本地 GeoServer**: WMS/WMTS/WFS 服务提供商
- **静态数据**: 存储在 `public/` 目录下

### CDN 依赖
- Element Plus 样式
- OpenLayers 样式

## 已知问题

### 代码重复
- `createLayer.js` 和 `newLayer.js` 存在功能重复
- 两个文件都实现了图层创建，但接口不同

### 未使用的依赖
- Vuex store 配置存在但完全为空
- 部分工具类未充分利用

### 代码组织
- Map.vue 文件过大（2239行），包含：
  - 地图初始化和控制
  - 数据加载和切换
  - 图表展示
  - 工具栏功能（测量、绘制）
  - 底图切换
  - 建议展示
  - 弹出框交互
