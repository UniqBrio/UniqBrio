"use client"

import React, { createContext, useContext } from 'react';
import { roiData, courseROIData } from '@/components/dashboard/financials/types';
// Provides only ROI-related dummy data now; charts fetch their own live data.
interface DataContextType { roiData: any[]; courseROIData: any[] }

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const value: DataContextType = {
    roiData,
    courseROIData,
  } as any; // legacy shape trimmed

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}