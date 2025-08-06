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

  // Updated to store multiple outfits per date
  const outfitsByDate = useMemo(() => {
    const map = new Map<string, Outfit[]>();
    calendarOutfits.forEach(outfit => {
      const dateKey = new Date(outfit.created_at).toDateString();
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(outfit);
    });
    
    // Sort outfits by creation time for each date
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
      <div className="flex justify-center pt-8">
        <div className="bg-[#0B2C21] p-8 rounded-xl shadow-2xl max-w-6xl w-full">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4">
                <div className="w-12 h-12 border-4 border-[#F5F3EC] border-t-white rounded-full animate-spin"></div>
              </div>
              <p className="text-white/80" style={{ fontFamily: 'Inter' }}>
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
      <div className="flex justify-center px-6 pb-4">
        <div className="bg-[#0B2C21] p-4 rounded-xl shadow-2xl max-w-6xl w-full border border-white/10">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-3 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <h2 
              className="text-3xl font-bold text-white"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-3 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-4 mb-2">
            {weekDays.map(day => (
              <div 
                key={day} 
                className="text-center text-white/60 font-medium py-2"
                style={{ fontFamily: 'Inter' }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-4">
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
                    relative h-24 rounded-lg border-2 transition-all duration-200 cursor-pointer group
                    ${isTodayDate 
                      ? 'border-white/50 bg-white/5' 
                      : 'border-white/10 hover:border-white/30'
                    }
                    ${!isCurrentMonthDay ? 'opacity-30' : ''}
                    ${hasOutfits ? 'hover:scale-105' : 'hover:bg-white/5'}
                  `}
                >
                  {hasOutfits ? (
                    // Day with outfit(s)
                    <div className="relative w-full h-full rounded-md overflow-hidden">
                      {/* Show first outfit as main image */}
                      <img
                        src={dayOutfits[0].image}
                        alt={dayOutfits[0].title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>
                      
                      {/* Multiple outfits indicator */}
                      {hasMultipleOutfits && (
                        <div className="absolute top-1 left-1 bg-white/90 text-black px-1.5 py-0.5 rounded text-xs font-bold">
                          {dayOutfits.length}
                        </div>
                      )}
                      
                      {/* Day number */}
                      <div 
                        className="absolute top-2 right-2 text-sm font-bold text-white z-10"
                        style={{ 
                          textShadow: '0 0 8px rgba(0,0,0,0.8)',
                          fontFamily: 'Inter'
                        }}
                      >
                        {date.getDate()}
                      </div>
                      
                      {/* Outfit title */}
                      <div className="absolute bottom-1 left-1 right-1">
                        <div 
                          className="text-xs text-white font-medium truncate"
                          style={{ 
                            textShadow: '0 0 4px rgba(0,0,0,0.8)',
                            fontFamily: 'Inter'
                          }}
                        >
                          {hasMultipleOutfits ? `${dayOutfits[0].title} +${dayOutfits.length - 1}` : dayOutfits[0].title}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Empty day
                    <div className="flex items-center justify-center w-full h-full">
                      <span 
                        className={`text-lg font-medium ${
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

          {/* Calendar Footer Stats */}
          <div className="mt-3 pt-2 border-t border-white/10">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {calendarOutfits.length}
                </div>
                <div className="text-white/60 text-sm" style={{ fontFamily: 'Inter' }}>
                  OOTD Outfits
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {getTotalDaysWithOutfits()}
                </div>
                <div className="text-white/60 text-sm" style={{ fontFamily: 'Inter' }}>
                  Days with Outfits
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {Math.round((getTotalDaysWithOutfits() / calendarDays.filter(d => isCurrentMonth(d)).length) * 100)}%
                </div>
                <div className="text-white/60 text-sm" style={{ fontFamily: 'Inter' }}>
                  Month Coverage
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Outfit Detail Modal */}
      {showOutfitModal && selectedOutfits.length > 0 && currentOutfit && selectedDate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex">
            {/* Image Section */}
            <div className="flex-1 relative bg-gray-100">
              <img
                src={currentOutfit.image}
                alt={currentOutfit.title}
                className="w-full h-full object-contain"
              />
              <button
                onClick={closeOutfitModal}
                className="absolute top-4 left-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all shadow-md"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Navigation arrows for multiple outfits */}
              {selectedOutfits.length > 1 && (
                <>
                  {currentOutfitIndex > 0 && (
                    <button
                      onClick={() => navigateOutfit('prev')}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all shadow-md"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                  )}
                  {currentOutfitIndex < selectedOutfits.length - 1 && (
                    <button
                      onClick={() => navigateOutfit('next')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all shadow-md"
                    >
                      <ChevronRight className="w-6 h-6" />
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

            {/* Details Section */}
            <div className="w-96 flex flex-col bg-white">
              {/* Header with date and multiple outfits indicator */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600" style={{ fontFamily: 'Inter' }}>
                    {formatDate(selectedDate)}
                  </span>
                  {selectedOutfits.length > 1 && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                      {selectedOutfits.length} outfits
                    </span>
                  )}
                </div>
                <div className="flex items-start justify-between">
                  <h2 className="text-2xl font-bold text-gray-800 flex-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                    {currentOutfit.title}
                  </h2>
                  <div className="flex gap-2 ml-3">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        onLike?.(currentOutfit.id)
                      }}
                      className="p-2 hover:bg-gray-100 rounded-full transition-all"
                    >
                      <Heart className={`w-5 h-5 ${currentOutfit.liked ? 'text-red-500 fill-current' : 'text-gray-600 hover:text-red-500'}`} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit?.(currentOutfit)
                        closeOutfitModal()
                      }}
                      className="p-2 hover:bg-gray-100 rounded-full transition-all"
                    >
                      <Edit className="w-5 h-5 text-gray-600 hover:text-blue-600" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete?.(currentOutfit)
                        closeOutfitModal()
                      }}
                      className="p-2 hover:bg-gray-100 rounded-full transition-all"
                    >
                      <Trash2 className="w-5 h-5 text-gray-600 hover:text-red-600" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto p-6">
                {currentOutfit.description && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Inter' }}>
                      Description
                    </h3>
                    <p className="text-gray-700 leading-relaxed" style={{ fontFamily: 'Inter' }}>
                      {currentOutfit.description}
                    </p>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'Inter' }}>
                    Category
                  </h3>
                  <span className="inline-block px-4 py-2 bg-[#0B2C21] text-white rounded-full font-semibold" style={{ fontFamily: 'Inter' }}>
                    {currentOutfit.category}
                  </span>
                </div>

                {currentOutfit.tags && currentOutfit.tags.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2" style={{ fontFamily: 'Inter' }}>
                      <Tag className="w-4 h-4" />
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {currentOutfit.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors"
                          style={{ fontFamily: 'Inter' }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* All outfits for this day */}
                {selectedOutfits.length > 1 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'Inter' }}>
                      All Outfits This Day
                    </h3>
                    <div className="space-y-2">
                      {selectedOutfits.map((outfit, index) => (
                        <button
                          key={outfit.id}
                          onClick={() => setCurrentOutfitIndex(index)}
                          className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                            index === currentOutfitIndex 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={outfit.image}
                              alt={outfit.title}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate" style={{ fontFamily: 'Inter' }}>
                                {outfit.title}
                              </div>
                              <div className="text-sm text-gray-500" style={{ fontFamily: 'Inter' }}>
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