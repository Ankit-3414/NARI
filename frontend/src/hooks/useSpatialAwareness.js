import { useEffect, useRef } from 'react';
import { useSpatialStore } from '../store/spatialStore';
import { useLocations } from './useLocations';
import { db } from '../db/db';
import client from '../api/client';

// Trigger browser geofence entry notification
const triggerProactiveNotification = (label, tasks) => {
  if (!('Notification' in window)) return;
  
  const showNotification = () => {
    const taskCount = tasks.length;
    const taskList = tasks.map(t => t.title).join(', ');
    const body = taskCount === 1 
      ? `You have 1 pending task here: ${tasks[0].title}`
      : `You have ${taskCount} pending tasks here: ${taskList}`;
      
    new Notification(`Zone Alert: Entered ${label.toUpperCase()}`, {
      body,
      tag: `geofence-${label}-${Date.now()}`,
      requireInteraction: false
    });
  };

  if (Notification.permission === 'granted') {
    showNotification();
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        showNotification();
      }
    });
  }
};

// Haversine Formula for high-precision distance calculation (in meters)
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const useSpatialAwareness = () => {
  const { data: locations = [] } = useLocations();
  const store = useSpatialStore();
  const timerId = useRef(null);
  const lastCoordsRef = useRef(null);

  // Reference for logic consistency
  const locationsRef = useRef(locations);
  useEffect(() => { locationsRef.current = locations; }, [locations]);

  /**
   * NEURAL GEOLOCATION VOTER
   * Reconciles multiple data sources to find the most accurate "truth".
   */
  const resolveLocationConsensus = async (browserPos = null) => {
    const votes = [];
    
    // Source 1: Browser Geolocation (Highest weight if accuracy is high)
    if (browserPos) {
      votes.push({
        lat: browserPos.coords.latitude,
        lon: browserPos.coords.longitude,
        accuracy: browserPos.coords.accuracy || 100,
        weight: browserPos.coords.accuracy < 50 ? 1.0 : 0.7,
        source: 'browser'
      });
    }

    // Source 2: NARI Backend IP Proxy (Stability fallback)
    try {
      const proxyRes = await db.settings.get('weather_lat') ? null : await client.get('/utils/geolocate');
      if (proxyRes?.ok && proxyRes.data) {
        votes.push({
          lat: proxyRes.data.latitude,
          lon: proxyRes.data.longitude,
          accuracy: 5000, // IP is city-level
          weight: 0.3,
          source: 'ip_proxy'
        });
      }
    } catch (e) { /* silent fail */ }

    if (votes.length === 0) return null;

    // Pick the highest weight candidate
    const bestSource = votes.sort((a, b) => b.weight - a.weight)[0];
    let finalLat = bestSource.lat;
    let finalLon = bestSource.lon;

    // Source 3: "Absolute Truth" - Snapping to User Nodes
    // If the winning vote is within a saved node's radius, WE SNAPPING.
    const currentLocations = locationsRef.current;
    const snapNode = currentLocations.find(loc => {
      const dist = getDistance(finalLat, finalLon, loc.latitude, loc.longitude);
      return dist <= (loc.radius_meters || 100) * 1.5; // 50% buffer for Wi-Fi jitter
    });

    if (snapNode) {
      console.log(`[NEURAL_CONSENSUS] Snapping to truth: ${snapNode.label}`);
      return {
        coords: [snapNode.latitude, snapNode.longitude],
        node: snapNode,
        accuracy: 0, // Absolute precision
        source: 'node_snap'
      };
    }

    return {
      coords: [finalLat, finalLon],
      node: null,
      accuracy: bestSource.accuracy,
      source: bestSource.source
    };
  };

  useEffect(() => {
    store.setTracking(true);

    const performPoll = async () => {
      const getGPS = () => new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), {
          enableHighAccuracy: true, timeout: 5000, maximumAge: 0
        });
      });

      const browserPos = await getGPS();
      const consensus = await resolveLocationConsensus(browserPos);

      if (consensus) {
        store.setCoords(consensus.coords);
        store.setActiveNode(consensus.node);
        store.setGpsError(null);

        // Adaptive polling: Check if we just entered a node
        if (consensus.source === 'node_snap') {
          const currentActiveNode = useSpatialStore.getState().activeNode;
          if (consensus.node.id !== currentActiveNode?.id) {
             // Logic to trigger geofence notifications remains here
             db.tasks.toArray().then(tasks => {
                const pending = tasks.filter(t => t.location_id === consensus.node.id && t.status !== 'done');
                if (pending.length > 0) triggerProactiveNotification(consensus.node.label, pending);
             });
          }
        }
      }

      // Adaptive Polling Interval
      const interval = consensus?.source === 'node_snap' ? 30000 : 10000;
      timerId.current = setTimeout(performPoll, interval);
    };

    performPoll();
    return () => { if (timerId.current) clearTimeout(timerId.current); };
  }, []);

  return {
    currentCoords: store.currentCoords,
    activeNode: store.activeNode,
    nearbyNodes: store.nearbyNodes,
    isTracking: store.isTracking,
    gpsError: store.gpsError
  };
};
