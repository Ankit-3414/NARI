import React, { useState, useEffect } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Circle, 
  useMapEvents, 
  LayersControl, 
  LayerGroup,
  ZoomControl
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  useLocations, 
  useCreateLocation, 
  useUpdateLocation, 
  useDeleteLocation 
} from '../hooks/useLocations';
import { useSpatialAwareness } from '../hooks/useSpatialAwareness';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Navigation, Plus, Trash2, Edit3, Compass, 
  MapPin, Check, X, ShieldAlert, Award, Grid, 
  Activity, Layers, Heart, Coffee, BookOpen, Briefcase,
  ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';

// Fix Leaflet Vite SVG marker custom icons
const createCustomIcon = (color, isPulse = false) => {
  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center w-8 h-8">
        ${isPulse ? `<div class="absolute w-6 h-6 rounded-full bg-[${color}]/30 animate-ping opacity-75"></div>` : ''}
        <div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 3px solid #050505; box-shadow: 0 0 10px ${color};" class="relative z-10"></div>
      </div>
    `,
    className: 'custom-leaflet-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -10]
  });
};

// Category details
const CATEGORIES = {
  general: { label: 'General', color: '#00F2FF', icon: MapPin },
  home: { label: 'Home', color: '#FF0055', icon: Heart },
  shopping: { label: 'Shopping', color: '#00FF94', icon: Coffee },
  fitness: { label: 'Fitness', color: '#F59E0B', icon: Award },
  work: { label: 'Work', color: '#8B5CF6', icon: Briefcase },
  study: { label: 'Study', color: '#EC4899', icon: BookOpen }
};

const CATEGORY_DEFAULT_RADII = {
  general: 100,
  home: 50,
  shopping: 300,
  fitness: 100,
  work: 100,
  study: 50
};

// Map click event handler component
function MapClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng);
    },
  });
  return null;
}

// Map center/zoom controller component
function MapController({ center, zoom }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom(), { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

// Distance calculation utility for the UI
const getDistanceDisplay = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1) return '---';
  const R = 6371e3;
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c;
  return d > 1000 ? `${(d/1000).toFixed(1)}KM` : `${Math.round(d)}M`;
};

const SpatialPage = () => {
  const { data: locations, isLoading, error } = useLocations();
  const { currentCoords, activeNode, gpsError, isTracking } = useSpatialAwareness();
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const deleteLocation = useDeleteLocation();

  // Memoized custom marker icons
  const savedLocationIcon = React.useMemo(() => createCustomIcon('#00F2FF'), []);
  const currentGpsIcon = React.useMemo(() => createCustomIcon('#F59E0B', true), []);
  const tempPinIcon = React.useMemo(() => createCustomIcon('#00FF94'), []);

  // Map state
  const [mapCenter, setMapCenter] = useState([22.8046, 86.2029]);
  const [mapZoom, setMapZoom] = useState(13);
  const [currentGps, setCurrentGps] = useState(null);
  const [tempPin, setTempPin] = useState(null);

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [formLabel, setFormLabel] = useState('');
  const [formName, setFormName] = useState('');
  const [formLat, setFormLat] = useState('');
  const [formLng, setFormLng] = useState('');
  const [formCategory, setFormCategory] = useState('general');
  const [formRadius, setFormRadius] = useState(100);

  // UI state
  const [activeTab, setActiveTab] = useState('list');
  const [gpsCaptureError, setGpsCaptureError] = useState('');
  const [loadingGps, setLoadingGps] = useState(false);
  const [hasAutoCentered, setHasAutoCentered] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

  // Geocoding Search State
  const [addressQuery, setAddressQuery] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const query = addressQuery.trim();
    if (query.length < 2) {
      setAddressSuggestions([]);
      return;
    }
    const controller = new AbortController();
    setLoadingSuggestions(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          setAddressSuggestions(data.results || []);
        }
      } catch (err) {
        if (err.name !== 'AbortError') console.warn(err);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 400);
    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort();
    };
  }, [addressQuery]);

  useEffect(() => {
    const handleOutsideClick = () => setShowSuggestions(false);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Auto-center on current GPS location on mount, falling back to first saved location
  useEffect(() => {
    if (currentCoords && !hasAutoCentered) {
      setMapCenter(currentCoords);
      setCurrentGps(currentCoords);
      setMapZoom(16);
      setHasAutoCentered(true);
    } else if (!hasAutoCentered && locations && locations.length > 0) {
      setMapCenter([locations[0].latitude, locations[0].longitude]);
    }
  }, [currentCoords, locations, hasAutoCentered]);

  const handleCaptureGps = () => {
    const canUseGPS = window.isSecureContext || window.location.hostname === 'localhost';
    
    if (!canUseGPS) {
      setGpsCaptureError('GPS restricted to Secure Context (HTTPS). Trying NARI-Proxied IP fallback...');
      setLoadingGps(true);
      client.get('/utils/geolocate').then(res => {
        if (res && res.ok && res.data) {
          const { latitude, longitude } = res.data;
          setCurrentGps([latitude, longitude]);
          setMapCenter([latitude, longitude]);
          setMapZoom(14);
          setFormLat(latitude.toFixed(6));
          setFormLng(longitude.toFixed(6));
          setHasAutoCentered(true);
        } else {
          setGpsCaptureError('Geolocation failed. Please drop a pin or enter coordinates.');
        }
      }).catch(err => {
        setGpsCaptureError('Geolocation error. Use manual coordinates.');
      }).finally(() => setLoadingGps(false));
      return;
    }

    if (!navigator.geolocation) {
      setGpsCaptureError('Geolocation is not supported.');
      return;
    }
    setLoadingGps(true);
    setGpsCaptureError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentGps([latitude, longitude]);
        setMapCenter([latitude, longitude]);
        setMapZoom(16);
        setFormLat(latitude.toFixed(6));
        setFormLng(longitude.toFixed(6));
        setLoadingGps(false);
        setHasAutoCentered(true);
      },
      (err) => {
        setGpsCaptureError(`GPS Capture failed: ${err.message}. Trying IP fallback...`);
        // Fallback to proxy
        client.get('/utils/geolocate').then(res => {
          if (res && res.ok && res.data) {
             const { latitude, longitude } = res.data;
             setCurrentGps([latitude, longitude]);
             setMapCenter([latitude, longitude]);
          }
        }).finally(() => setLoadingGps(false));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Auto-detect high-accuracy location on page load
  useEffect(() => {
    handleCaptureGps();
  }, []);

  const handleMapClick = (latlng) => {
    setTempPin([latlng.lat, latlng.lng]);
    setFormLat(latlng.lat.toFixed(6));
    setFormLng(latlng.lng.toFixed(6));
    if (activeTab !== 'add') setActiveTab('add');
  };

  const handleResetForm = () => {
    setIsEditing(false);
    setSelectedLocation(null);
    setFormLabel('');
    setFormName('');
    setFormLat('');
    setFormLng('');
    setFormCategory('general');
    setFormRadius(100);
    setTempPin(null);
  };

  const handleZoomTo = (loc) => {
    setMapCenter([loc.latitude, loc.longitude]);
    setMapZoom(17);
  };

  const handleEditClick = (loc) => {
    setIsEditing(true);
    setSelectedLocation(loc);
    setFormLabel(loc.label);
    setFormName(loc.name || '');
    setFormLat(loc.latitude.toString());
    setFormLng(loc.longitude.toString());
    setFormCategory(loc.category || 'general');
    setFormRadius(loc.radius_meters);
    setTempPin(null);
    setActiveTab('add');
    handleZoomTo(loc);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formLabel || !formLat || !formLng) return;
    const payload = {
      label: formLabel,
      name: formName || null,
      latitude: parseFloat(formLat),
      longitude: parseFloat(formLng),
      category: formCategory,
      radius_meters: parseFloat(formRadius)
    };
    if (isEditing && selectedLocation) {
      updateLocation.mutate({ id: selectedLocation.id, ...payload }, {
        onSuccess: () => { handleResetForm(); setActiveTab('list'); }
      });
    } else {
      createLocation.mutate(payload, {
        onSuccess: () => { handleResetForm(); setActiveTab('list'); }
      });
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Archive this physical location node?')) {
      deleteLocation.mutate(id);
    }
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center text-primary font-mono animate-pulse">CALIBRATING_SPATIAL_MATRIX...</div>;

  return (
    <div className="w-full h-full relative z-0 bg-background overflow-hidden font-mono flex flex-col md:flex-row">
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none z-0" />

      {/* Sidebar Toggle Button for Mobile */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="md:hidden absolute top-24 left-4 z-[1000] p-3 bg-surface/90 border border-primary/30 rounded-full text-primary shadow-2xl backdrop-blur-md"
      >
        <Grid size={20} />
      </button>

      {/* Left Sidebar Panel */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            className="fixed md:relative inset-y-0 left-0 w-full sm:w-80 h-full border-r border-white/10 bg-surface/95 backdrop-blur-2xl z-[1001] md:z-20 flex flex-col gap-4 p-6 pb-8 overflow-hidden shadow-2xl md:shadow-none"
          >
            {/* Close button for mobile sidebar */}
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden absolute top-4 right-4 p-2 text-secondary hover:text-white"
            >
              <X size={20} />
            </button>
        <motion.div 
          initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
          className="glass-card p-4 rounded-2xl border-primary/20 bg-background/40 shadow-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
              <Navigation size={20} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tighter text-white">Spatial OS</h1>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-mono text-secondary uppercase tracking-[0.2em]">Presence:</span>
                <span className={clsx(
                  "text-[8px] font-mono font-black uppercase tracking-[0.1em]",
                  activeNode ? "text-primary animate-pulse" : "text-accent"
                )}>
                  {activeNode ? `ZONE_${activeNode.label}` : 'TRANSIT_MODE'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={handleCaptureGps} disabled={loadingGps} className="w-full mt-4 flex items-center justify-center gap-2 py-2 rounded-xl border border-accent/20 bg-accent/5 text-accent font-black uppercase text-[9px] hover:bg-accent/10 transition-all">
            <Compass size={12} className={clsx(loadingGps && "animate-spin")} />
            {loadingGps ? 'LOCATING...' : 'CAPTURE CURRENT GPS'}
          </button>
          {gpsCaptureError && (
            <p className="text-[9px] text-red-500 mt-2 uppercase text-center font-bold tracking-wider">{gpsCaptureError}</p>
          )}
        </motion.div>

        <motion.div 
          initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}
          className="glass-card flex-1 rounded-2xl border-white/5 bg-background/20 flex flex-col overflow-hidden shadow-2xl min-h-0"
        >
          {/* Custom Tabs with Sliding Capsule Animation */}
          <div className="flex bg-black/50 p-1.5 rounded-xl border-b border-white/5 relative gap-1.5 m-2">
            <button 
              type="button"
              onClick={() => setActiveTab('list')} 
              className={clsx(
                "flex-1 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative rounded-lg z-10",
                activeTab === 'list' ? "text-background font-bold" : "text-secondary hover:text-white"
              )}
            >
              <span className="relative z-20">Inventory</span>
              {activeTab === 'list' && (
                <motion.div 
                  layoutId="activeTabGlow" 
                  className="absolute inset-0 bg-primary rounded-lg z-10 shadow-[0_0_15px_rgba(0,242,255,0.4)]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('add')} 
              className={clsx(
                "flex-1 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative rounded-lg z-10",
                activeTab === 'add' ? "text-background font-bold" : "text-secondary hover:text-white"
              )}
            >
              <span className="relative z-20">{isEditing ? 'Config' : 'Link Node'}</span>
              {activeTab === 'add' && (
                <motion.div 
                  layoutId="activeTabGlow" 
                  className="absolute inset-0 bg-primary rounded-lg z-10 shadow-[0_0_15px_rgba(0,242,255,0.4)]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <AnimatePresence mode="wait">
              {activeTab === 'list' ? (
                <motion.div key="list" className="space-y-2">
                  {locations?.map((loc) => {
                    const cat = CATEGORIES[loc.category || 'general'] || CATEGORIES.general;
                    return (
                      <div key={loc.id} className="p-3 rounded-xl border border-white/5 bg-white/5 hover:border-primary/30 transition-all group relative overflow-hidden">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-lg border" style={{ borderColor: `${cat.color}30`, color: cat.color }}><cat.icon size={14} /></div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-white uppercase text-[11px] truncate">{loc.label}</h3>
                            <p className="text-[8px] font-mono text-secondary truncate uppercase">{loc.name || 'UNNAMED_LOCATION'}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] font-mono font-black text-primary/80 tracking-tighter">
                              {currentCoords ? getDistanceDisplay(currentCoords[0], currentCoords[1], loc.latitude, loc.longitude) : '---'}
                            </span>
                          </div>
                        </div>
                        <button onClick={() => handleZoomTo(loc)} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight size={16} /></button>
                      </div>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.form key="add" onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <input type="text" placeholder="Neural Search Location..." value={addressQuery} onChange={e => { setAddressQuery(e.target.value); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary font-mono placeholder:text-white/20" />
                    {showSuggestions && addressSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-white/10 rounded-xl max-h-40 overflow-y-auto z-[200] p-1 shadow-2xl font-mono">
                        {addressSuggestions.map(sug => (
                          <button key={sug.id} type="button" onClick={() => {
                            setFormLat(sug.latitude.toFixed(6)); setFormLng(sug.longitude.toFixed(6));
                            setFormName(`${sug.name}, ${sug.country}`); setFormLabel(sug.name);
                            setMapCenter([sug.latitude, sug.longitude]); setMapZoom(16);
                            setShowSuggestions(false);
                          }} className="w-full text-left px-3 py-2 text-[9px] text-secondary hover:text-primary hover:bg-white/5 rounded-lg truncate uppercase">{sug.name} | {sug.country}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input type="text" required placeholder="Node Alias (e.g. Home)" value={formLabel} onChange={e => setFormLabel(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" step="any" required placeholder="Lat" value={formLat} onChange={e => setFormLat(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-3 text-[10px] text-white focus:outline-none" />
                    <input type="number" step="any" required placeholder="Lng" value={formLng} onChange={e => setFormLng(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-3 text-[10px] text-white focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select 
                      value={formCategory} 
                      onChange={e => {
                        const newCat = e.target.value;
                        setFormCategory(newCat);
                        setFormRadius(CATEGORY_DEFAULT_RADII[newCat] || 100);
                      }} 
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-3 text-[10px] text-white focus:outline-none"
                    >
                      {Object.entries(CATEGORIES).map(([key, val]) => <option key={key} value={key} className="bg-surface">{val.label.toUpperCase()}</option>)}
                    </select>
                    <input type="number" required min="10" max="5000" placeholder="Radius (meters)" value={formRadius} onChange={e => setFormRadius(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-3 text-[10px] text-white focus:outline-none" />
                  </div>
                  <button type="submit" className="w-full py-3 bg-primary text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-xl hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all">{isEditing ? 'RECALIBRATE_NODE' : 'ESTABLISH_NODE'}</button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>

      {/* Right Map Viewport */}
      <div className="flex-1 h-full relative z-10 min-h-[400px]">
        <MapContainer 
          center={mapCenter} 
          zoom={mapZoom} 
          className="w-full h-full"
          style={{ background: '#050505' }}
          zoomControl={false}
        >
          <MapController center={mapCenter} zoom={mapZoom} />
          <MapClickHandler onClick={handleMapClick} />
          <ZoomControl position="bottomright" />

          <LayersControl position="topright" collapsed={true}>
            <LayersControl.BaseLayer checked name="STREET_VECTOR">
              <TileLayer attribution='&copy; OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="SATELLITE_IMG">
              <TileLayer attribution='Tiles &copy; Esri' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="HYBRID_TACTICAL">
              <LayerGroup>
                <TileLayer attribution='Tiles &copy; Esri' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" />
                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}" />
              </LayerGroup>
            </LayersControl.BaseLayer>
          </LayersControl>

          {currentGps && (
            <Marker position={currentGps} icon={currentGpsIcon}>
              <Popup className="custom-leaflet-popup"><span className="font-black text-accent">GPS_LOCK_ACTIVE</span></Popup>
            </Marker>
          )}
          {tempPin && (
            <Marker position={tempPin} icon={tempPinIcon}>
              <Popup className="custom-leaflet-popup">
                <div className="font-mono text-xs p-1 min-w-[120px]">
                  <div className="font-black text-primary uppercase border-b border-white/10 pb-1 mb-1 flex items-center gap-1">
                    <MapPin size={10} />
                    <span>PIN_DROPPED</span>
                  </div>
                  <div className="text-[8px] text-secondary uppercase leading-normal mb-2">
                    Lat: {tempPin[0].toFixed(6)}<br/>
                    Lng: {tempPin[1].toFixed(6)}
                  </div>
                  <button 
                    onClick={() => {
                      setFormLat(tempPin[0].toFixed(6));
                      setFormLng(tempPin[1].toFixed(6));
                      setActiveTab('add');
                    }}
                    className="w-full py-1 bg-primary/20 text-primary border border-primary/20 rounded uppercase font-bold text-[9px] hover:bg-primary/30 transition-colors"
                  >
                    LINK_NODE
                  </button>
                </div>
              </Popup>
            </Marker>
          )}

          {locations?.map((loc) => {
            const cat = CATEGORIES[loc.category || 'general'] || CATEGORIES.general;
            const CatIcon = cat.icon;
            return (
              <React.Fragment key={loc.id}>
                <Circle 
                  center={[loc.latitude, loc.longitude]}
                  radius={loc.radius_meters}
                  pathOptions={{ color: cat.color, fillColor: cat.color, fillOpacity: 0.1, weight: 1, dashArray: '5, 10' }}
                />
                <Marker position={[loc.latitude, loc.longitude]} icon={savedLocationIcon}>
                  <Popup className="custom-leaflet-popup">
                    <div className="font-mono text-xs p-1 min-w-[150px]">
                      <div className="flex items-center gap-2 mb-1.5 border-b border-white/10 pb-1">
                        <span style={{ color: cat.color }}><CatIcon size={12} /></span>
                        <span className="font-black text-white uppercase">{loc.label}</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => handleEditClick(loc)} className="flex-1 py-1 bg-primary/10 text-primary font-bold text-[9px] uppercase border border-primary/20 rounded">Edit</button>
                        <button onClick={() => handleDelete(loc.id)} className="flex-1 py-1 bg-danger/10 text-danger font-bold text-[9px] uppercase border border-danger/20 rounded">Drop</button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>

      {/* HUD Labels */}
      <div className="absolute bottom-10 right-6 z-[1000] pointer-events-none text-right">
        <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] drop-shadow-lg">Mapping_Active</p>
        <p className="text-[8px] font-mono text-secondary uppercase tracking-widest mt-1 opacity-60">Precision Geofence Enabled</p>
      </div>

      <style>{`
        .leaflet-container { cursor: crosshair !important; z-index: 1; }
        .custom-leaflet-icon { border: none !important; background: none !important; }
        .custom-leaflet-popup .leaflet-popup-content-wrapper { background: #0a0a0a !important; border: 1px solid rgba(0, 242, 255, 0.2) !important; border-radius: 12px !important; color: white !important; }
        .custom-leaflet-popup .leaflet-popup-tip { background: #00F2FF !important; }
        .leaflet-bar { border: none !important; border-radius: 12px !important; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.5) !important; }
        .leaflet-bar a { background-color: #0a0a0a !important; color: #00F2FF !important; border-bottom: 1px solid rgba(255,255,255,0.05) !important; }
        .leaflet-bar a:hover { background-color: #1a1a1a !important; color: white !important; }
        .leaflet-top.leaflet-right { margin-top: 12px !important; }
        .leaflet-bottom.leaflet-right { margin-bottom: 96px !important; }
      `}</style>
    </div>
  );
};

export default SpatialPage;
