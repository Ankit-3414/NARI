import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Wind, Droplets, Thermometer, MapPin, RefreshCw, ChevronLeft, Calendar, Terminal
} from 'lucide-react';
import { useWeather } from '../hooks/useWeather';
import { useSettings } from '../hooks/useSettings';
import { getWeatherIcon } from '../utils/weather';

const WeatherPage = () => {
  const navigate = useNavigate();
  const { weather, loading, error, refetch } = useWeather();
  const { settings, updateSettings, isUpdating } = useSettings();

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.4, 
        staggerChildren: 0.1 
      } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };


  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-12"
    >
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-4 gap-4">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 text-secondary hover:text-primary transition-colors text-xs font-mono tracking-widest uppercase text-left w-fit"
        >
          <ChevronLeft size={16} />
          <span>&lt; Back to HUD</span>
        </button>
        
        <div className="flex items-center gap-2 px-3 py-1 bg-surface border border-primary/20 text-[10px] font-mono text-primary font-bold tracking-[0.3em] uppercase rounded-xl">
          <Terminal size={12} />
          <span>Weather_Telemetry</span>
        </div>
      </div>


      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <RefreshCw size={36} className="text-primary animate-spin" />
          <p className="text-xs text-secondary font-mono tracking-widest uppercase animate-pulse">Establishing Satellite Uplink...</p>
        </div>
      ) : error ? (
        <div className="p-8 border border-danger/20 bg-danger/5 rounded-3xl text-center space-y-4 max-w-md mx-auto">
          <p className="text-danger font-bold uppercase tracking-widest">Telemetry Lost</p>
          <p className="text-secondary text-xs font-mono">{error}</p>
          <button 
            onClick={refetch}
            className="px-4 py-2 border border-danger text-danger text-xs font-black uppercase tracking-widest rounded-xl hover:bg-danger hover:text-black transition-all"
          >
            Retry Sync
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Telemetry Bento Card */}
          <motion.div 
            variants={itemVariants}
            className="lg:col-span-2 p-8 bg-surface/40 backdrop-blur-md border border-white/10 rounded-3xl relative overflow-hidden flex flex-col justify-between"
            style={{ clipPath: 'polygon(0 0, 95% 0, 100% 8%, 100% 100%, 5% 100%, 0 92%)' }}
          >
            {/* Background Atmosphere Glow */}
            <div className="absolute -right-16 -top-16 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="space-y-6">
              {/* Location telemetry header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-primary">
                    <MapPin size={16} />
                    <h1 className="text-2xl font-black uppercase tracking-tighter text-white">
                      {weather.city}
                    </h1>
                  </div>
                  <p className="text-[10px] text-secondary tracking-widest uppercase">
                    Lat: {weather.lat.toFixed(4)} / Lon: {weather.lon.toFixed(4)}
                  </p>
                </div>
                
                <button 
                  onClick={refetch}
                  className="p-3 bg-white/5 text-secondary hover:text-primary border border-white/5 rounded-2xl hover:bg-primary/10 hover:border-primary/20 transition-all hover:rotate-180 duration-500"
                >
                  <RefreshCw size={16} />
                </button>
              </div>

              {/* Huge temperature display */}
              <div className="flex items-center gap-6 py-6 border-y border-white/5">
                <div className="p-4 bg-white/5 border border-white/5 rounded-3xl">
                  {getWeatherIcon(weather.weatherCode, weather.isDay, 64)}
                </div>
                <div className="space-y-1">
                  <div className="text-5xl font-black text-white tracking-tighter flex items-start">
                    {weather.temperature}
                    <span className="text-2xl text-primary font-bold">°C</span>
                  </div>
                  <div className="text-xs uppercase font-mono font-bold tracking-widest text-secondary">
                    {weather.condition}
                  </div>
                </div>
              </div>
            </div>

            {/* Micro-metrics Grid */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-1">
                <div className="flex items-center gap-1.5 text-secondary text-[9px] uppercase tracking-widest">
                  <Thermometer size={12} className="text-primary/60" />
                  <span>Feels Like</span>
                </div>
                <p className="text-lg font-black text-white">{weather.feelsLike}°C</p>
              </div>
              
              <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-1">
                <div className="flex items-center gap-1.5 text-secondary text-[9px] uppercase tracking-widest">
                  <Droplets size={12} className="text-primary/60" />
                  <span>Humidity</span>
                </div>
                <p className="text-lg font-black text-white">{weather.humidity}%</p>
              </div>

              <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-1">
                <div className="flex items-center gap-1.5 text-secondary text-[9px] uppercase tracking-widest">
                  <Wind size={12} className="text-primary/60" />
                  <span>Wind Speed</span>
                </div>
                <p className="text-lg font-black text-white">{weather.windSpeed} km/h</p>
              </div>
            </div>
          </motion.div>

          {/* 3-Day Forecast Bento Card */}
          <motion.div 
            variants={itemVariants}
            className="p-8 bg-surface/40 backdrop-blur-md border border-white/10 rounded-3xl flex flex-col justify-between"
            style={{ clipPath: 'polygon(5% 0, 100% 0, 100% 92%, 95% 100%, 0 100%, 0 8%)' }}
          >
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                <Calendar size={16} className="text-primary" />
                <h2 className="text-sm font-black uppercase tracking-widest text-white">Daily_Forecast</h2>
              </div>

              <div className="space-y-4">
                {weather.daily.slice(0, 3).map((day, idx) => (
                  <div 
                    key={day.date}
                    className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-primary/20 transition-all duration-300"
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white group-hover:text-primary transition-colors">
                        {idx === 0 ? 'Today' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' })}
                      </p>
                      <p className="text-[9px] font-mono text-secondary uppercase">
                        {day.condition}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      {getWeatherIcon(day.code, true, 24)}
                      <div className="text-right">
                        <span className="text-xs font-bold text-white">{day.maxTemp}°</span>
                        <span className="text-[10px] text-secondary ml-1.5">{day.minTemp}°</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-[8px] text-secondary uppercase tracking-[0.2em]">
                Telemetry via Open-Meteo • Locally Cached
              </p>
            </div>
          </motion.div>

        </div>
      )}
    </motion.div>
  );
};

export default WeatherPage;
