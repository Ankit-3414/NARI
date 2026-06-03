import React from 'react';
import { 
  Sun, Moon, Cloud, CloudSun, CloudMoon, CloudFog, CloudDrizzle, 
  CloudRain, Snowflake, CloudLightning
} from 'lucide-react';

export const getWeatherIcon = (code, isDay = true, size = 24) => {
  if (code === 0) return isDay ? <Sun size={size} className="text-amber-400 drop-shadow-[0_0_8px_#FBBF24]" /> : <Moon size={size} className="text-indigo-200 drop-shadow-[0_0_8px_#C7D2FE]" />;
  if (code === 1 || code === 2) return isDay ? <CloudSun size={size} className="text-amber-300 drop-shadow-[0_0_8px_#FCD34D]" /> : <CloudMoon size={size} className="text-indigo-300" />;
  if (code === 3) return <Cloud size={size} className="text-slate-400" />;
  if (code === 45 || code === 48) return <CloudFog size={size} className="text-slate-300 animate-pulse" />;
  if (code >= 51 && code <= 57) return <CloudDrizzle size={size} className="text-sky-300" />;
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return <CloudRain size={size} className="text-sky-400 animate-bounce" />;
  if (code >= 71 && code <= 77 || code === 85 || code === 86) return <Snowflake size={size} className="text-blue-200" />;
  if (code >= 95) return <CloudLightning size={size} className="text-yellow-400" />;
  return <Sun size={size} className="text-amber-400" />;
};
