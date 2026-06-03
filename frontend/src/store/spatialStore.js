import { create } from 'zustand';

export const useSpatialStore = create((set) => ({
  currentCoords: null, // [lat, lng]
  activeNode: null,    // The LocationNode the user is currently inside
  nearbyNodes: [],     // List of nodes within 500m
  isTracking: false,
  gpsError: null,

  setCoords: (coords) => set({ currentCoords: coords }),
  setActiveNode: (node) => set({ activeNode: node }),
  setNearbyNodes: (nodes) => set({ nearbyNodes: nodes }),
  setTracking: (status) => set({ isTracking: status }),
  setGpsError: (error) => set({ gpsError: error }),
}));
