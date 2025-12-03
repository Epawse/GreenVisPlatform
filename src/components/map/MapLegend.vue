<template>
  <div v-show="legendSrc" class="legend">
    <img :src="legendSrc" alt="图例" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDataStore } from '@/stores'

const dataStore = useDataStore()

const legendSrc = computed(() => {
  const [firstType, secondType] = dataStore.selectedDataType

  if (!firstType || !secondType) {
    return null
  }

  // 根据数据类型返回对应的图例图片
  if (firstType === 'landuse') {
    return '/images/legend_landuse.png'
  } else if (firstType === 'green') {
    return '/images/legend_green.png'
  } else if (firstType === 'greenAccessibility') {
    const legendMap = {
      walk: '/images/legend_walk.png',
      near: '/images/legend_near.png',
      car: '/images/legend_car.png',
      sum: '/images/legend_sum.png',
    }
    return legendMap[secondType] || null
  } else if (firstType === 'greenEquity') {
    return '/images/legend_equity.png'
  }

  return null
})
</script>

<style scoped>
.legend {
  position: absolute;
  right: 45px;
  bottom: 50px;
  z-index: 100;
  background: white;
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.legend img {
  display: block;
  max-width: 200px;
  height: auto;
}
</style>
