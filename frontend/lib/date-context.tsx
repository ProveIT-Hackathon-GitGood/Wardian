'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface DateContextType {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  resetToToday: () => void;
  isCustomDate: boolean;
}

const DateContext = createContext<DateContextType | undefined>(undefined);

export function DateProvider({ children }: { children: ReactNode }) {
  const [currentDate, setCurrentDateState] = useState<Date>(new Date());
  const [isCustomDate, setIsCustomDate] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedDate = localStorage.getItem('wardian_date');
    const savedIsCustom = localStorage.getItem('wardian_is_custom_date');
    if (savedDate && savedIsCustom === 'true') {
      setCurrentDateState(new Date(savedDate));
      setIsCustomDate(true);
    }
  }, []);

  const setCurrentDate = (date: Date) => {
    setCurrentDateState(date);
    setIsCustomDate(true);
    localStorage.setItem('wardian_date', date.toISOString());
    localStorage.setItem('wardian_is_custom_date', 'true');
  };

  const resetToToday = () => {
    setCurrentDateState(new Date());
    setIsCustomDate(false);
    localStorage.removeItem('wardian_date');
    localStorage.removeItem('wardian_is_custom_date');
  };

  if (!isMounted) return null;

  return (
    <DateContext.Provider value={{ currentDate, setCurrentDate, resetToToday, isCustomDate }}>
      {children}
    </DateContext.Provider>
  );
}

export function useAppDate() {
  const context = useContext(DateContext);
  if (context === undefined) {
    throw new Error('useAppDate must be used within a DateProvider');
  }
  return context;
}
