import { create } from 'zustand'

export type ViewMode = 'normal' | 'fabrication' | 'mounting' | 'assignment'

export interface SpoolData {
    id: string
    name: string
    status: 'FABRICADO' | 'PENDIENTE' | 'MONTADO'
    color?: string
}

interface ViewerState {
    // Data
    spools: Map<string, SpoolData> // SpoolID -> Data
    meshSpoolMap: Map<string, string> // MeshName -> SpoolID

    // UI State
    viewMode: ViewMode
    selection: Set<string> // Set of Mesh Names
    hoveredMesh: string | null

    // Assignment Mode
    activeSpoolId: string | null // Spool currently being assigned to

    // Actions
    setSpools: (spools: SpoolData[]) => void
    loadMapping: (mapping: Record<string, string>) => void
    setMapping: (meshName: string, spoolId: string | null) => void
    setViewMode: (mode: ViewMode) => void
    addToSelection: (meshName: string) => void
    removeFromSelection: (meshName: string) => void
    clearSelection: () => void
    toggleSelection: (meshName: string) => void
    // Splitting Mode
    isSplitting: boolean
    setSplitting: (active: boolean) => void

    setActiveSpool: (id: string | null) => void
    setHoveredMesh: (name: string | null) => void
}

export const useViewerStore = create<ViewerState>((set, get) => ({
    spools: new Map(),
    meshSpoolMap: new Map(),

    viewMode: 'normal',
    selection: new Set(),
    hoveredMesh: null,

    activeSpoolId: null,

    // Splitting Mode
    isSplitting: false,
    setSplitting: (active) => set({ isSplitting: active }),

    setSpools: (spoolsList) => {
        const map = new Map()
        spoolsList.forEach(s => map.set(s.id, s))
        set({ spools: map })
    },

    loadMapping: (mapping) => {
        const map = new Map(Object.entries(mapping))
        set({ meshSpoolMap: map })
    },

    setMapping: (meshName, spoolId) => {
        const newMap = new Map(get().meshSpoolMap)
        if (spoolId) {
            newMap.set(meshName, spoolId)
        } else {
            newMap.delete(meshName)
        }
        set({ meshSpoolMap: newMap })
    },

    setViewMode: (mode) => set({ viewMode: mode }),

    addToSelection: (meshName) => {
        const newSet = new Set(get().selection)
        newSet.add(meshName)
        set({ selection: newSet })
    },

    removeFromSelection: (meshName) => {
        const newSet = new Set(get().selection)
        newSet.delete(meshName)
        set({ selection: newSet })
    },

    clearSelection: () => set({ selection: new Set() }),

    toggleSelection: (meshName) => {
        const newSet = new Set(get().selection)
        if (newSet.has(meshName)) {
            newSet.delete(meshName)
        } else {
            newSet.add(meshName)
        }
        set({ selection: newSet })
    },

    setActiveSpool: (id) => set({ activeSpoolId: id }),
    setHoveredMesh: (name) => set({ hoveredMesh: name })
}))

