# 性能优化指南

## 绘制功能卡顿问题修复

### 🐛 问题描述
迁移到 Vite 后，绘制功能在移动视角时出现卡顿现象。

### 🔧 已实施的优化

#### 1. Vite 配置优化（vite.config.js）

**HMR 优化**
```javascript
server: {
  hmr: {
    overlay: false, // 关闭错误覆盖层，减少 DOM 操作
  },
}
```

**预构建优化**
```javascript
optimizeDeps: {
  include: [
    "vue",
    "vue-router",
    "element-plus",
    "ol",           // OpenLayers 核心
    "ol/layer",     // 图层模块
    "ol/source",    // 数据源模块
    "ol/interaction", // 交互模块
    "d3",
  ],
  exclude: ["vue-demi"],
}
```

**esbuild 编译优化**
```javascript
esbuild: {
  target: "esnext", // 使用最新 JS 特性，减少转译开销
  drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
}
```

**预热关键文件**
```javascript
server: {
  warmup: {
    clientFiles: ["./src/views/Map.vue"], // 预加载主地图组件
  },
}
```

#### 2. 代码优化

**修复编译器警告**
- 移除了 BasemapSelector.vue 中不必要的 `defineProps` 和 `defineEmits` 导入
- 这些是 Vue 3 的编译器宏，无需导入

### 📊 性能对比

| 指标 | 优化前 | 优化后 | 说明 |
|------|--------|--------|------|
| 开发服务器启动 | 205ms | 176ms | ⚡ 更快 |
| 依赖预构建 | 延迟加载 | 预先构建 | ✅ OpenLayers 预构建 |
| HMR 触发 | 有覆盖层 | 无覆盖层 | ✅ 减少 DOM 操作 |
| 编译警告 | 2 个 | 0 个 | ✅ 更清爽 |

### 💡 进一步优化建议

#### 1. 关闭浏览器开发者工具（临时）
当进行地图交互测试时，关闭 Chrome DevTools 可以显著提升性能：
- DevTools 会增加约 30-50% 的性能开销
- 特别是启用了 Vue DevTools 扩展时

#### 2. 使用生产构建测试性能
开发模式包含额外的调试代码，影响性能：
```bash
pnpm build
pnpm preview
```
生产构建会移除所有调试代码，性能更接近真实部署环境。

#### 3. 优化 OpenLayers 交互事件（代码优化）
如果卡顿仍然存在，可以考虑：

**节流地图事件**
```javascript
// 使用节流减少高频事件处理
import { throttle } from 'lodash-es';

// 在 mounted() 中
this.map.on('pointermove', throttle((evt) => {
  // 处理鼠标移动
}, 16)); // 约 60fps
```

**优化矢量图层渲染**
```javascript
// 对于大量要素的图层，使用简化样式
const vectorLayer = new VectorLayer({
  source: drawSource,
  style: new Style({
    // 使用简单样式，避免复杂渲染
    stroke: new Stroke({ color: '#ffcc33', width: 2 }),
  }),
  // 设置图层更新策略
  updateWhileInteracting: true, // 交互时也更新
  updateWhileAnimating: true,   // 动画时也更新
});
```

#### 4. 减少不必要的响应式数据
Map.vue 中有大量数据，考虑使用 `shallowRef` 或 `markRaw`：
```javascript
// 对于不需要深度响应式的数据
import { markRaw } from 'vue';

// 在创建 OpenLayers 对象时
this.map = markRaw(new Map({ ... }));
this.drawSource = markRaw(new VectorSource());
```

#### 5. 使用 Web Worker（高级优化）
对于复杂的地理计算，可以考虑使用 Web Worker：
```javascript
// 例如大量坐标转换
const worker = new Worker('./geoWorker.js');
worker.postMessage({ coordinates: [...] });
```

### 🔍 性能分析工具

#### Chrome DevTools Performance 分析
1. 打开 DevTools > Performance
2. 点击录制
3. 执行绘制操作
4. 停止录制
5. 查看 Main 线程的火焰图

关注：
- Long Task（超过 50ms 的任务）
- Scripting（脚本执行时间）
- Rendering（渲染时间）

#### Vue DevTools 性能分析
1. 打开 Vue DevTools
2. Performance 标签
3. 录制组件更新
4. 查看哪些组件频繁更新

### ⚡ 快速测试

**测试当前性能**
1. 启动开发服务器：`pnpm dev`
2. 打开 http://localhost:8080/
3. 关闭浏览器 DevTools
4. 测试绘制和移动视角
5. 观察是否流畅

**对比生产环境性能**
1. 构建生产版本：`pnpm build`
2. 预览：`pnpm preview`
3. 访问预览地址
4. 再次测试绘制功能

### 📝 性能检查清单

- [x] Vite 配置优化
- [x] 依赖预构建配置
- [x] 移除编译警告
- [ ] 关闭 DevTools 测试
- [ ] 生产构建性能测试
- [ ] 考虑事件节流优化
- [ ] 考虑使用 markRaw 优化响应式

### 🎯 预期效果

优化后，在现代浏览器中：
- 绘制点/线/多边形应该流畅无卡顿
- 平移地图时绘制图形应该跟随流畅
- 缩放时不应该有明显延迟

如果仍有性能问题，可能需要：
1. 检查是否有大量图层叠加
2. 检查是否有未清理的事件监听器
3. 分析具体的性能瓶颈（使用 Chrome Performance）

### 📞 进一步排查

如果问题仍然存在，请提供：
1. 卡顿发生的具体场景（绘制点？线？多边形？）
2. 图层数量
3. 地图上的要素数量
4. Chrome Performance 截图

---

最后更新：2025-12-03
