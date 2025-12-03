import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export const useDataStore = defineStore('data', () => {
  // State
  const selectedDataType = ref([])
  const selectedYear = ref('')
  const selectedPolicy = ref('noFactor')

  // Options
  const typeOptions = ref([
    {
      value: 'landuse',
      label: '土地利用',
      children: [
        { value: 'green', label: '绿地' },
        { value: 'residential', label: '居住用地' },
        { value: 'commercial', label: '商业用地' },
      ],
    },
    {
      value: 'green',
      label: '绿地',
      children: [
        { value: 'park', label: '公园绿地' },
        { value: 'protected', label: '防护绿地' },
        { value: 'production', label: '生产绿地' },
      ],
    },
    {
      value: 'greenAccessibility',
      label: '绿地可达性',
      children: [
        { value: 'walk', label: '步行可达性' },
        { value: 'near', label: '近邻可达性' },
        { value: 'car', label: '驾车可达性' },
        { value: 'sum', label: '总体可达性' },
      ],
    },
    {
      value: 'greenEquity',
      label: '绿地公平性',
      children: [
        { value: 'population', label: '人口公平性' },
        { value: 'area', label: '面积公平性' },
      ],
    },
  ])

  const policyOptions = ref([
    { value: 'noFactor', label: '无政策' },
    { value: 'withFactor', label: '有政策' },
  ])

  const yearOptions = ref(['2014', '2030', '2040', '2050'])

  // Computed
  const isPredict = computed(() => {
    return selectedDataType.value[0] === 'greenAccessibility' || selectedDataType.value[0] === 'greenEquity'
  })

  const isPolicyDisabled = computed(() => {
    // 只有可达性和公平性支持政策对比
    return !['greenAccessibility', 'greenEquity'].includes(selectedDataType.value[0])
  })

  // Methods
  function isYearDisabled(year) {
    // 土地利用和绿地数据只有2014年
    if (selectedDataType.value[0] === 'landuse' || selectedDataType.value[0] === 'green') {
      return year !== '2014'
    }
    return false
  }

  function resetSelectedYear() {
    if (selectedDataType.value[0] === 'landuse' || selectedDataType.value[0] === 'green') {
      selectedYear.value = '2014'
    } else if (
      selectedDataType.value[0] === 'greenAccessibility' ||
      selectedDataType.value[0] === 'greenEquity'
    ) {
      selectedYear.value = '2030'
    }
  }

  function resetPolicy() {
    selectedPolicy.value = 'noFactor'
  }

  function setDataType(type) {
    selectedDataType.value = type
  }

  function setYear(year) {
    selectedYear.value = year
  }

  function setPolicy(policy) {
    selectedPolicy.value = policy
  }

  // Watchers
  watch(selectedDataType, (newType) => {
    if (newType.length > 0) {
      // 根据数据类型自动调整
      resetSelectedYear()

      if (isPolicyDisabled.value) {
        resetPolicy()
      }

      console.log(`数据类型变更: ${newType.join(' > ')}`)
    }
  })

  return {
    // State
    selectedDataType,
    selectedYear,
    selectedPolicy,

    // Options
    typeOptions,
    policyOptions,
    yearOptions,

    // Computed
    isPredict,
    isPolicyDisabled,

    // Methods
    isYearDisabled,
    resetSelectedYear,
    resetPolicy,
    setDataType,
    setYear,
    setPolicy,
  }
})
