import { createRouter, createWebHistory } from "vue-router";

import Map from "../views/Map.vue";
import testWMTS from "../views/testWMTS.vue";
import testWFS from "../views/testWFS.vue";
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


