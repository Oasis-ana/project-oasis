'use client';

import { X, Lightbulb } from 'lucide-react';
import { WeatherData } from '../../hooks/useWeather';

interface WeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  weather: WeatherData | null;
}

const getClothingSuggestion = (weather: WeatherData): string => {
  const temp = Math.round(weather.main.temp);
  const condition = weather.weather[0].main.toLowerCase();
  let suggestion = "";

  if (temp > 80) {
    suggestion = "It's hot out! Perfect for shorts, skirts, and light, breathable tops.";
  } else if (temp > 65) {
    suggestion = "Great weather for a t-shirt and jeans or a light dress.";
  } else if (temp > 50) {
    suggestion = "Might be a bit cool. You should consider adding a light jacket, cardigan, or sweater.";
  } else {
    suggestion = "It's cold! Don't forget a warm coat, a scarf, and maybe a hat.";
  }

  if (condition.includes('rain')) {
    suggestion += " And it looks like rain, so an umbrella or raincoat would be a good idea!";
  } else if (condition.includes('snow')) {
    suggestion += " Snow is in the forecast! A waterproof jacket and boots are a must.";
  }

  return suggestion;
};

export default function WeatherModal({ isOpen, onClose, weather }: WeatherModalProps) {
  if (!isOpen || !weather) {
    return null;
  }

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-black/20 flex items-center justify-center z-50 p-4">
      <div className="relative bg-white/95 backdrop-blur-md rounded-lg p-6 w-96 shadow-xl border border-white/20">
        
        <button onClick={onClose} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
        </button>

        <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                Today's Forecast
            </h3>
            <p className="text-gray-600 mb-6 text-sm" style={{ fontFamily: 'Inter' }}>
                For {weather.name}
            </p>

            <p className="text-6xl font-bold text-[#0B2C21] my-2">
                {Math.round(weather.main.temp)}°F
            </p>
            <p className="text-lg text-gray-700 capitalize" style={{ fontFamily: 'Inter' }}>
                {weather.weather[0].description}
            </p>
            <p className="text-sm text-gray-500 mt-1" style={{ fontFamily: 'Inter' }}>
                Feels like {Math.round(weather.main.feels_like)}°F
            </p>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200/80">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-100/80 rounded-full flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-gray-800" style={{ fontFamily: 'Playfair Display, serif' }}>
                        Style Tip
                    </h4>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter' }}>
                        {getClothingSuggestion(weather)}
                    </p>
                </div>
            </div>
        </div>
        
      </div>
    </div>
  );
}