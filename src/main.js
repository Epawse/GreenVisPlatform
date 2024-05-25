import { createApp } from "vue";

// 引入element资源
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import zhCn from "element-plus/dist/locale/zh-cn";

// 引入ol样式，类文件按需引入
import "ol/ol.css";

import * as echarts from "echarts";

import App from "./App.vue";
import router from "./router";
import store from "./store";

const app = createApp(App);
window.app1 = app;

app.use(router);
app.use(store);
app.use(ElementPlus, { locale: zhCn });
app.config.globalProperties.$echarts = echarts;

app.mount("#app");
