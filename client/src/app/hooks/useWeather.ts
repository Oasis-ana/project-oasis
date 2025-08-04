// hooks/useWeather.ts
'use client';

import { useState, useEffect } from 'react';

export interface WeatherData {
  name: string;
  main: {
    temp: number;
    feels_like: number;
  };
  weather: {
    main: string; // Correctly included
    description: string;
    icon: string;
  }[];
}

export const useWeather = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    const handleSuccess = async (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

      if (!apiKey) {
        setError('Weather API key is missing.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=imperial`);
        if (!response.ok) throw new Error('Failed to fetch weather data.');
        const data: WeatherData = await response.json();
        setWeather(data);
      } catch (err) {
        if (err instanceof Error) setError(err.message);
        else setError('An unknown error occurred.');
      } finally {
        setLoading(false);
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      setError(`Location error: ${error.message}`);
      setLoading(false);
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError);
  }, []);

  return { weather, loading, error };
};