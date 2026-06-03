"""Weather utility for NARI using free, keyless Open-Meteo API."""

import httpx
from typing import Optional

async def fetch_weather_report(city: str, lat: Optional[float] = None, lon: Optional[float] = None) -> str:
    """Fetch current weather and 3-day forecast for a city or coordinates using Open-Meteo."""
    geo_url = "https://geocoding-api.open-meteo.com/v1/search"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)"
    }
    
    # Check if city matches coordinate format: "lat,lon"
    is_coord = False
    name = city
    country = ""
    admin1 = ""
    
    # Prioritize passed coordinates if they exist
    if lat is not None and lon is not None:
        is_coord = True
        name = city or f"Coordinates ({lat:.4f}, {lon:.4f})"
    else:
        try:
            parts = city.split(",")
            if len(parts) == 2:
                lat = float(parts[0].strip())
                lon = float(parts[1].strip())
                is_coord = True
                name = f"Coordinates ({lat:.4f}, {lon:.4f})"
        except ValueError:
            pass
        
    try:
        async with httpx.AsyncClient() as client:
            if not is_coord:
                # 1. Geocode city name to lat/lon
                geo_params = {"name": city, "count": 1, "language": "en", "format": "json"}
                geo_res = await client.get(geo_url, params=geo_params, headers=headers, timeout=8.0)
                if geo_res.status_code != 200:
                    return f"Failed to retrieve coordinates for '{city}' (HTTP {geo_res.status_code})."
                
                geo_data = geo_res.json()
                if not geo_data.get("results"):
                    return f"Could not find any location matching '{city}'."
                
                loc = geo_data["results"][0]
                lat = loc["latitude"]
                lon = loc["longitude"]
                name = loc.get("name", city)
                country = loc.get("country", "")
                admin1 = loc.get("admin1", "")
            
            # 2. Query forecast
            weather_url = "https://api.open-meteo.com/v1/forecast"
            weather_params = {
                "latitude": lat,
                "longitude": lon,
                "current": ["temperature_2m", "relative_humidity_2m", "apparent_temperature", "is_day", "weather_code", "wind_speed_10m"],
                "daily": ["weather_code", "temperature_2m_max", "temperature_2m_min"],
                "timezone": "auto"
            }
            
            weather_res = await client.get(weather_url, params=weather_params, headers=headers, timeout=8.0)
            if weather_res.status_code != 200:
                return f"Failed to retrieve weather data for '{name}' (HTTP {weather_res.status_code})."
                
            weather_data = weather_res.json()
            current = weather_data.get("current", {})
            daily = weather_data.get("daily", {})
            
            # WMO Weather interpretation codes
            weather_codes = {
                0: "Clear sky ☀️",
                1: "Mainly clear 🌤️", 2: "Partly cloudy ⛅", 3: "Overcast ☁️",
                45: "Fog 🌫️", 48: "Depositing rime fog 🌫️",
                51: "Light drizzle 🌧️", 53: "Moderate drizzle 🌧️", 55: "Dense drizzle 🌧️",
                61: "Slight rain 🌧️", 63: "Moderate rain 🌧️", 65: "Heavy rain 🌧️",
                71: "Slight snow fall ❄️", 73: "Moderate snow fall ❄️", 75: "Heavy snow fall ❄️",
                77: "Snow grains ❄️",
                80: "Slight rain showers 🌦️", 81: "Moderate rain showers 🌦️", 82: "Violent rain showers ⛈️",
                85: "Slight snow showers 🌨️", 86: "Heavy snow showers 🌨️",
                95: "Thunderstorm ⛈️", 96: "Thunderstorm with slight hail ⛈️", 99: "Thunderstorm with heavy hail ⛈️"
            }
            
            code = current.get("weather_code", 0)
            condition = weather_codes.get(code, "Unknown weather condition")
            
            temp = current.get("temperature_2m", "N/A")
            feels_like = current.get("apparent_temperature", "N/A")
            humidity = current.get("relative_humidity_2m", "N/A")
            wind = current.get("wind_speed_10m", "N/A")
            
            # Construct beautiful report
            report = f"Current weather in {name}, {admin1} ({country}):\n"
            report += f"- Conditions: {condition}\n"
            report += f"- Temperature: {temp}°C (Feels like {feels_like}°C)\n"
            report += f"- Humidity: {humidity}%\n"
            report += f"- Wind Speed: {wind} km/h\n"
            
            if daily and len(daily.get("time", [])) > 0:
                report += "\n3-Day Forecast:\n"
                for i in range(min(3, len(daily["time"]))):
                    date = daily["time"][i]
                    max_t = daily["temperature_2m_max"][i]
                    min_t = daily["temperature_2m_min"][i]
                    day_code = daily["weather_code"][i]
                    day_desc = weather_codes.get(day_code, "Clear")
                    report += f"- {date}: High of {max_t}°C, Low of {min_t}°C ({day_desc})\n"
                    
            return report
            
    except httpx.ConnectTimeout:
        return f"Weather API connection timed out. Outgoing connections to api.open-meteo.com might be restricted by local proxy firewalls."
    except Exception as e:
        return f"Error retrieving weather report: {str(e)}"
