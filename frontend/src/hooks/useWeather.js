import { useState, useEffect, useCallback, useRef } from 'react';
import client from '../api/client';

// Cache expiration: 15 minutes (in milliseconds)
const CACHE_EXPIRATION = 15 * 60 * 1000;
const REFRESH_DISTANCE_THRESHOLD = 500; // 500 meters

// Haversine for distance check
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

export const useWeather = (manualCoords = null) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastCoordsRef = useRef(null);

  const fetchWeather = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    // 1. Check Distance/Cache Thresholds
    if (!forceRefresh) {
      const cachedData = localStorage.getItem('nari_weather_cache');
      const cachedTime = localStorage.getItem('nari_weather_timestamp');
      
      if (cachedData && cachedTime) {
        const parsed = JSON.parse(cachedData);
        const age = Date.now() - parseInt(cachedTime, 10);
        
        // If we have manual coords, check if we've moved enough to warrant a refresh
        let hasMoved = false;
        if (manualCoords && manualCoords.length === 2) {
          const dist = getDistance(manualCoords[0], manualCoords[1], parsed.lat, parsed.lon);
          if (dist > REFRESH_DISTANCE_THRESHOLD) hasMoved = true;
        }

        if (age < CACHE_EXPIRATION && !hasMoved) {
          setWeather(parsed);
          setLoading(false);
          return;
        }
      }
    }

    try {
      let lat = 22.8046; // Fallback: Jamshedpur
      let lon = 86.2029;
      let city = 'Jamshedpur';
      let country = 'India';

      let resolved = false;

      // Priority 1: Manual Coordinates (from Spatial Awareness)
      if (manualCoords && manualCoords.length === 2 && !isNaN(manualCoords[0]) && !isNaN(manualCoords[1])) {
        lat = manualCoords[0];
        lon = manualCoords[1];
        city = 'Current Location';
        resolved = true;
        
        // Quick Reverse Geocode for city name
        try {
          const revRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`, {
            headers: { 'User-Agent': 'NARI-Personal-OS-Client' }
          });
          if (revRes.ok) {
            const revData = await revRes.json();
            const address = revData.address || {};
            city = address.city || address.town || address.village || address.suburb || 'Local Area';
          }
        } catch (e) { /* ignore geocode errors */ }
      }

      // Priority 2: Manual Settings Override
      if (!resolved) {
        try {
          const settingsRes = await client.get('/settings');
          if (settingsRes && settingsRes.data && settingsRes.data.weather_location) {
            const queryCity = settingsRes.data.weather_location.trim();
            const coordParts = queryCity.split(',');
            if (coordParts.length === 2 && !isNaN(parseFloat(coordParts[0]))) {
              lat = parseFloat(coordParts[0]);
              lon = parseFloat(coordParts[1]);
              city = settingsRes.data.weather_city || 'Custom';
              resolved = true;
            } else {
              const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(queryCity)}&count=1&language=en&format=json`);
              if (geoRes.ok) {
                const geoData = await geoRes.json();
                if (geoData.results?.length > 0) {
                  const loc = geoData.results[0];
                  lat = loc.latitude; lon = loc.longitude;
                  city = loc.name; resolved = true;
                }
              }
            }
          }
        } catch (e) { console.warn(e); }
      }

      // Priority 3: GPS / IP Fallback
      if (!resolved) {
         try {
           const geoRes = await client.get('/utils/geolocate');
           if (geoRes?.ok && geoRes.data) {
             lat = geoRes.data.latitude || lat;
             lon = geoRes.data.longitude || lon;
             city = geoRes.data.city || city;
           }
         } catch (e) { console.warn(e); }
      }

      // 3. Query Open-Meteo Weather API
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
      const res = await fetch(weatherUrl);
      if (!res.ok) throw new Error("Weather API failure");

      const weatherData = await res.json();
      const current = weatherData.current || {};
      const daily = weatherData.daily || {};

      const weatherCodes = {
        0: "Clear Sky", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
        45: "Foggy", 48: "Rime Fog", 51: "Light Drizzle", 61: "Slight Rain",
        63: "Moderate Rain", 65: "Heavy Rain", 95: "Thunderstorm"
      };

      const code = current.weather_code || 0;
      const weatherReport = {
        city, lat, lon,
        temperature: current.temperature_2m,
        feelsLike: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        weatherCode: code,
        condition: weatherCodes[code] || "Clear",
        isDay: current.is_day === 1,
        daily: daily.time ? daily.time.map((time, idx) => ({
          date: time, maxTemp: daily.temperature_2m_max[idx], minTemp: daily.temperature_2m_min[idx]
        })) : []
      };

      localStorage.setItem('nari_weather_cache', JSON.stringify(weatherReport));
      localStorage.setItem('nari_weather_timestamp', Date.now().toString());

      // Update AI context
      client.patch('/settings', { weather_city: city, weather_temp: current.temperature_2m, weather_condition: weatherReport.condition }).catch(() => {});

      setWeather(weatherReport);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [manualCoords]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  return { weather, loading, error, refetch: () => fetchWeather(true) };
};
