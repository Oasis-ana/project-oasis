'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Heart, Calendar, Tag, Edit, Trash2 } from 'lucide-react';
import { Outfit } from '../../types/outfit';

interface OutfitCalendarProps {
  outfits: Outfit[];
  isLoading: boolean;
  onDateClick?: (date: Date, outfits?: Outfit[]) => void;
  onLike?: (outfitId: string) => void;
  onEdit?: (outfit: Outfit) => void;
  onDelete?: (outfit: Outfit) => void;
}

export default function OutfitCalendar({ outfits, isLoading, onDateClick, onLike, onEdit, onDelete }: OutfitCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedOutfits, setSelectedOutfits] = useState<Outfit[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showOutfitModal, setShowOutfitModal] = useState(false);
  const [currentOutfitIndex, setCurrentOutfitIndex] = useState(0);

  const calendarOutfits = useMemo(() => {
    return outfits.filter(outfit => outfit.category !== 'Saved');
  }, [outfits]);

  const outfitsByDate = useMemo(() => {
    const map = new Map<string, Outfit[]>();
    calendarOutfits.forEach(outfit => {
      const dateKey = new Date(outfit.created_at).toDateString();
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(outfit);
    });
    
    map.forEach((dayOutfits) => {
      dayOutfits.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });
    
    return map;
  }, [calendarOutfits]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    
    return days;
  }, [currentMonth]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const handleDateClick = (date: Date, dayOutfits?: Outfit[]) => {
    if (dayOutfits && dayOutfits.length > 0) {
      setSelectedOutfits(dayOutfits);
      setSelectedDate(date);
      setCurrentOutfitIndex(0);
      setShowOutfitModal(true);
    }
    onDateClick?.(date, dayOutfits);
  };

  const closeOutfitModal = () => {
    setShowOutfitModal(false);
    setSelectedOutfits([]);
    setSelectedDate(null);
    setCurrentOutfitIndex(0);
  };

  const navigateOutfit = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentOutfitIndex > 0) {
      setCurrentOutfitIndex(currentOutfitIndex - 1);
    } else if (direction === 'next' && currentOutfitIndex < selectedOutfits.length - 1) {
      setCurrentOutfitIndex(currentOutfitIndex + 1);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTimePosted = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const getTotalDaysWithOutfits = () => {
    return outfitsByDate.size;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center pt-8 px-4">
        <div className="bg-[#0B2C21] p-4 lg:p-8 rounded-xl shadow-2xl max-w-6xl w-full">
          <div className="flex items-center justify-center h-64 lg:h-96">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4">
                <div className="w-12 h-12 border-4 border-[#F5F3EC] border-t-white rounded-full animate-spin"></div>
              </div>
              <p className="text-white/80 text-sm lg:text-base" style={{ fontFamily: 'Inter' }}>
                Loading your outfit calendar...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentOutfit = selectedOutfits[currentOutfitIndex];

  return (
    <>
      <div className="flex justify-center px-2 lg:px-6 pb-4">
        <div className="bg-[#0B2C21] p-3 lg:p-4 rounded-xl shadow-2xl max-w-6xl w-full border border-white/10">
          {/* Calendar Header - mobile optimized */}
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 lg:p-3 hover:bg-white/10 active:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white touch-manipulation"
            >
              <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6" />
            </button>
            
            <h2 
              className="text-xl lg:text-3xl font-bold text-white text-center"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 lg:p-3 hover:bg-white/10 active:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white touch-manipulation"
            >
              <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6" />
            </button>
          </div>

          {/* Weekday Headers - mobile optimized */}
          <div className="grid grid-cols-7 gap-1 lg:gap-4 mb-2">
            {weekDays.map(day => (
              <div 
                key={day} 
                className="text-center text-white/60 font-medium py-1 lg:py-2 text-xs lg:text-base"
                style={{ fontFamily: 'Inter' }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid - mobile responsive */}
          <div className="grid grid-cols-7 gap-1 lg:gap-4">
            {calendarDays.map((date, index) => {
              const dateKey = date.toDateString();
              const dayOutfits = outfitsByDate.get(dateKey) || [];
              const isCurrentMonthDay = isCurrentMonth(date);
              const isTodayDate = isToday(date);
              const hasOutfits = dayOutfits.length > 0;
              const hasMultipleOutfits = dayOutfits.length > 1;

              return (
                <div
                  key={index}
                  onClick={() => handleDateClick(date, dayOutfits)}
                  className={`
                    relative h-16 lg:h-24 rounded-lg border-2 transition-all duration-200 cursor-pointer group touch-manipulation
                    ${isTodayDate 
                      ? 'border-white/50 bg-white/5' 
                      : 'border-white/10 hover:border-white/30 active:border-white/30'
                    }
                    ${!isCurrentMonthDay ? 'opacity-30' : ''}
                    ${hasOutfits ? 'hover:scale-105 active:scale-105' : 'hover:bg-white/5 active:bg-white/5'}
                  `}
                >
                  {hasOutfits ? (
                    // Day with outfit(s) - mobile optimized
                    <div className="relative w-full h-full rounded-md overflow-hidden">
                      <img
                        src={dayOutfits[0].image}
                        alt={dayOutfits[0].title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110 group-active:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>
                      
                      {/* Multiple outfits indicator - mobile sized */}
                      {hasMultipleOutfits && (
                        <div className="absolute top-1 left-1 bg-white/90 text-black px-1.5 py-0.5 rounded text-xs font-bold">
                          {dayOutfits.length}
                        </div>
                      )}
                      
                      {/* Day number - mobile optimized */}
                      <div 
                        className="absolute top-1 lg:top-2 right-1 lg:right-2 text-xs lg:text-sm font-bold text-white z-10"
                        style={{ 
                          textShadow: '0 0 8px rgba(0,0,0,0.8)',
                          fontFamily: 'Inter'
                        }}
                      >
                        {date.getDate()}
                      </div>
                      
                      {/* Outfit title - mobile responsive */}
                      <div className="absolute bottom-0.5 lg:bottom-1 left-0.5 lg:left-1 right-0.5 lg:right-1">
                        <div 
                          className="text-xs text-white font-medium truncate leading-tight"
                          style={{ 
                            textShadow: '0 0 4px rgba(0,0,0,0.8)',
                            fontFamily: 'Inter',
                            fontSize: window.innerWidth < 640 ? '0.65rem' : '0.75rem'
                          }}
                        >
                          {hasMultipleOutfits ? `${dayOutfits[0].title} +${dayOutfits.length - 1}` : dayOutfits[0].title}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Empty day - mobile optimized
                    <div className="flex items-center justify-center w-full h-full">
                      <span 
                        className={`text-sm lg:text-lg font-medium ${
                          isCurrentMonthDay 
                            ? isTodayDate 
                              ? 'text-white' 
                              : 'text-white/70' 
                            : 'text-white/30'
                        }`}
                        style={{ fontFamily: 'Inter' }}
                      >
                        {date.getDate()}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Calendar Footer Stats - mobile optimized */}
          <div className="mt-3 pt-2 border-t border-white/10">
            <div className="grid grid-cols-3 gap-2 lg:gap-3 text-center">
              <div>
                <div className="text-lg lg:text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {calendarOutfits.length}
                </div>
                <div className="text-white/60 text-xs lg:text-sm" style={{ fontFamily: 'Inter' }}>
                  OOTD Outfits
                </div>
              </div>
              <div>
                <div className="text-lg lg:text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {getTotalDaysWithOutfits()}
                </div>
                <div className="text-white/60 text-xs lg:text-sm" style={{ fontFamily: 'Inter' }}>
                  Days with Outfits
                </div>
              </div>
              <div>
                <div className="text-lg lg:text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {Math.round((getTotalDaysWithOutfits() / calendarDays.filter(d => isCurrentMonth(d)).length) * 100)}%
                </div>
                <div className="text-white/60 text-xs lg:text-sm" style={{ fontFamily: 'Inter' }}>
                  Month Coverage
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Outfit Detail Modal - mobile optimized */}
      {showOutfitModal && selectedOutfits.length > 0 && currentOutfit && selectedDate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col lg:flex-row">
            {/* Image Section - mobile responsive */}
            <div className="flex-1 relative bg-gray-100 min-h-[300px] lg:min-h-0">
              <img
                src={currentOutfit.image}
                alt={currentOutfit.title}
                className="w-full h-full object-contain"
              />
              <button
                onClick={closeOutfitModal}
                className="absolute top-4 left-4 p-2 bg-black/50 hover:bg-black/70 active:bg-black/70 text-white rounded-full transition-all shadow-md touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Navigation arrows - mobile optimized */}
              {selectedOutfits.length > 1 && (
                <>
                  {currentOutfitIndex > 0 && (
                    <button
                      onClick={() => navigateOutfit('prev')}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 lg:p-3 bg-black/50 hover:bg-black/70 active:bg-black/70 text-white rounded-full transition-all shadow-md touch-manipulation"
                    >
                      <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6" />
                    </button>
                  )}
                  {currentOutfitIndex < selectedOutfits.length - 1 && (
                    <button
                      onClick={() => navigateOutfit('next')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 lg:p-3 bg-black/50 hover:bg-black/70 active:bg-black/70 text-white rounded-full transition-all shadow-md touch-manipulation"
                    >
                      <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6" />
                    </button>
                  )}
                </>
              )}

              {/* Outfit counter */}
              {selectedOutfits.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                  {currentOutfitIndex + 1} of {selectedOutfits.length}
                </div>
              )}
            </div>

            {/* Details Section - mobile responsive */}
            <div className="w-full lg:w-96 flex flex-col bg-white max-h-[50vh] lg:max-h-none">
              {/* Header - mobile optimized */}
              <div className="p-4 lg:p-6 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600 flex-1 min-w-0" style={{ fontFamily: 'Inter' }}>
                    {formatDate(selectedDate)}
                  </span>
                  {selectedOutfits.length > 1 && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0">
                      {selectedOutfits.length} outfits
                    </span>
                  )}
                </div>
                <div className="flex items-start justify-between">
                  <h2 className="text-lg lg:text-2xl font-bold text-gray-800 flex-1 pr-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                    {currentOutfit.title}
                  </h2>
                  <div className="flex gap-1 lg:gap-2 ml-2 flex-shrink-0">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        onLike?.(currentOutfit.id)
                      }}
                      className="p-2 hover:bg-gray-100 active:bg-gray-100 rounded-full transition-all touch-manipulation"
                    >
                      <Heart className={`w-4 h-4 lg:w-5 lg:h-5 ${currentOutfit.liked ? 'text-red-500 fill-current' : 'text-gray-600 hover:text-red-500'}`} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit?.(currentOutfit)
                        closeOutfitModal()
                      }}
                      className="p-2 hover:bg-gray-100 active:bg-gray-100 rounded-full transition-all touch-manipulation"
                    >
                      <Edit className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600 hover:text-blue-600" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete?.(currentOutfit)
                        closeOutfitModal()
                      }}
                      className="p-2 hover:bg-gray-100 active:bg-gray-100 rounded-full transition-all touch-manipulation"
                    >
                      <Trash2 className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600 hover:text-red-600" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrollable content - mobile optimized */}
              <div className="flex-1 overflow-y-auto p-4 lg:p-6 -webkit-overflow-scrolling-touch">
                {currentOutfit.description && (
                  <div className="mb-4 lg:mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Inter' }}>
                      Description
                    </h3>
                    <p className="text-gray-700 leading-relaxed text-sm lg:text-base" style={{ fontFamily: 'Inter' }}>
                      {currentOutfit.description}
                    </p>
                  </div>
                )}

                <div className="mb-4 lg:mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'Inter' }}>
                    Category
                  </h3>
                  <span className="inline-block px-3 lg:px-4 py-1.5 lg:py-2 bg-[#0B2C21] text-white rounded-full font-semibold text-sm" style={{ fontFamily: 'Inter' }}>
                    {currentOutfit.category}
                  </span>
                </div>

                {currentOutfit.tags && currentOutfit.tags.length > 0 && (
                  <div className="mb-4 lg:mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2" style={{ fontFamily: 'Inter' }}>
                      <Tag className="w-4 h-4" />
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {currentOutfit.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 lg:px-3 py-1 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 active:bg-gray-200 transition-colors text-sm"
                          style={{ fontFamily: 'Inter' }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* All outfits for this day - mobile optimized */}
                {selectedOutfits.length > 1 && (
                  <div className="mb-4 lg:mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'Inter' }}>
                      All Outfits This Day
                    </h3>
                    <div className="space-y-2">
                      {selectedOutfits.map((outfit, index) => (
                        <button
                          key={outfit.id}
                          onClick={() => setCurrentOutfitIndex(index)}
                          className={`w-full p-2 lg:p-3 rounded-lg border-2 transition-all text-left touch-manipulation ${
                            index === currentOutfitIndex 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:border-gray-300 active:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2 lg:gap-3">
                            <img
                              src={outfit.image}
                              alt={outfit.title}
                              className="w-10 h-10 lg:w-12 lg:h-12 object-cover rounded flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate text-sm lg:text-base" style={{ fontFamily: 'Inter' }}>
                                {outfit.title}
                              </div>
                              <div className="text-xs lg:text-sm text-gray-500" style={{ fontFamily: 'Inter' }}>
                                {formatTimePosted(outfit.created_at)}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-sm text-gray-500 border-t pt-4" style={{ fontFamily: 'Inter' }}>
                  Posted {formatTimePosted(currentOutfit.created_at)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}