'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

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

  const setCurrentDate = (date: Date) => {
    setCurrentDateState(date);
    setIsCustomDate(true);
  };

  const resetToToday = () => {
    setCurrentDateState(new Date());
    setIsCustomDate(false);
  };

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
