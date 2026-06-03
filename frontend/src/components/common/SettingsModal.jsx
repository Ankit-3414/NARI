import React, { useState, useEffect, useRef } from 'react';
import { X, Key, Save, Check, MapPin, Clock } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';

const SettingsModal = ({ isOpen, onClose }) => {
  const { settings, updateSettings, isUpdating } = useSettings();
  const [apiKey, setApiKey] = useState('');
  const [showSaved, setShowSaved] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef(null);
  const inputWrapperRef = useRef(null);
  const searchCacheRef = useRef({});
  const [openUpward, setOpenUpward] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  // Local storage for indexing and caching recent successful searches
  const [recentLocations, setRecentLocations] = useState(() => {
    try {
      const saved = localStorage.getItem('nari_recent_locations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveToRecent = (sug) => {
    const cleanSug = {
      id: sug.id || Date.now(),
      name: sug.name,
      admin1: sug.admin1 || '',
      country: sug.country || '',
      country_code: sug.country_code || '',
      latitude: sug.latitude,
      longitude: sug.longitude
    };
    const updated = [
      cleanSug,
      ...recentLocations.filter(item => item.name.toLowerCase() !== sug.name.toLowerCase())
    ].slice(0, 5);
    setRecentLocations(updated);
    localStorage.setItem('nari_recent_locations', JSON.stringify(updated));
  };

  const getFlagEmoji = (countryCode) => {
    if (!countryCode) return '';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    try {
      return String.fromPoint(...codePoints);
    } catch {
      return '';
    }
  };

  const highlightMatch = (text, query) => {
    if (!query) return <span>{text}</span>;
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return <span>{text}</span>;
    
    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);
    
    return (
      <span>
        {before}
        <span className="text-nari-teal font-extrabold underline decoration-nari-teal/50">{match}</span>
        {after}
      </span>
    );
  };

  useEffect(() => {
    if (isOpen) {
      setApiKey('');
      setLocationInput(settings.weather_location || '');
      setSuggestions([]);
      setActiveIndex(-1);
      setIsFocused(false);
    }
  }, [isOpen, settings.weather_location]);

  useEffect(() => {
    const query = locationInput.trim();
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    if (searchCacheRef.current[lowercaseQuery]) {
      setSuggestions(searchCacheRef.current[lowercaseQuery]);
      return;
    }

    const controller = new AbortController();
    setLoadingSuggestions(true);

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            query
          )}&count=12&language=en&format=json`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = await res.json();
          const results = data.results || [];
          searchCacheRef.current[lowercaseQuery] = results;
          setSuggestions(results);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn("Failed to fetch location suggestions", err);
        }
      } finally {
        setLoadingSuggestions(false);
      }
    }, 450);

    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort();
    };
  }, [locationInput]);

  const handleAutoDetect = async () => {
    setIsDetecting(true);
    let detectedCity = '';

    try {
      const coords = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject();
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos.coords),
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      });

      const revRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json&accept-language=en`, {
        headers: { 'User-Agent': 'NARI-Personal-OS-Client' }
      });
      if (revRes.ok) {
        const revData = await revRes.json();
        const addr = revData.address || {};
        detectedCity = addr.city || addr.town || addr.village || addr.suburb || addr.city_district || '';
      }
    } catch (err) {
      console.log("GPS failed, trying IP chain...");
      const ipProviders = ['https://ipapi.co/json/', 'https://ip-api.com/json/', 'https://freeipapi.com/api/json'];
      for (const url of ipProviders) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            detectedCity = data.city || data.cityName || '';
            if (detectedCity) break;
          }
        } catch (e) {}
      }
    }

    if (detectedCity) {
      setLocationInput(detectedCity);
      saveToRecent({ name: detectedCity });
    } else {
      alert("Could not detect location. Please enter your city manually.");
    }
    setIsDetecting(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (inputWrapperRef.current && !inputWrapperRef.current.contains(e.target)) {
        setSuggestions([]);
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displaySuggestions = locationInput.trim().length >= 2
    ? suggestions.map(sug => ({ ...sug, isRecent: false }))
    : (isFocused ? recentLocations.map(sug => ({ ...sug, isRecent: true })) : []);

  useEffect(() => {
    if (displaySuggestions.length > 0 && inputWrapperRef.current) {
      const rect = inputWrapperRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      setOpenUpward(spaceBelow < 240 && spaceAbove > spaceBelow);
    }
  }, [displaySuggestions]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [displaySuggestions]);

  const handleSelectSuggestion = (sug) => {
    setLocationInput(sug.name);
    saveToRecent(sug);
    setSuggestions([]);
    setIsFocused(false);
  };

  const handleKeyDown = (e) => {
    if (displaySuggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % displaySuggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + displaySuggestions.length) % displaySuggestions.length);
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0) {
        e.preventDefault();
        handleSelectSuggestion(displaySuggestions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setSuggestions([]);
      setIsFocused(false);
    }
  };

  const handleSave = () => {
    const payload = { weather_location: locationInput.trim() };
    if (apiKey) payload.nvidia_api_key = apiKey;
    
    const match = displaySuggestions.find(sug => sug.name.toLowerCase() === locationInput.trim().toLowerCase());
    saveToRecent(match || { name: locationInput.trim() });
    
    updateSettings(payload, {
      onSuccess: () => {
        setApiKey('');
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 3000);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-nari-bg border border-nari-gray/30 p-6 shadow-2xl relative my-auto overflow-visible">
        <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(transparent_50%,rgba(0,0,0,1)_50%)] bg-[length:100%_4px] z-10"></div>
        <div className="flex items-center justify-between mb-6 relative z-20">
          <h2 className="text-xl font-bold text-nari-teal flex items-center gap-2">
            <Key size={20} /> SYSTEM_SETTINGS
          </h2>
          <button onClick={onClose} className="text-nari-gray hover:text-nari-pink transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="space-y-6 relative z-20 max-h-[75vh] overflow-y-auto custom-scrollbar pr-1">
          <div className="space-y-2">
            <label className="text-sm text-nari-teal uppercase font-bold tracking-wider">NVIDIA NIM API Key</label>
            <p className="text-xs text-nari-gray">Enter your API key to enable AI features.</p>
            <div className="mt-2 relative">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={settings.has_nvidia_api_key ? "Key is set. Enter new to overwrite." : "nvapi-..."}
                className={`w-full bg-black/40 border p-3 font-mono text-sm focus:outline-none transition-colors ${
                  settings.has_nvidia_api_key && !apiKey ? 'border-nari-green text-nari-green' : 'border-nari-teal/50 focus:border-nari-teal text-white'
                }`}
              />
            </div>
          </div>
          <div className="space-y-2 border-t border-white/5 pt-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-nari-teal uppercase font-bold tracking-wider">Weather Location</label>
              <button
                type="button"
                onClick={handleAutoDetect}
                disabled={isDetecting}
                className="text-[10px] text-nari-teal/70 hover:text-nari-teal font-mono flex items-center gap-1 border border-nari-teal/20 px-2 py-0.5 rounded hover:bg-nari-teal/10 transition-all disabled:opacity-50"
              >
                <MapPin size={10} className={isDetecting ? 'animate-bounce' : 'animate-pulse'} />
                {isDetecting ? 'DETECTING...' : 'AUTO_DETECT'}
              </button>
            </div>
            <div className="mt-2 relative" ref={inputWrapperRef}>
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Jamshedpur"
                className="w-full bg-black/40 border border-nari-teal/50 focus:border-nari-teal text-white p-3 font-mono text-sm focus:outline-none transition-colors"
              />
              {isFocused && displaySuggestions.length > 0 && (
                <div 
                  ref={dropdownRef}
                  className={`absolute left-0 right-0 z-50 bg-black/95 border border-nari-teal/40 divide-y divide-white/5 shadow-2xl max-h-60 overflow-y-auto custom-scrollbar ${
                    openUpward ? 'bottom-full mb-1' : 'top-full mt-1'
                  }`}
                >
                  {displaySuggestions.map((sug, idx) => (
                    <button
                      key={sug.id || idx}
                      data-sug-idx={idx}
                      onClick={() => handleSelectSuggestion(sug)}
                      className={`w-full text-left p-2.5 text-xs font-mono flex items-center justify-between transition-all ${
                        activeIndex === idx ? 'bg-nari-teal/30 text-nari-teal border-l-2 border-nari-teal' : 'text-white hover:bg-nari-teal/20'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        {sug.isRecent ? <Clock size={12} className="text-nari-gray" /> : <MapPin size={12} className="text-nari-teal" />}
                        <span className="truncate">{highlightMatch(sug.name, locationInput)}</span>
                      </div>
                      <span className="text-[10px] text-nari-gray truncate ml-2">
                        {[sug.admin1, sug.country].filter(Boolean).join(', ')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-white/5">
            <button
              onClick={handleSave}
              disabled={isUpdating || (!apiKey && locationInput.trim() === (settings.weather_location || ''))}
              className="px-6 py-2 bg-nari-teal/20 text-nari-teal border border-nari-teal/50 hover:bg-nari-teal hover:text-black transition-colors flex items-center gap-2 disabled:opacity-50 font-mono uppercase tracking-widest text-sm"
            >
              {isUpdating ? 'SAVING...' : showSaved ? 'SAVED' : 'SAVE_SETTINGS'}
              {!isUpdating && !showSaved && <Save size={16} />}
              {showSaved && <Check size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
