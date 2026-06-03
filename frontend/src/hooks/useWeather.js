import { useState, useEffect, useCallback } from 'react';
import client from '../api/client';

// Cache expiration: 15 minutes (in milliseconds)
const CACHE_EXPIRATION = 15 * 60 * 1000;

export const useWeather = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWeather = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    // 1. Check Cache
    if (!forceRefresh) {
      try {
        const cachedData = localStorage.getItem('nari_weather_cache');
        const cachedTime = localStorage.getItem('nari_weather_timestamp');
        
        if (cachedData && cachedTime) {
          const age = Date.now() - parseInt(cachedTime, 10);
          if (age < CACHE_EXPIRATION) {
            setWeather(JSON.parse(cachedData));
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn("Failed to read weather cache", e);
      }
    }

    try {
      let lat = 22.8046; // Fallback: Jamshedpur
      let lon = 86.2029;
      let city = 'Jamshedpur';
      let country = 'India';

      let settingsData = null;
      let weather_location = '';
      try {
        const settingsRes = await client.get('/settings');
        if (settingsRes && settingsRes.data) {
          settingsData = settingsRes.data;
          weather_location = settingsData.weather_location;
        }
      } catch (settingsErr) {
        console.warn("Failed to retrieve location settings from backend", settingsErr);
      }

      let manualResolved = false;
      if (weather_location && weather_location.trim()) {
        const queryCity = weather_location.trim();
        const coordParts = queryCity.split(',');
        if (coordParts.length === 2 && !isNaN(parseFloat(coordParts[0])) && !isNaN(parseFloat(coordParts[1]))) {
          lat = parseFloat(coordParts[0]);
          lon = parseFloat(coordParts[1]);
          city = (settingsData && settingsData.weather_city) || `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
          country = '';
          manualResolved = true;
        } else {
          try {
            const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(queryCity)}&count=1&language=en&format=json`);
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              if (geoData.results && geoData.results.length > 0) {
                const loc = geoData.results[0];
                lat = loc.latitude;
                lon = loc.longitude;
                city = loc.name || queryCity;
                country = loc.country || '';
                manualResolved = true;
              }
            }
          } catch (geoErr) {
            console.warn("Geocoding manual location failed, falling back to GPS/IP...", geoErr);
          }
        }
      }

      if (!manualResolved) {
        // 2. Resolve Geolocation: Try GPS / Browser Geolocation first
        const getBrowserCoords = () => {
          return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
              reject(new Error("Geolocation not supported"));
              return;
            }
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve(pos.coords),
              (err) => reject(err),
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
          });
        };

        try {
          const coords = await getBrowserCoords();
          lat = coords.latitude;
          lon = coords.longitude;
          city = 'My Location';
          country = '';
          
          // Reverse-geocode coordinates using keyless OSM Nominatim for a pretty name
          try {
            const revRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`, {
              headers: { 'User-Agent': 'NARI-Personal-OS-Client' }
            });
            if (revRes.ok) {
              const revData = await revRes.json();
              const address = revData.address || {};
              city = address.city || address.town || address.village || address.suburb || 'Local Area';
              country = address.country || '';
            }
          } catch (revErr) {
            console.warn("Reverse geocoding failed", revErr);
          }
        } catch (geoErr) {
          console.log("GPS Geolocation failed or denied, trying IP-based fallback...", geoErr);
          
          // Try IP Geolocation Fallback Chain
          const ipProviders = [
            { url: 'https://ipapi.co/json/', lat: 'latitude', lon: 'longitude', city: 'city', country: 'country_name' },
            { url: 'https://ip-api.com/json/', lat: 'lat', lon: 'lon', city: 'city', country: 'country' },
            { url: 'https://freeipapi.com/api/json', lat: 'latitude', lon: 'longitude', city: 'cityName', country: 'countryName' }
          ];

          let resolved = false;
          for (const provider of ipProviders) {
            try {
              const ipRes = await fetch(provider.url);
              if (ipRes.ok) {
                const ipData = await ipRes.json();
                if (ipData[provider.lat] && ipData[provider.lon]) {
                  lat = ipData[provider.lat];
                  lon = ipData[provider.lon];
                  city = ipData[provider.city] || 'Local Area';
                  country = ipData[provider.country] || '';
                  resolved = true;
                  console.log(`Resolved location via ${provider.url}`);
                  break;
                }
              }
            } catch (pErr) {
              console.warn(`IP provider ${provider.url} failed`, pErr);
            }
          }

          if (!resolved) {
            console.log("All IP Geolocation providers failed, using default fallback (Jamshedpur)");
          }
        }
      }

      // 3. Query Open-Meteo Weather API
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
      const res = await fetch(weatherUrl);
      if (!res.ok) {
        throw new Error(`Open-Meteo responded with HTTP ${res.status}`);
      }

      const weatherData = await res.json();
      const current = weatherData.current || {};
      const daily = weatherData.daily || {};

      // Map WMO codes to clean descriptions
      const weatherCodes = {
        0: "Clear Sky",
        1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
        45: "Foggy", 48: "Rime Fog",
        51: "Light Drizzle", 53: "Moderate Drizzle", 55: "Dense Drizzle",
        61: "Slight Rain", 63: "Moderate Rain", 65: "Heavy Rain",
        71: "Slight Snow", 73: "Moderate Snow", 75: "Heavy Snow",
        77: "Snow Grains",
        80: "Slight Showers", 81: "Moderate Showers", 82: "Heavy Showers",
        85: "Slight Snow Showers", 86: "Heavy Snow Showers",
        95: "Thunderstorm", 96: "Thunderstorm + Hail", 99: "Severe Storm"
      };

      const code = current.weather_code || 0;
      const desc = weatherCodes[code] || "Clear";
      const isDay = current.is_day === 1;

      const weatherReport = {
        city,
        country,
        lat,
        lon,
        temperature: current.temperature_2m,
        feelsLike: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        weatherCode: code,
        condition: desc,
        isDay,
        daily: daily.time ? daily.time.map((time, idx) => ({
          date: time,
          maxTemp: daily.temperature_2m_max[idx],
          minTemp: daily.temperature_2m_min[idx],
          code: daily.weather_code[idx],
          condition: weatherCodes[daily.weather_code[idx]] || "Clear"
        })) : []
      };

      // 4. Save Cache
      try {
        localStorage.setItem('nari_weather_cache', JSON.stringify(weatherReport));
        localStorage.setItem('nari_weather_timestamp', Date.now().toString());
      } catch (cacheErr) {
        console.warn("Failed to write weather cache", cacheErr);
      }

      // 5. Update backend user settings to keep AI context weather-aware
      try {
        await client.patch('/settings', {
          weather_city: city,
          weather_lat: lat,
          weather_lon: lon,
          weather_temp: current.temperature_2m,
          weather_condition: desc
        });
      } catch (settingsErr) {
        console.warn("Failed to synchronize weather settings with backend", settingsErr);
      }

      setWeather(weatherReport);
    } catch (err) {
      console.error("Failed to fetch weather", err);
      setError(err.message || "Failed to load weather");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  return { weather, loading, error, refetch: () => fetchWeather(true) };
};
