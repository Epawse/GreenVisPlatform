import { createRouter, createWebHistory } from "vue-router";

// 使用懒加载优化首屏加载
const Map = () => import("../views/Map.vue");
const testWMTS = () => import("../views/testWMTS.vue");
const testWFS = () => import("../views/testWFS.vue");

const routes = [
  {
    path: "/",
    redirect: "/map",
  },
  {
    path: "/map",
    name: "map",
    component: Map,
  },
  {
    path: "/testWMTS",
    name: "testWMTS",
    component: testWMTS,
  },
  {
    path: "/testWFS",
    name: "testWFS",
    component: testWFS,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
