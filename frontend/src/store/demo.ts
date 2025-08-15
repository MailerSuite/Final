import { create } from 'zustand'

interface DemoState {
  isDemoMode: boolean
  demoFeatures: string[]
  setDemoMode: (enabled: boolean) => void
  toggleDemoMode: () => void
  addDemoFeature: (feature: string) => void
  removeDemoFeature: (feature: string) => void
}

export const useDemoStore = create<DemoState>((set) => ({
  isDemoMode: false,
  demoFeatures: [],
  setDemoMode: (enabled) => set({ isDemoMode: enabled }),
  toggleDemoMode: () => set((state) => ({ isDemoMode: !state.isDemoMode })),
  addDemoFeature: (feature) => set((state) => ({
    demoFeatures: [...state.demoFeatures, feature]
  })),
  removeDemoFeature: (feature) => set((state) => ({
    demoFeatures: state.demoFeatures.filter(f => f !== feature)
  }))
})) 