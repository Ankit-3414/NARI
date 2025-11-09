import React, { useState, useEffect } from 'react';
import { getServerTime } from '../lib/api';

export default function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    async function fetchAndSetTime() {
      try {
        const response = await getServerTime();
        if (response && response.serverTime) {
          setTime(new Date(response.serverTime));
        }
      } catch (error) {
        console.error("Failed to fetch server time:", error);
        // Fallback to local time if server time fetch fails
        setTime(new Date());
      }
    }

    fetchAndSetTime();

    const timerId = setInterval(() => {
      setTime(prevTime => new Date(prevTime.getTime() + 1000));
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  const formatTime = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className="text-center mt-4">
      <div className="text-4xl font-extrabold text-cyan-400 tracking-wide">
        {formatTime(time)}
      </div>
      <div className="text-sm text-slate-500">
        {time.toLocaleDateString()}
      </div>
    </div>
  );
}
