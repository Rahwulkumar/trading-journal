// 📅 TradingCalendar.jsx - Interactive P&L Calendar
// Location: components/TradingCalendar.jsx

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TradingCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    // Load trades from localStorage
    const loadTrades = () => {
      try {
        const storedTrades = JSON.parse(localStorage.getItem('tradesync_trades') || '[]');
        setTrades(storedTrades);
      } catch (error) {
        console.error('Error loading trades:', error);
      }
    };

    loadTrades();
    window.addEventListener('storage', loadTrades);
    return () => window.removeEventListener('storage', loadTrades);
  }, []);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getTradeDataForDate = (date) => {
    if (!date) return null;
    
    const dateStr = date.toISOString().split('T')[0];
    const dayTrades = trades.filter(trade => trade.date === dateStr);
    
    if (dayTrades.length === 0) return null;
    
    const totalPnL = dayTrades.reduce((sum, trade) => sum + parseFloat(trade.pnl || 0), 0);
    const winCount = dayTrades.filter(trade => parseFloat(trade.pnl || 0) > 0).length;
    
    return {
      totalPnL,
      tradeCount: dayTrades.length,
      winCount,
      winRate: dayTrades.length > 0 ? (winCount / dayTrades.length) * 100 : 0
    };
  };

  const getDayColor = (tradeData) => {
    if (!tradeData) return 'bg-gray-50 dark:bg-gray-800';
    
    if (tradeData.totalPnL > 0) {
      return 'bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700';
    } else if (tradeData.totalPnL < 0) {
      return 'bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700';
    } else {
      return 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600';
    }
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {dayNames.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {days.map((date, index) => {
          const tradeData = getTradeDataForDate(date);
          const isToday = date && date.toDateString() === new Date().toDateString();
          
          return (
            <div
              key={index}
              className={`
                min-h-[80px] p-2 rounded-lg border transition-all duration-200 hover:shadow-md
                ${date ? getDayColor(tradeData) : 'bg-transparent'}
                ${isToday ? 'ring-2 ring-blue-500' : ''}
                ${date ? 'cursor-pointer' : ''}
              `}
            >
              {date && (
                <>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {date.getDate()}
                  </div>
                  {tradeData && (
                    <div className="mt-1">
                      <div className={`text-xs font-medium ${
                        tradeData.totalPnL > 0 ? 'text-green-700 dark:text-green-300' : 
                        tradeData.totalPnL < 0 ? 'text-red-700 dark:text-red-300' : 
                        'text-gray-700 dark:text-gray-300'
                      }`}>
                        ${tradeData.totalPnL > 0 ? '+' : ''}{tradeData.totalPnL.toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {tradeData.tradeCount} trade{tradeData.tradeCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 mt-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-200 dark:bg-green-900/40 rounded border border-green-300"></div>
          <span className="text-gray-600 dark:text-gray-400">Profit</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-200 dark:bg-red-900/40 rounded border border-red-300"></div>
          <span className="text-gray-600 dark:text-gray-400">Loss</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded border border-gray-300"></div>
          <span className="text-gray-600 dark:text-gray-400">Breakeven</span>
        </div>
      </div>
    </div>
  );
};

export default TradingCalendar;