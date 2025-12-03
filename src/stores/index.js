import { createPinia } from 'pinia'

export const pinia = createPinia()

export { useMapStore } from './map'
export { useLayersStore } from './layers'
export { useFeaturesStore } from './features'
export { useUIStore } from './ui'
export { useDataStore } from './data'
