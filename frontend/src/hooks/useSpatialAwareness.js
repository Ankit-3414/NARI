import { useEffect, useRef } from 'react';
import { useSpatialStore } from '../store/spatialStore';
import { useLocations } from './useLocations';
import { db } from '../db/db';

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
  const R = 6371e3; // Radius of Earth in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export const useSpatialAwareness = () => {
  const { data: locations = [] } = useLocations();
  const store = useSpatialStore();
  const timerId = useRef(null);
  const lastCoordsRef = useRef(null);
  const stationaryCountRef = useRef(0);

  // Maintain a reference to locations to avoid restarting the polling loop on data change
  const locationsRef = useRef(locations);
  useEffect(() => {
    locationsRef.current = locations;
  }, [locations]);

  useEffect(() => {
    if (!navigator.geolocation) {
      store.setGpsError('GEOLOCATION_NOT_SUPPORTED');
      return;
    }

    store.setTracking(true);

    const performPoll = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const currentCoords = [latitude, longitude];
          store.setCoords(currentCoords);
          store.setGpsError(null);

          // 1. Calculate distance moved since last poll
          let distanceMoved = 0;
          if (lastCoordsRef.current) {
            distanceMoved = getDistance(
              lastCoordsRef.current[0],
              lastCoordsRef.current[1],
              latitude,
              longitude
            );
          }
          lastCoordsRef.current = currentCoords;

          const currentLocations = locationsRef.current;

          // 2. Find nearby nodes and active geofences
          const nearby = currentLocations.filter(loc => {
            const dist = getDistance(latitude, longitude, loc.latitude, loc.longitude);
            return dist <= 500;
          });
          store.setNearbyNodes(nearby);

          const inside = currentLocations.find(loc => {
            const dist = getDistance(latitude, longitude, loc.latitude, loc.longitude);
            return dist <= (loc.radius_meters || 100);
          });

          // Determine next polling interval
          let nextInterval = 5000; // 5s default (moving)

          if (inside) {
            // Inside a geofence: poll every 10s (stationary override will check if static)
            nextInterval = 10000;
          }

          // Check if stationary (moved less than 10 meters)
          if (distanceMoved < 10) {
            stationaryCountRef.current += 1;
            if (stationaryCountRef.current >= 3) {
              // Stationary for a while: drop frequency to once every 30 seconds to save battery
              nextInterval = 30000;
            }
          } else {
            stationaryCountRef.current = 0;
            nextInterval = 5000; // Scale up to 5s if active movement is detected
          }

          // Trigger geofence notifications on entry
          const currentActiveNode = useSpatialStore.getState().activeNode;
          if (inside?.id !== currentActiveNode?.id) {
            store.setActiveNode(inside || null);
            if (inside) {
              console.log(`[SPATIAL_AWARENESS] Entered Geofence: ${inside.label} (Adaptive Interval: ${nextInterval}ms)`);
              db.tasks.toArray().then(tasks => {
                const pending = tasks.filter(t => t.location_id === inside.id && t.status !== 'done');
                if (pending.length > 0) {
                  triggerProactiveNotification(inside.label, pending);
                }
              }).catch(err => console.warn('[SPATIAL_AWARENESS] Tasks lookup failed', err));
            }
          }

          // Schedule next poll
          timerId.current = setTimeout(performPoll, nextInterval);
        },
        (error) => {
          console.warn('[SPATIAL_ERROR]', error.message);
          store.setGpsError(error.code === 1 ? 'PERMISSION_DENIED' : 'SIGNAL_LOST');
          // If error occurs, retry in 15 seconds
          timerId.current = setTimeout(performPoll, 15000);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        }
      );
    };

    // Start polling loop
    performPoll();

    return () => {
      if (timerId.current) clearTimeout(timerId.current);
    };
  }, []);

  return {
    currentCoords: store.currentCoords,
    activeNode: store.activeNode,
    nearbyNodes: store.nearbyNodes,
    isTracking: store.isTracking,
    gpsError: store.gpsError
  };
};
