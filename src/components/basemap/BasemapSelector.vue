<template>
  <div v-if="visible" class="basemap-container">
    <div
      v-for="basemap in basemaps"
      :key="basemap.name"
      class="basemap-item"
      @click="handleBasemapClick(basemap.name)"
    >
      <img :src="basemap.thumbnail" :alt="basemap.name" />
      <span>{{ basemap.name }}</span>
    </div>
  </div>
</template>

<script setup>
// defineProps 和 defineEmits 是编译器宏，不需要导入

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(["update:visible", "basemap-change"]);

// 底图配置
const basemaps = [
  {
    name: "OSM",
    thumbnail: new URL("../../assets/images/osm-thumbnail.png", import.meta.url).href,
  },
  {
    name: "ArcGIS",
    thumbnail: new URL("../../assets/images/satellite-thumbnail.png", import.meta.url).href,
  },
  {
    name: "Tian",
    thumbnail: new URL("../../assets/images/tian-thumbnail.png", import.meta.url).href,
  },
  {
    name: "Gaode",
    thumbnail: new URL("../../assets/images/gaode-thumbnail.png", import.meta.url).href,
  },
  {
    name: "Baidu",
    thumbnail: new URL("../../assets/images/baidu-thumbnail.png", import.meta.url).href,
  },
  {
    name: "Bing",
    thumbnail: new URL("../../assets/images/bing-thumbnail.png", import.meta.url).href,
  },
  {
    name: "Google",
    thumbnail: new URL("../../assets/images/google-thumbnail.png", import.meta.url).href,
  },
  {
    name: "WMTS",
    thumbnail: new URL("../../assets/images/wmts-thumbnail.png", import.meta.url).href,
  },
  {
    name: "None",
    thumbnail: new URL("../../assets/images/none-thumbnail.png", import.meta.url).href,
  },
];

// 处理底图点击
const handleBasemapClick = (name) => {
  emit("basemap-change", name);
  emit("update:visible", false);
};
</script>

<style scoped>
.basemap-container {
  position: absolute;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  padding: 16px;
  display: flex;
  gap: 12px;
  
  /* Glassmorphism */
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  border-radius: var(--panel-radius);
  
  /* Animation */
  transition: all var(--transition-speed) ease;
}

.basemap-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s;
  padding: 4px;
  border-radius: 8px;
}

.basemap-item:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.4);
}

.basemap-item img {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid transparent;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  transition: border-color 0.2s;
}

.basemap-item:hover img {
  border-color: var(--primary-color);
}

.basemap-item span {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-main);
  font-weight: 500;
}
</style>
