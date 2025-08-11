'use client';

import { X, Lightbulb, Droplets, Wind, Eye, Umbrella, Sun, Cloud, CloudRain, CloudSnow, Zap } from 'lucide-react';
import { WeatherData } from '../../hooks/useWeather';

interface WeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  weather: WeatherData | null;
}

const getWeatherIcon = (condition: string) => {
  
  const iconClass = "w-12 h-12 sm:w-16 sm:h-16";
  
  if (condition.includes('rain')) {
    return <CloudRain className={`${iconClass} text-white/80`} />;
  } else if (condition.includes('snow')) {
    return <CloudSnow className={`${iconClass} text-white/80`} />;
  } else if (condition.includes('thunder')) {
    return <Zap className={`${iconClass} text-white/80`} />;
  } else if (condition.includes('cloud')) {
    return <Cloud className={`${iconClass} text-white/80`} />;
  } else {
    return <Sun className={`${iconClass} text-white/80`} />;
  }
};

const getClothingSuggestion = (weather: WeatherData): { title: string; suggestion: string; items: string[] } => {
  const temp = Math.round(weather.main.temp);
  const condition = weather.weather[0].main.toLowerCase();
  let title = "";
  let suggestion = "";
  let items: string[] = [];

  if (temp > 80) {
    title = "Stay Cool & Stylish";
    suggestion = "It's hot out! Perfect for light, breathable pieces.";
    items = ["Shorts", "Cotton Top", "Sandals", "Sun Hat", "Sunglasses"];
  } else if (temp > 65) {
    title = "Perfect Weather Vibes";
    suggestion = "Great weather for versatile outfit choices.";
    items = ["Jeans", "T-shirt", "Light Sweater", "Sneakers", "Light Jacket"];
  } else if (temp > 50) {
    title = "Layer Up Smartly";
    suggestion = "A bit cool - layering is your friend!";
    items = ["Pants", "Long-sleeve", "Cardigan", "Shoes", "Scarf"];
  } else {
    title = "Bundle Up in Style";
    suggestion = "It's cold! Time for cozy, warm pieces.";
    items = ["Warm Coat", "Sweater", "Pants", "Boots", "Scarf & Hat"];
  }

  if (condition.includes('rain')) {
    items.push("Raincoat");
    items.push("Waterproof Shoes");
  } else if (condition.includes('snow')) {
    items.push("Waterproof Boots");
    items.push("Gloves");
  }

  return { title, suggestion, items };
};

export default function WeatherModal({ isOpen, onClose, weather }: WeatherModalProps) {
  if (!isOpen || !weather) {
    return null;
  }

  const temp = Math.round(weather.main.temp);
  const condition = weather.weather[0].main.toLowerCase();
  const clothingAdvice = getClothingSuggestion(weather);

  return (
    <div 
      className="fixed inset-0 backdrop-blur-md bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        
        className="relative bg-white/95 backdrop-blur-md rounded-2xl w-full max-w-xs sm:max-w-md shadow-2xl overflow-hidden border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        
        
        
        <div className="bg-[#0B2C21] p-4 sm:p-6 text-white relative overflow-hidden">
          <button 
            onClick={onClose}
            className="absolute top-2 right-2 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-all z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className="flex justify-center mb-2">
              {getWeatherIcon(condition)}
            </div>
            
            
            <h3 className="text-xl sm:text-2xl font-bold mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
              Today's Weather
            </h3>
            <p className="text-white/90 text-sm mb-3" style={{ fontFamily: 'Inter' }}>
              {weather.name}
            </p>

            <div className="flex items-baseline justify-center gap-1 mb-1">
              <span className="text-5xl sm:text-6xl font-bold">
                {temp}
              </span>
              <span className="text-xl sm:text-2xl font-light">°F</span>
            </div>
            
            <p className="text-base sm:text-lg capitalize font-medium" style={{ fontFamily: 'Inter' }}>
              {weather.weather[0].description}
            </p>
            <p className="text-white/80 text-xs sm:text-sm" style={{ fontFamily: 'Inter' }}>
              Feels like {Math.round(weather.main.feels_like)}°F
            </p>
          </div>

          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl opacity-50"></div>
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full blur-xl opacity-50"></div>
        </div>

        {/* Weather details */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 bg-[#F5F3EC]/80">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="text-center">
              <div className="flex justify-center mb-1">
                <Droplets className="w-4 h-4 sm:w-5 sm:h-5 text-[#0B2C21]" />
              </div>
              <p className="text-xs text-gray-600" style={{ fontFamily: 'Inter' }}>Humidity</p>
              <p className="font-semibold text-sm sm:text-base text-[#0B2C21]">{(weather.main as any)?.humidity || 'N/A'}%</p>
            </div>
            
            <div className="text-center">
              <div className="flex justify-center mb-1">
                <Wind className="w-4 h-4 sm:w-5 sm:h-5 text-[#0B2C21]" />
              </div>
              <p className="text-xs text-gray-600" style={{ fontFamily: 'Inter' }}>Wind</p>
              <p className="font-semibold text-sm sm:text-base text-[#0B2C21]">{Math.round((weather as any)?.wind?.speed || 0)} mph</p>
            </div>
            
            <div className="text-center">
              <div className="flex justify-center mb-1">
                <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-[#0B2C21]" />
              </div>
              <p className="text-xs text-gray-600" style={{ fontFamily: 'Inter' }}>Visibility</p>
              <p className="font-semibold text-sm sm:text-base text-[#0B2C21]">{Math.round(((weather as any)?.visibility || 10000) / 1000)} mi</p>
            </div>
          </div>
        </div>

        {/* Style suggestions */}
        <div className="p-4 sm:p-6 bg-white/95 backdrop-blur-sm">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#0B2C21] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            
            <div className="flex-1">
              <h4 className="text-base sm:text-lg font-bold text-[#0B2C21] mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                {clothingAdvice.title}
              </h4>
              <p className="text-gray-600 text-sm mb-3" style={{ fontFamily: 'Inter' }}>
                {clothingAdvice.suggestion}
              </p>
              
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide" style={{ fontFamily: 'Inter' }}>
                  Recommended Items:
                </p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {clothingAdvice.items.map((item, index) => (
                    <span
                      key={index}
                      className="px-2.5 py-1 sm:px-3 bg-[#0B2C21]/10 text-[#0B2C21] rounded-full text-xs font-medium border border-[#0B2C21]/20"
                      style={{ fontFamily: 'Inter' }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rain/Snow reminder */}
        {(condition.includes('rain') || condition.includes('snow')) && (
          <div className="px-4 py-2 sm:px-6 sm:py-3 bg-[#0B2C21]/5 border-t border-[#0B2C21]/10">
            <div className="flex items-center justify-center gap-2 text-[#0B2C21]">
              <Umbrella className="w-4 h-4" />
              <p className="text-sm font-medium" style={{ fontFamily: 'Inter' }}>
                {condition.includes('rain') ? "Don't forget your umbrella!" : "Stay warm and dry!"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}