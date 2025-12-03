import { createApp } from "vue";

// 引入element资源
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import zhCn from "element-plus/dist/locale/zh-cn";

// 引入ol样式，类文件按需引入
import "ol/ol.css";

import "./styles/index.css"; // Global Styles
import App from "./App.vue";
import router from "./router";
import store from "./store";
import { pinia } from "./stores"; // Pinia store

const app = createApp(App);
window.app1 = app;

app.use(pinia); // 注册 Pinia（在 router 之前）
app.use(router);
app.use(store); // 保留旧的 Vuex store（暂时兼容）
app.use(ElementPlus, { locale: zhCn });

app.mount("#app");
